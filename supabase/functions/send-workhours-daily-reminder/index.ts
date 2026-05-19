// Daily 09:30 Sarajevo Bosnian reminder to submit work hours.
// Cron fires every 15 min; this function only sends when local time is 09:30-09:44 on a weekday.
// Call with { force: true } to bypass the time gate (manual trigger).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RECIPIENTS = [
  'angelina@abmedia-team.com',
  'service@team-abmedia.com',
  'thomas.thomasklein@gmail.com',
  'invoice@team-abmedia.com',
  'jungabmedia@gmail.com',
  'wolfabmedia@gmail.com',
  'marcusabmedia@gmail.com',
  'paulkatz.abmedia@gmail.com',
  'ajosesales36@gmail.com',
  'georgabmediateam@gmail.com',
  'jannes@scoolfinanceedu.com',
  'johan@team-abmedia.com',
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const sarajevoParts = () => {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Sarajevo',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value || ''
  return {
    weekday: get('weekday'), // Mon, Tue, ...
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  }
}

const buildHtml = () => {
  const appUrl = Deno.env.get('APP_URL') || 'https://empriatech.com'
  const link = `${appUrl.replace(/\/$/, '')}/work-hours`
  return `<!doctype html>
<html lang="bs"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#0f172a;padding:20px 28px;color:#ffffff;font-weight:700;font-size:18px;">AB Media Team — empriatech</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Dobro jutro!</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            Molimo Vas da <strong>unesete svoje radne sate</strong> u empriatech sistem.
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            <strong>Rok za unos je danas do 12:00.</strong>
          </p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">
            Ukoliko ne stignete unijeti radne sate do 12:00, morat ćete kontaktirati
            <strong>Selmina</strong> ili <strong>Elvisa</strong> kako bi unos bio odobren naknadno.
          </p>
          <p style="margin:0 0 28px;">
            <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Unesi radne sate</a>
          </p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
            Hvala na saradnji,<br/>AB Media Team
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const force = !!body?.force

    const { weekday, hour, minute } = sarajevoParts()
    const isWeekday = !['Sat', 'Sun'].includes(weekday)
    const inWindow = hour === 9 && minute >= 30 && minute < 45

    if (!force && (!isWeekday || !inWindow)) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'outside window', weekday, hour, minute }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing')

    const html = buildHtml()
    const subject = 'Podsjetnik: Unesite radne sate do 12:00'
    const from = 'AB Media Team <invoice@team-abmedia.com>'

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < RECIPIENTS.length; i++) {
      const to = RECIPIENTS[i]
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from, to: [to], subject, html }),
        })
        if (!res.ok) {
          failed++
          errors.push(`${to}: ${res.status} ${await res.text()}`)
        } else {
          sent++
        }
      } catch (e) {
        failed++
        errors.push(`${to}: ${(e as Error).message}`)
      }
      if (i < RECIPIENTS.length - 1) await sleep(550) // ~2/sec
    }

    return new Response(
      JSON.stringify({ ok: true, sent, failed, total: RECIPIENTS.length, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
