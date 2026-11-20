import { paypalAccessToken, paypalRequest } from "./_lib/paypal.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const orderID = req.body?.orderID;
  if (typeof orderID !== "string" || !/^[A-Z0-9-]{8,80}$/i.test(orderID)) {
    return res.status(400).json({ error: "Invalid PayPal order." });
  }
  try {
    const token = await paypalAccessToken();
    const order = await paypalRequest("/v2/checkout/orders/" + encodeURIComponent(orderID), token);
    if (order.status === "COMPLETED") {
      const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture || capture.status !== "COMPLETED" || capture.amount?.currency_code !== "USD") {
        return res.status(409).json({ error: "Payment could not be verified." });
      }
      return res.status(200).json({ success: true, captureID: capture.id });
    }
    const result = await paypalRequest("/v2/checkout/orders/" + encodeURIComponent(orderID) + "/capture", token, {
      method: "POST",
      headers: { "PayPal-Request-Id": "roofarts-capture-" + orderID },
      body: "{}"
    });
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (result.status !== "COMPLETED" || !capture || capture.status !== "COMPLETED" || capture.amount?.currency_code !== "USD") {
      return res.status(409).json({ error: "PayPal has not confirmed this payment." });
    }
    return res.status(200).json({ success: true, captureID: capture.id });
  } catch {
    return res.status(502).json({ error: "Unable to confirm payment with PayPal. Please contact RoofArts before retrying." });
  }
}
