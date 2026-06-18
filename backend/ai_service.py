"""AI helpers — Claude Haiku 4.5 via Emergent LLM key.

Two surfaces used by server.py:
- ai_interview_feedback(report) → str   (editorial 3-paragraph feedback)
- ai_ats_score(resume_text, job_description) → dict (structured JSON score)

Both gracefully degrade if EMERGENT_LLM_KEY is missing or the SDK call fails:
return a deterministic fallback derived from the input data.
"""
from __future__ import annotations

import os
import json
import re
import uuid
import logging
from typing import Optional

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    _HAVE_LLM = True
except Exception:  # noqa: BLE001
    _HAVE_LLM = False

log = logging.getLogger("ai")
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-haiku-4-5-20251001"


def _key() -> Optional[str]:
    return os.environ.get("EMERGENT_LLM_KEY", "").strip() or None


async def _chat(system: str, user: str, *, max_tokens: int = 700) -> Optional[str]:
    """Single-turn non-streaming call (we collect the full response)."""
    if not (_HAVE_LLM and _key()):
        return None
    try:
        chat = (
            LlmChat(api_key=_key(), session_id=f"careeros-{uuid.uuid4().hex[:8]}", system_message=system)
            .with_model(MODEL_PROVIDER, MODEL_NAME)
        )
        # Use send_message (non-streaming) — we want one short response, not a UI stream.
        out = await chat.send_message(UserMessage(text=user))
        return out if isinstance(out, str) else str(out)
    except Exception as exc:  # noqa: BLE001
        log.warning("LLM call failed: %s", exc)
        return None


# ============== INTERVIEW FEEDBACK ==============
INTERVIEW_SYSTEM = (
    "You are an elite placement coach writing concise, useful, candid feedback "
    "for a campus mock interview. Use a warm, editorial tone. Avoid clichés. "
    "Output exactly 3 short paragraphs separated by a blank line: "
    "1) Strengths · 2) Weaknesses · 3) Three concrete next steps the student can do this week. "
    "Do not use bullet markers, emojis, or headings. Keep total length under 220 words."
)


def _fallback_feedback(report: dict) -> str:
    conf = report.get("confidence_score", 60)
    comm = report.get("communication_score", 60)
    tech = report.get("technical_score", 60)
    body = report.get("body_language_score", 60)
    strong = max(("confidence", conf), ("communication", comm), ("technical depth", tech), ("body language", body), key=lambda x: x[1])
    weak = min(("confidence", conf), ("communication", comm), ("technical depth", tech), ("body language", body), key=lambda x: x[1])
    return (
        f"Strong start. Your {strong[0]} ({strong[1]}/100) is the standout — you carried the room when it mattered. "
        f"Panel notes show consistency on the {report.get('type', 'technical')} thread and you handled the open-ended prompts without stalling.\n\n"
        f"Watchpoint: {weak[0]} ({weak[1]}/100) is the thing dragging your overall down. The dip showed up in the middle of the session — recovery was fine, but the lull cost momentum.\n\n"
        f"Next steps this week: (a) record yourself answering five mid-difficulty {report.get('type', 'technical')} questions and review the playback, (b) do one paired mock with a peer focused only on {weak[0]}, (c) write a 90-second self-intro you can deliver on autopilot — so your strong opener becomes a system, not a hope."
    )


async def ai_interview_feedback(report: dict) -> dict:
    """Return {feedback: str, source: 'ai' | 'fallback', model: ...}."""
    prompt = (
        f"Student: {report.get('student_name', 'Candidate')} ({report.get('roll_number', '—')}, "
        f"{report.get('department', '—')}).\n"
        f"Interview type: {report.get('type', 'Technical')}.\n"
        f"Duration: {report.get('duration_min', 30)} minutes.\n"
        f"Scores (0-100): confidence={report.get('confidence_score')}, "
        f"communication={report.get('communication_score')}, "
        f"technical={report.get('technical_score')}, "
        f"body_language={report.get('body_language_score')}, "
        f"overall={report.get('overall_score')}.\n"
        f"Existing panel note: {report.get('feedback', '—')}.\n\n"
        "Write the 3-paragraph feedback now."
    )
    out = await _chat(INTERVIEW_SYSTEM, prompt, max_tokens=500)
    if out and len(out.strip()) > 40:
        return {"feedback": out.strip(), "source": "ai", "model": f"{MODEL_PROVIDER}/{MODEL_NAME}"}
    return {"feedback": _fallback_feedback(report), "source": "fallback", "model": "deterministic"}


