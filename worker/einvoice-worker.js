const EINVOICE_API = "https://api.einvoice.nat.gov.tw/PB2CAPIVAN/invapp/InvApp";
const ALLOWED_ORIGIN = "https://joshchen0722.github.io";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return corsResponse(null, 204);
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/invoices") {
      return corsResponse({ ok: false, message: "Not found" }, 404);
    }
    if (!env.EINVOICE_APP_ID) {
      return corsResponse({ ok: false, message: "尚未設定 EINVOICE_APP_ID" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse({ ok: false, message: "JSON 格式錯誤" }, 400);
    }

    const barCode = String(body.barCode || "").trim();
    const verifyCode = String(body.verifyCode || "").trim();
    const startDate = toEinvoiceDate(body.startDate);
    const endDate = toEinvoiceDate(body.endDate);
    if (!barCode || !verifyCode || !startDate || !endDate) {
      return corsResponse({ ok: false, message: "缺少手機條碼、驗證碼或日期" }, 400);
    }

    const form = new URLSearchParams({
      version: "0.5",
      action: "carrierInvChk",
      cardType: "3J0002",
      barCode,
      verifyCode,
      startDate,
      endDate,
      onlyWinningInv: "N",
      uuid: crypto.randomUUID(),
      appID: env.EINVOICE_APP_ID,
    });

    const upstream = await fetch(EINVOICE_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const raw = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return corsResponse({ ok: false, message: "財政部回應不是 JSON", raw }, 502);
    }

    if (payload.code && Number(payload.code) !== 200) {
      return corsResponse({ ok: false, message: payload.msg || "財政部查詢失敗", raw: payload }, 400);
    }
    return corsResponse({ ok: true, raw: payload, invoices: normalizeInvoices(payload) });
  },
};

function corsResponse(data, status = 200) {
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (status === 204) return new Response(null, { status, headers });
  return new Response(JSON.stringify(data), { status, headers });
}

function toEinvoiceDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return "";
  return `${match[1]}/${match[2].padStart(2, "0")}/${match[3].padStart(2, "0")}`;
}

function normalizeInvoices(payload) {
  const rows = Array.isArray(payload.details) ? payload.details : [];
  return rows.map((item) => ({
    invNum: item.invNum || item.invoiceNumber || "",
    invDate: item.invDate || item.invoiceDate || "",
    sellerName: item.sellerName || item.seller || "",
    amount: item.amount || item.invAmount || item.totalAmount || "",
    raw: item,
  }));
}
