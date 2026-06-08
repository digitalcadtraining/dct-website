/**
 * Instamojo service for DCT paid registration.
 *
 * Fixes:
 * 1. Exports isPaymentSuccessful() again, required by registrationPayment.controller.js.
 * 2. MOCK_PAYMENTS is checked at runtime, so .env changes work after server restart.
 * 3. Instamojo object errors are converted to readable messages instead of [object Object].
 */

const DEFAULT_INSTAMOJO_BASE_URL = "https://www.instamojo.com/api/1.1";

function isMockMode() {
  return String(process.env.MOCK_PAYMENTS || "false").trim().toLowerCase() === "true";
}

function baseUrl() {
  return (process.env.INSTAMOJO_BASE_URL || DEFAULT_INSTAMOJO_BASE_URL).replace(/\/+$/, "");
}

function requireCredentials() {
  if (isMockMode()) return;
  if (!process.env.INSTAMOJO_API_KEY || !process.env.INSTAMOJO_AUTH_TOKEN) {
    throw new Error(
      "Instamojo credentials missing. Set INSTAMOJO_API_KEY and INSTAMOJO_AUTH_TOKEN in backend/.env"
    );
  }
}

function headers() {
  return {
    "X-Api-Key": process.env.INSTAMOJO_API_KEY,
    "X-Auth-Token": process.env.INSTAMOJO_AUTH_TOKEN,
  };
}

function stringifyInstamojoError(value) {
  if (!value) return "Instamojo request failed.";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyInstamojoError).join(" | ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${stringifyInstamojoError(val)}`)
      .join(" | ");
  }
  return String(value);
}

function extractErrorMessage(data, fallback) {
  return stringifyInstamojoError(
    data?.message || data?.error || data?.errors || data?.raw || fallback
  );
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function createPaymentRequest({
  amount,
  purpose,
  buyerName,
  email,
  phone,
  redirectUrl,
  webhookUrl,
}) {
  if (isMockMode()) {
    const fakeId = `MOCK_${Date.now()}`;
    const paymentUrl = `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}payment_request_id=${encodeURIComponent(fakeId)}&payment_id=MOCK_PAYMENT`;
    return {
      payment_request_id: fakeId,
      payment_url: paymentUrl,
      raw: { mock: true, id: fakeId, status: "Completed" },
    };
  }

  requireCredentials();

  const form = new URLSearchParams();
  form.set("purpose", purpose || "DCT Registration Fee");
  form.set("amount", String(amount || 999));
  form.set("buyer_name", buyerName || "DCT Student");
  form.set("email", email || "");
  form.set("phone", String(phone || "").replace(/\D/g, "").slice(-10));
  form.set("redirect_url", redirectUrl);
  if (webhookUrl) form.set("webhook", webhookUrl);
  form.set("allow_repeated_payments", "False");
  form.set("send_email", "True");
  form.set("send_sms", "False");

  const response = await fetch(`${baseUrl()}/payment-requests/`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await readResponse(response);

  if (!response.ok || data?.success === false) {
    const msg = extractErrorMessage(data, "Instamojo payment request failed.");
    throw new Error(`[Instamojo ${response.status}] ${msg}`);
  }

  const paymentRequest = data.payment_request || data;
  const paymentRequestId = paymentRequest.id || paymentRequest.payment_request_id;
  const paymentUrl = paymentRequest.longurl || paymentRequest.long_url || paymentRequest.payment_url;

  if (!paymentRequestId || !paymentUrl) {
    throw new Error("Instamojo did not return payment_request_id/payment_url. Please check Instamojo credentials and API response.");
  }

  return {
    payment_request_id: paymentRequestId,
    payment_url: paymentUrl,
    raw: data,
  };
}

async function getPaymentRequest(paymentRequestId) {
  if (isMockMode() || String(paymentRequestId || "").startsWith("MOCK_")) {
    return {
      success: true,
      payment_request: {
        id: paymentRequestId,
        status: "Completed",
        payments: [{ payment_id: "MOCK_PAYMENT", status: "Credit" }],
      },
    };
  }

  requireCredentials();

  const response = await fetch(`${baseUrl()}/payment-requests/${paymentRequestId}/`, {
    method: "GET",
    headers: headers(),
  });

  const data = await readResponse(response);

  if (!response.ok || data?.success === false) {
    const msg = extractErrorMessage(data, "Unable to verify Instamojo payment.");
    throw new Error(`[Instamojo ${response.status}] ${msg}`);
  }

  return data;
}

function isPaymentSuccessful(instamojoData, paymentId = "") {
  const paymentRequest = instamojoData?.payment_request || instamojoData || {};
  const requestStatus = String(paymentRequest.status || "").toLowerCase();

  const payments = Array.isArray(paymentRequest.payments)
    ? paymentRequest.payments
    : Array.isArray(instamojoData?.payments)
      ? instamojoData.payments
      : [];

  const targetPayment = payments.find((p) => {
    if (!paymentId) return true;
    return String(p.payment_id || p.id || "") === String(paymentId);
  }) || payments[0];

  const paymentStatus = String(
    targetPayment?.status || targetPayment?.payment_status || targetPayment?.status_text || ""
  ).toLowerCase();

  const successfulRequestStatuses = ["completed", "paid", "success", "successful"];
  const successfulPaymentStatuses = ["credit", "completed", "paid", "success", "successful"];

  return successfulRequestStatuses.includes(requestStatus) ||
    successfulPaymentStatuses.includes(paymentStatus);
}

module.exports = {
  createPaymentRequest,
  getPaymentRequest,
  isPaymentSuccessful,
};
