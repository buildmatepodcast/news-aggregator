/**
 * Sends the sign-in link via Resend if RESEND_API_KEY is configured.
 * Without a key (nothing wired up yet), returns sent:false so the caller can
 * fall back to handing the link back directly - same fallback pattern as
 * the enrichment worker's rule-based scorer when ANTHROPIC_API_KEY is unset.
 */
export async function sendMagicLinkEmail(email: string, link: string): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Built <onboarding@resend.dev>";
  if (!apiKey) return { sent: false };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Your sign-in link",
        html: `<p>Click below to sign in:</p><p><a href="${link}">${link}</a></p><p>This link expires in 15 minutes.</p>`,
      }),
    });
    return { sent: res.ok };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false };
  }
}
