// Trưa Nay – máy chủ gửi thông báo đẩy (Cloudflare Worker)
// Dữ liệu app vẫn ở Firebase. Worker này chỉ giữ "địa chỉ nhận thông báo" của từng máy (kho KV tên SUBS)
// và gửi thông báo khi app yêu cầu. Khóa VAPID được tự tạo ở lần chạy đầu và cất trong KV.

const APP_URL = "https://bobo2912.github.io/trua-nay/";
const MAX_SUBS_PER_USER = 6;
const MAX_PUSH_PER_HOUR = 40;

const te = new TextEncoder();
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });

const b64u = (buf) => { let s = ""; for (const c of new Uint8Array(buf)) s += String.fromCharCode(c); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = (s) => { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); s += "=".repeat((4 - (s.length % 4)) % 4); return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
const cat = (...parts) => { const arrs = parts.map((p) => (p instanceof Uint8Array ? p : new Uint8Array(p))); const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0)); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };
const sha = async (s) => b64u(await crypto.subtle.digest("SHA-256", te.encode(s)));
async function hmac(key, data) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

/* ---------- VAPID keys (auto-created once) ---------- */
async function vapid(env) {
  let v = await env.SUBS.get("vapid", "json");
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    v = { jwk: await crypto.subtle.exportKey("jwk", kp.privateKey), pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)) };
    await env.SUBS.put("vapid", JSON.stringify(v));
  }
  return v;
}
async function vapidHeader(env, endpoint) {
  const v = await vapid(env);
  const head = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(te.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
  const key = await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(head + "." + body));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${v.pub}`;
}

/* ---------- Web Push payload encryption (RFC 8291, aes128gcm) ---------- */
async function encrypt(sub, text) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const as = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const ikm = await hmac(await hmac(auth, ecdh), cat(te.encode("WebPush: info\0"), uaPub, asPub, [1]));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(te.encode("Content-Encoding: aes128gcm\0"), [1]))).slice(0, 16);
  const nonce = (await hmac(prk, cat(te.encode("Content-Encoding: nonce\0"), [1]))).slice(0, 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(te.encode(text), [2])));
  const head = new Uint8Array(86);
  head.set(salt, 0); new DataView(head.buffer).setUint32(16, 4096); head[20] = 65; head.set(asPub, 21);
  return cat(head, ct);
}
async function sendPush(env, sub, payload) {
  const body = await encrypt(sub, JSON.stringify(payload));
  return fetch(sub.endpoint, {
    method: "POST",
    headers: { TTL: "86400", Urgency: "high", "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", Authorization: await vapidHeader(env, sub.endpoint) },
    body,
  });
}

/* ---------- message templates (app chỉ gửi số liệu, chữ do Worker tạo) ---------- */
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const vnd = (n) => Math.max(0, Math.round(+n || 0)).toLocaleString("vi-VN") + "đ";
function message(kind, b) {
  const from = clean(b.from, 30) || "Ai đó", place = clean(b.place, 40), amt = vnd(b.amount), at = place ? " · " + place : "";
  switch (kind) {
    case "sent": return { title: "💸 Đã chuyển tiền", body: `${from} báo đã chuyển ${amt}${at}. Kiểm tra tài khoản rồi xác nhận nhé.` };
    case "paid": return { title: "✅ Đã xác nhận", body: `${from} đã nhận ${amt}${at}.` };
    case "bill": return { title: "🧾 Bill mới", body: `${from} thêm bạn vào bill${at}. Phần của bạn ${amt}.` };
    case "remind": return { title: "⏰ Nhắc tiền cơm", body: `${from} nhắc bạn trả ${amt}${at}.` };
    case "poll": return { title: "🍜 Bình chọn trưa nay", body: `${from} rủ bạn vote${at}.` };
    case "test": return { title: "🔔 Trưa Nay", body: "Thông báo đã hoạt động trên máy này." };
  }
  return null;
}

const validPid = (p) => typeof p === "string" && /^[a-z0-9]{16,40}$/.test(p);

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);
    try {
      if (!env.SUBS) return json({ ok: false, error: "Chưa gắn kho KV tên SUBS cho Worker (Settings → Bindings)." }, 500);
      if (url.pathname === "/vapid") return json({ key: (await vapid(env)).pub });
      if (req.method !== "POST") return json({ ok: true, app: "Trưa Nay push", kv: true });
      const b = await req.json().catch(() => ({}));

      if (url.pathname === "/subscribe" || url.pathname === "/unsubscribe") {
        if (!validPid(b.pid) || typeof b.secret !== "string" || b.secret.length < 20) return json({ error: "bad request" }, 400);
        const h = await sha(b.pid + "." + b.secret);
        const rec = (await env.SUBS.get("u:" + b.pid, "json")) || { h, subs: [] };
        if (rec.h !== h) return json({ error: "forbidden" }, 403);
        const ep = url.pathname === "/subscribe" ? b.sub && b.sub.endpoint : b.endpoint;
        if (typeof ep !== "string" || !ep.startsWith("https://")) return json({ error: "bad endpoint" }, 400);
        rec.subs = rec.subs.filter((s) => s.endpoint !== ep);
        if (url.pathname === "/subscribe") {
          const k = b.sub.keys || {};
          if (!k.p256dh || !k.auth) return json({ error: "bad keys" }, 400);
          rec.subs.unshift({ endpoint: ep, keys: { p256dh: k.p256dh, auth: k.auth }, at: Date.now() });
          rec.subs = rec.subs.slice(0, MAX_SUBS_PER_USER);
        }
        await env.SUBS.put("u:" + b.pid, JSON.stringify(rec));
        return json({ ok: true, devices: rec.subs.length });
      }

      if (url.pathname === "/notify") {
        const msg = message(b.kind, b);
        const to = [...new Set(Array.isArray(b.to) ? b.to : [])].filter(validPid).slice(0, 20);
        if (!msg || !to.length) return json({ error: "bad request" }, 400);
        const link = /^#[bpv]=[a-z0-9]{16,40}$/.test(b.url || "") ? b.url : "";
        const hour = new Date().toISOString().slice(0, 13);
        let sent = 0;
        for (const pid of to) {
          const rec = await env.SUBS.get("u:" + pid, "json");
          if (!rec || !rec.subs.length) continue;
          const rk = "r:" + pid + ":" + hour, n = +((await env.SUBS.get(rk)) || 0);
          if (n >= MAX_PUSH_PER_HOUR) continue;
          await env.SUBS.put(rk, String(n + 1), { expirationTtl: 7200 });
          let changed = false;
          for (const s of [...rec.subs]) {
            const r = await sendPush(env, s, { ...msg, url: link, tag: b.kind + (link || "") });
            if (r.status === 404 || r.status === 410) { rec.subs = rec.subs.filter((x) => x.endpoint !== s.endpoint); changed = true; }
            else if (r.ok) sent++;
          }
          if (changed) await env.SUBS.put("u:" + pid, JSON.stringify(rec));
        }
        return json({ ok: true, sent });
      }
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ ok: false, error: String((e && e.message) || e) }, 500);
    }
  },
};
