export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': 'sermon-interpreter-assist'
      },
      body: JSON.stringify({
        session: {
          type: 'transcription',
          audio: {
            input: {
              transcription: {
                model: 'gpt-live-transcribe'
              },
              turn_detection: null
            }
          }
        }
      })
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || text || 'Could not create realtime client secret.',
        code: data?.error?.code || null,
        type: data?.error?.type || null,
        upstream_status: upstream.status
      });
    }

    return res.status(200).json({
      value: data?.value,
      expires_at: data?.expires_at,
      session_type: data?.session?.type || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Token service failed.' });
  }
}
