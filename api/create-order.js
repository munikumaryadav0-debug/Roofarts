import { calculateOrder } from "./_lib/catalog.js";
import { paypalAccessToken, paypalRequest } from "./_lib/paypal.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { lines, total } = calculateOrder(req.body?.items);
    const token = await paypalAccessToken();
    const order = await paypalRequest("/v2/checkout/orders", token, {
      method: "POST",
      headers: { "PayPal-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          description: "RoofArts measurement services",
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: total.toFixed(2) }
            }
          },
          items: lines.map(item => ({
            name: item.name.slice(0, 127),
            quantity: String(item.quantity),
            unit_amount: { currency_code: "USD", value: item.unit.toFixed(2) },
            category: "DIGITAL_GOODS"
          }))
        }]
      })
    });
    return res.status(200).json({ orderID: order.id });
  } catch (error) {
    const clientError = /cart|service|quantity/i.test(error.message);
    return res.status(clientError ? 400 : 502).json({
      error: clientError ? error.message : "Unable to start PayPal checkout. Please try again."
    });
  }
}
