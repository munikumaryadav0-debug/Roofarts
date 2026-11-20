import { paypalCredentials } from "./_lib/paypal.js";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { clientId } = paypalCredentials();
    return res.status(200).json({ clientId, currency: "USD" });
  } catch {
    return res.status(503).json({ error: "PayPal is not configured." });
  }
}
