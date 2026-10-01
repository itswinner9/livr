export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY) return { skipped: true as const };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "LivRank <noreply@example.com>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    }),
  });
  if (!res.ok) return { skipped: false, error: true as const };
  return { skipped: false, error: false as const };
}
