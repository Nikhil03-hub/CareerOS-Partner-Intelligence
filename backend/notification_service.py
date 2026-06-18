"""Unified notification service: SendGrid email + Telegram bot.

All events are logged to MongoDB `notification_log` even when external
integrations are not configured (so the admin panel always has an activity
feed). Supports plain HTML email and email-with-.ics-attachment for invites.
"""
from __future__ import annotations

import os
import base64
import logging
from datetime import datetime, timezone
from typing import Optional, List

import httpx
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition

logger = logging.getLogger("notifications")


async def _log(db, event: str, channel: str, recipient: str, subject: str, status: str, detail: str = ""):
    await db.notification_log.insert_one({
        "event": event,
        "channel": channel,
        "recipient": recipient,
        "subject": subject,
        "status": status,
        "detail": detail,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


def _send_email_sync(to_email: str, subject: str, html_body: str,
                     attachments: Optional[List[dict]] = None) -> tuple[bool, str]:
    api_key = os.environ.get("SENDGRID_API_KEY", "").strip()
    sender = os.environ.get("SENDER_EMAIL", "careeros.notify@careeros.app")
    if not api_key:
        return False, "SENDGRID_API_KEY not configured (simulated)"
    try:
        message = Mail(from_email=sender, to_emails=to_email,
                       subject=subject, html_content=html_body)
        for att in (attachments or []):
            a = Attachment()
            a.file_content = FileContent(base64.b64encode(att["content"]).decode("ascii"))
            a.file_name = FileName(att["filename"])
            a.file_type = FileType(att.get("mime_type", "application/octet-stream"))
            a.disposition = Disposition("attachment")
            message.attachment = a
        sg = SendGridAPIClient(api_key)
        resp = sg.send(message)
        return resp.status_code in (200, 202), f"status={resp.status_code}"
    except Exception as exc:  # noqa: BLE001
        return False, f"sendgrid error: {exc}"


async def _send_telegram(text: str) -> tuple[bool, str]:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False, "TELEGRAM not configured (simulated)"
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
            return r.status_code == 200, f"status={r.status_code}"
    except Exception as exc:  # noqa: BLE001
        return False, f"telegram error: {exc}"


def _wrap_email(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family: -apple-system, 'Segoe UI', sans-serif; background:#F5F3EE; padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(10,10,10,0.1);">
        <div style="padding:32px;border-bottom:1px solid rgba(10,10,10,0.1);">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">CareerOS · Campus Intelligence</div>
          <h1 style="margin:8px 0 0;font-size:24px;color:#0a0a0a;letter-spacing:-0.02em;">{title}</h1>
        </div>
        <div style="padding:32px;color:#333;line-height:1.6;font-size:15px;">{body_html}</div>
        <div style="padding:20px 32px;background:#F5F3EE;color:#888;font-size:12px;">
          You are receiving this because your institution is a CareerOS partner.
        </div>
      </div>
    </div>
    """


async def notify(
    db, *, event: str, to_email: Optional[str], subject: str, title: str,
    body_html: str, telegram_text: Optional[str] = None,
    attachments: Optional[List[dict]] = None,
):
    """Fan-out a notification to Email + Telegram and log it."""
    html = _wrap_email(title, body_html)
    if to_email:
        ok, detail = _send_email_sync(to_email, subject, html, attachments=attachments)
        await _log(db, event, "email", to_email, subject,
                   "sent" if ok else ("failed" if os.environ.get("SENDGRID_API_KEY") else "simulated"), detail)
    tg = telegram_text or f"<b>{title}</b>\n{subject}"
    ok_t, detail_t = await _send_telegram(tg)
    await _log(db, event, "telegram", os.environ.get("TELEGRAM_CHAT_ID", "admin-channel"),
               subject, "sent" if ok_t else "simulated", detail_t)
