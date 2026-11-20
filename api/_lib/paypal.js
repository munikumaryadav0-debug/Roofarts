const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
export const PAYPAL_API = mode === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export function paypalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials are not configured.");
  return { clientId, secret };
}

export async function paypalAccessToken() {
  const { clientId, secret } = paypalCredentials();
  const auth = Buffer.from(clientId + ":" + secret).toString("base64");
  const response = await fetch(PAYPAL_API + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + auth,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error("Could not authenticate with PayPal.");
  }
  return data.access_token;
}

export async function paypalRequest(path, token, options = {}) {
  const response = await fetch(PAYPAL_API + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "PayPal request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}
