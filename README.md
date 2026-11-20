# RoofArts — PayPal service checkout

This branch adds USD service pricing, an interactive cart, and PayPal Checkout API routes.

## Before launch

The prices in `index.html` and `api/_lib/catalog.js` are illustrative placeholders. Confirm the real RoofArts rates and update both catalogues to the same values before accepting payments.

## PayPal configuration

1. Create a PayPal Developer app and obtain its Client ID and Secret.
2. In Vercel, open the project settings and add these Environment Variables:
   - `PAYPAL_CLIENT_ID` — PayPal app Client ID
   - `PAYPAL_CLIENT_SECRET` — PayPal app Secret (server-side only; never expose it in browser code)
   - `PAYPAL_MODE` — `sandbox` for testing; change to `live` only after testing and merchant approval
3. Redeploy after setting the variables.

The public Client ID is returned by `/api/paypal-config`; the Secret is only used by server-side API functions.

## Checkout flow

- `GET /api/paypal-config` returns the public Client ID and USD currency.
- `POST /api/create-order` accepts service IDs and quantities, recalculates the total from the server-side catalogue, and creates a PayPal order.
- `POST /api/capture-order` captures an approved order and verifies the completed USD capture amount against the order amount.

The browser never supplies a price to the payment API. The server catalogue is authoritative.

## Production checklist

- Replace sample rates in both catalogues and review the report scope / terms.
- Test successful, cancelled, declined and duplicate payment flows using PayPal Sandbox.
- Configure PayPal webhooks and durable order/payment records before production use. Store order IDs and statuses, process webhook events idempotently, and reconcile payment records with fulfilled measurement jobs.
- Add customer contact/property intake and an order confirmation email/workflow.
- Set `PAYPAL_MODE=live` only after merchant credentials and the live checkout flow have been verified.

Do not commit real credentials to this repository.
