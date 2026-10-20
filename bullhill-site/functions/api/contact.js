// POST /api/contact, the contact form. A Cloudflare Pages Function. It checks the fields again, drops
// bots quietly, and emails the request to BullHill through Resend, with the sender as reply-to.
// Pages secrets and variables
//   RESEND_API_KEY  required, from Filip's Resend account, never in the repo
//   CONTACT_TO      optional, defaults to bullhilldoo@gmail.com, set to Filip's address for the first test
//   CONTACT_FROM    optional, defaults to BullHill website <noreply@bullhill.co>, a domain verified in Resend

const MAX = { role: 60, name: 120, company: 160, email: 200, phone: 60, place: 160, length: 60, message: 4000, lang: 2 };
const LABELS = { role: 'Role', name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', place: 'Place', length: 'Length', message: 'Message', lang: 'Site language' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// a person needs longer than this to fill the four required fields
const MIN_MS = 2500;

const esc = (s) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// The whole check and send, apart from the request, so the Vite dev server can run it too.
export async function handle(input, env, fetchFn = fetch) {
  if (!input || typeof input !== 'object') return { status: 400, body: { ok: false, error: 'bad_request' } };
  // a bot filled the hidden field or sent faster than a person can, answer as if sent and drop it
  if (String(input.website ?? '').trim() !== '' || !(Number(input.ms) >= MIN_MS)) return { status: 200, body: { ok: true } };

  const f = {};
  for (const k of Object.keys(MAX)) f[k] = String(input[k] ?? '').replace(/\r/g, '').trim().slice(0, MAX[k]);
  if (!f.role || !f.name || !f.phone || !EMAIL_RE.test(f.email)) return { status: 422, body: { ok: false, error: 'invalid' } };
  if (!env.RESEND_API_KEY) return { status: 503, body: { ok: false, error: 'not_configured' } };

  const oneLine = (s) => s.replace(/\s+/g, ' ');
  const rows = Object.keys(MAX).filter((k) => f[k]);
  const text = rows.map((k) => `${LABELS[k]}\n${f[k]}\n`).join('\n');
  const html = `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .map((k) => `<tr><td style="color:#5c5c5c;vertical-align:top">${LABELS[k]}</td><td style="white-space:pre-wrap">${esc(f[k])}</td></tr>`)
    .join('')}</table>`;

  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'BullHill website <noreply@bullhill.co>',
      to: [env.CONTACT_TO || 'bullhilldoo@gmail.com'],
      reply_to: f.email,
      subject: oneLine(`Website request, ${f.role}, ${f.name}${f.company ? `, ${f.company}` : ''}`).slice(0, 200),
      text,
      html,
    }),
  });
  if (!res.ok) {
    console.error('resend', res.status, await res.text().catch(() => ''));
    return { status: 502, body: { ok: false, error: 'send_failed' } };
  }
  return { status: 200, body: { ok: true } };
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return Response.json({ ok: false, error: 'origin' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > 20000) return Response.json({ ok: false, error: 'too_large' }, { status: 413 });
  let input = null;
  try {
    input = await request.json();
  } catch {
    input = null;
  }
  const r = await handle(input, env);
  return Response.json(r.body, { status: r.status });
}
