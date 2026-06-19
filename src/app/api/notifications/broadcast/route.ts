import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, body, type, targetRole } = await req.json()

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (telegramToken && chatId) {
      const message = `📣 *CareerOS Broadcast*\n\n*${title}*\n${body || ''}\n\n_Type: ${type} | To: ${targetRole}_`
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId, text: message,
          parse_mode: 'Markdown',
        }),
      })
    }

    // Resend email notification (placeholder — in production use Resend SDK)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      // Would send email via Resend in production
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[notifications/broadcast]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
