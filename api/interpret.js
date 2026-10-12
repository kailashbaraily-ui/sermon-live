function extractOutputText(data){
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const pieces = [];
  for (const item of (data.output || [])) {
    for (const c of (item.content || [])) {
      if (c && c.type === 'output_text' && typeof c.text === 'string') pieces.push(c.text);
    }
  }
  return pieces.join('\n').trim();
}

function parseResult(text){
  let t = (text || '').trim();
  try {
    const obj = JSON.parse(t);
    if (obj && typeof obj.say === 'string') return { say: obj.say.trim(), note: String(obj.note || '').trim() };
  } catch (_) {}
  const sayMatch = t.match(/(?:^|\n)SAY\s*:\s*([^\n]+)/i);
  const noteMatch = t.match(/(?:^|\n)NOTE\s*:\s*([^\n]+)/i);
  if (sayMatch) return { say: sayMatch[1].trim(), note: noteMatch ? noteMatch[1].trim() : '' };
  return { say: t, note: '' };
}

export default async function handler(req, res){
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'POST only'});
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({error:'OPENAI_API_KEY is not configured on the server.'});

  const current = String(req.body?.current || '').trim();
  const context = String(req.body?.context || '').trim().slice(-3000);
  if (!current) return res.status(400).json({error:'Missing current transcript.'});

  const instructions = `You assist a human Nepali interpreter during a live English Christian sermon.
Translate the CURRENT English speech into natural spoken Nepali that the interpreter can say immediately.
Use PREVIOUS CONTEXT only to resolve pronouns, references, idioms, Bible context, and incomplete phrases; do not repeat old material unless needed for meaning.
Preserve the speaker's meaning, tone, negation, numbers, Bible references, names, and theological distinctions. Use natural Nepali Christian/church vocabulary, not awkward word-for-word machine translation.
Keep the main Nepali concise enough for live interpreting. If the English is a fragment, make the smallest natural Nepali phrase possible without inventing missing facts.
If a phrase/reference would be hard for a live interpreter to understand, add a very short Nepali clarification in note. Otherwise note must be empty.
Return ONLY valid JSON with exactly two string fields: {"say":"...","note":"..."}.`;

  const input = `PREVIOUS CONTEXT:\n${context || '(none)'}\n\nCURRENT ENGLISH:\n${current}`;

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${apiKey}`,
        'Content-Type':'application/json',
        'OpenAI-Safety-Identifier':'sermon-interpreter-assist'
      },
      body:JSON.stringify({
        model: process.env.INTERPRET_MODEL || 'gpt-6-luna',
        instructions,
        input,
        max_output_tokens: 220
      })
    });
    const data = await upstream.json();
    if(!upstream.ok) return res.status(upstream.status).json({error:data?.error?.message || 'Interpretation request failed.'});
    const parsed = parseResult(extractOutputText(data));
    if(!parsed.say) return res.status(502).json({error:'Empty interpretation.'});
    return res.status(200).json(parsed);
  } catch(err){
    return res.status(500).json({error:err.message || 'Interpretation service failed.'});
  }
}
