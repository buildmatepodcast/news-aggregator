/** Fire-and-forget webhook ping (Slack/Discord-compatible {text: string} payload). */
export async function sendAlert(message: string): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.error("[alert]", message);
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `:rotating_light: Construction News: ${message}` }),
    });
  } catch (err) {
    console.error("[alert] failed to send webhook:", err);
  }
}
