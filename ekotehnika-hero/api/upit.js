// The shop's form, POST /api/upit, sent on as an e-mail through Resend. A Servis request goes to servis@ekotehnika.rs, every other to
// info@ekotehnika.rs. GET answers whether the form sends at all, so the page can say plainly that it is a test until the key is set.
// Settings on the Vercel project, none of them in the repo.
//   RESEND_API_KEY     the key, without it nothing is sent and every request answers { ok: true, test: true }
//   FORM_FROM          the sender, a verified domain on Resend, by default the Resend test sender
//   FORM_TO_SALES      by default info@ekotehnika.rs
//   FORM_TO_SERVICE    by default servis@ekotehnika.rs
const TEME = { kupovina: 'Kupovina', najam: 'Najam', servis: 'Servis' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

export default async function handler(req, res) {
  const key = process.env.RESEND_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ live: Boolean(key) });
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let b = req.body;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch {
      b = {};
    }
  }
  b = b || {};
  // a bot fills the field people never see, it gets the answer a person would and nothing is sent
  if (clip(b.website, 200)) return res.status(200).json({ ok: true, test: !key });

  const f = {
    tema: TEME[b.tema] ? b.tema : 'kupovina',
    ime: clip(b.ime, 80),
    prezime: clip(b.prezime, 80),
    firma: clip(b.firma, 120),
    telefon: clip(b.telefon, 40),
    email: clip(b.email, 120),
    model: clip(b.modelName, 160),
    poruka: clip(b.poruka, 4000),
  };
  const bad = !f.ime || !f.prezime || f.telefon.replace(/[^\d]/g, '').length < 6 || !EMAIL.test(f.email) || b.saglasnost !== true;
  if (bad) return res.status(400).json({ ok: false });
  if (!key) return res.status(200).json({ ok: true, test: true });

  const to = f.tema === 'servis' ? process.env.FORM_TO_SERVICE || 'servis@ekotehnika.rs' : process.env.FORM_TO_SALES || 'info@ekotehnika.rs';
  const from = process.env.FORM_FROM || 'Ekotehnika sajt <onboarding@resend.dev>';
  const subject = `Upit sa sajta, ${TEME[f.tema]}${f.model ? `, ${f.model}` : ''}`;
  const text = [
    `Tema: ${TEME[f.tema]}`,
    `Model: ${f.model || 'bez modela'}`,
    `Ime i prezime: ${f.ime} ${f.prezime}`,
    `Firma: ${f.firma || '-'}`,
    `Telefon: ${f.telefon}`,
    `E-mail: ${f.email}`,
    '',
    f.poruka || '(bez poruke)',
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: f.email, subject, text }),
    });
    if (!r.ok) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true, test: false });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
