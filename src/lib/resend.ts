import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'YATRA <noreply@purama.dev>'

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: '🌿 Bienvenue dans YATRA',
    html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="background:#0A0A0F;color:#F8FAFC;font-family:-apple-system,sans-serif;padding:32px;margin:0">
<div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
<h1 style="margin:0 0 16px;font-size:28px">Bienvenue ${name} 🌿</h1>
<p style="line-height:1.6;color:rgba(255,255,255,0.75)">Tu viens de rejoindre YATRA. Chaque pas, chaque coup de pédale, chaque trajet propre te rapporte. Et chaque droit auquel tu as droit, on le détecte pour toi.</p>
<p><a href="https://yatra.purama.dev/dashboard" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#22C55E,#06B6D4);color:#0A0A0F;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">Démarrer mon premier trajet →</a></p>
<p style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:32px">YATRA — l'écosystème PURAMA</p>
</div></body></html>`,
  })
}

export async function sendCommissionEmail(email: string, name: string, amount: number, source: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `💰 +${amount.toFixed(2)} € sur ton wallet YATRA`,
    html: `<div style="font-family:sans-serif"><h1>Bravo ${name} !</h1><p>Tu viens de recevoir <strong>${amount.toFixed(2)} €</strong> (${source}).</p><a href="https://yatra.purama.dev/dashboard/wallet">Voir mon wallet</a></div>`,
  })
}

export async function sendContestResultEmail(email: string, name: string, rank: number, amount: number) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `🏆 Concours YATRA — tu es ${rank}${rank === 1 ? 'er' : 'e'}`,
    html: `<div style="font-family:sans-serif"><h1>Bravo ${name} !</h1><p>Rang ${rank} — gain <strong>${amount.toFixed(2)} €</strong> crédité dans ton wallet.</p></div>`,
  })
}
