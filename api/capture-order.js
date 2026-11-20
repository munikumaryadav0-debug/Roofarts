import { paypalAccessToken, paypalRequest } from "./_lib/paypal.js";

function verifiedCapture(order, result = order) {
  const unit = order.purchase_units?.[0];
  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  const expected = unit?.amount;
  const paid = capture?.amount;
  return Boolean(
    capture &&
    capture.status === "COMPLETED" &&
    expected?.currency_code === "USD" &&
    paid?.currency_code === "USD" &&
    Number(expected.value).toFixed(2) === Number(paid.value).toFixed(2)
  ) ? capture : null;
}

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
      const capture = verifiedCapture(order);
      if (!capture) return res.status(409).json({ error: "Payment could not be verified." });
      return res.status(200).json({ success: true, captureID: capture.id });
    }
    if (order.status !== "APPROVED") {
      return res.status(409).json({ error: "PayPal order is not approved for capture." });
    }
    const result = await paypalRequest("/v2/checkout/orders/" + encodeURIComponent(orderID) + "/capture", token, {
      method: "POST",
      headers: { "PayPal-Request-Id": "roofarts-capture-" + orderID },
      body: "{}"
    });
    const capture = verifiedCapture(order, result);
    if (result.status !== "COMPLETED" || !capture) {
      return res.status(409).json({ error: "PayPal has not confirmed this payment." });
    }
    return res.status(200).json({ success: true, captureID: capture.id });
  } catch {
    return res.status(502).json({ error: "Unable to confirm payment with PayPal. Please contact RoofArts before retrying." });
  }
}
