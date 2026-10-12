export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Missing text' });

  try {
    const g = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ne&dt=t&q=' + encodeURIComponent(text));
    if (g.ok) {
      const data = await g.json();
      const translated = Array.isArray(data?.[0]) ? data[0].map(x => x?.[0] || '').join('').trim() : '';
      if (translated) return res.status(200).json({ text: translated, provider: 'google-test' });
    }
  } catch {}

  try {
    const m = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|ne');
    if (m.ok) {
      const data = await m.json();
      const translated = String(data?.responseData?.translatedText || '').trim();
      if (translated) return res.status(200).json({ text: translated, provider: 'mymemory-test' });
    }
  } catch {}

  return res.status(502).json({ error: 'Free translation service is unavailable right now.' });
}