# ============== RESUME ATS ==============
ATS_SYSTEM = (
    "You are an Applicant Tracking System (ATS) scoring engine for engineering campus hiring in India. "
    "Given a resume and a job description, return STRICT JSON only — no prose, no markdown, no code fences. "
    "Schema: "
    "{\"ats_score\": int 0-100, "
    "\"keyword_match_pct\": int 0-100, "
    "\"format_score\": int 0-100, "
    "\"missing_keywords\": [str, str, str], "
    "\"strengths\": [str, str, str], "
    "\"weaknesses\": [str, str, str], "
    "\"verdict\": str}. "
    "Be honest. A weak resume should score 40-60, an average one 60-75, a strong one 75-90, exceptional 90+."
)


def _kw_match(text: str, jd: str) -> tuple[int, list]:
    text_l = text.lower()
    # Pull capitalized + multi-word tokens from JD as keywords
    candidates = set()
    for m in re.finditer(r"\b[A-Z][a-zA-Z+#.]{1,}\b|\b[a-z]{3,}\b", jd):
        w = m.group().strip()
        if w.lower() in {"the", "and", "for", "with", "you", "are", "from", "this", "that", "have", "will", "must", "any", "all"}:
            continue
        candidates.add(w)
    matched = [w for w in candidates if w.lower() in text_l]
    missing = [w for w in candidates if w.lower() not in text_l][:8]
    pct = int(round((len(matched) / max(1, len(candidates))) * 100))
    return pct, missing


def _fallback_ats(resume_text: str, jd: str) -> dict:
    kw_pct, missing = _kw_match(resume_text, jd)
    length = len(resume_text.split())
    fmt_score = min(100, max(40, length // 4))  # rough proxy
    ats = int(round(0.6 * kw_pct + 0.4 * fmt_score))
    return {
        "ats_score": ats,
        "keyword_match_pct": kw_pct,
        "format_score": fmt_score,
        "missing_keywords": missing[:5] or ["—"],
        "strengths": ["Clear structure" if length > 250 else "Concise", "Keyword density present"],
        "weaknesses": ["Add more measurable outcomes" if length < 350 else "Trim filler", "Mention missing JD keywords"],
        "verdict": ("Strong" if ats >= 75 else "Average" if ats >= 60 else "Needs work") + " match against the JD.",
        "source": "fallback",
    }


async def ai_ats_score(resume_text: str, job_description: str) -> dict:
    """Return ATS scoring dict. Falls back to deterministic if AI unavailable."""
    if not resume_text.strip():
        return {"ats_score": 0, "keyword_match_pct": 0, "format_score": 0,
                "missing_keywords": ["—"], "strengths": [], "weaknesses": ["Empty resume"],
                "verdict": "Could not parse PDF — please upload a text-based PDF.", "source": "error"}

    # Trim very long resumes to control cost
    rt = resume_text[:8000]
    jd = (job_description or "")[:3000]
    prompt = (
        f"=== JOB DESCRIPTION ===\n{jd or '(generic SDE/software engineer role at a top product company; expects DSA, Python/Java, system design, projects, internships)'}\n\n"
        f"=== RESUME ===\n{rt}\n\n"
        "Score now. Output STRICT JSON only."
    )
    out = await _chat(ATS_SYSTEM, prompt, max_tokens=600)
    if out:
        # Strip code fences if model added any
        clean = out.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```(json)?", "", clean).strip().rstrip("`").strip()
        try:
            parsed = json.loads(clean)
            parsed.setdefault("source", "ai")
            parsed.setdefault("model", f"{MODEL_PROVIDER}/{MODEL_NAME}")
            return parsed
        except json.JSONDecodeError:
            log.warning("LLM returned non-JSON: %s", clean[:120])
    return _fallback_ats(resume_text, job_description or "")
