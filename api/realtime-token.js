export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  const christianKeywords = [
    'Jesus Christ','Jesus','Christ','Holy Spirit','God','Lord','grace','salvation','faith','repentance',
    'resurrection','righteousness','sanctification','redemption','covenant','gospel','Scripture','Bible',
    'church','prayer','worship','sin','forgiveness','cross','crucifixion','kingdom of God','eternal life',
    'born again','disciple','disciples','apostle','apostles','Moses','Abraham','David','Paul','Peter','John',
    'Matthew','Mark','Luke','Romans','Corinthians','Galatians','Ephesians','Philippians','Colossians',
    'Thessalonians','Timothy','Hebrews','Revelation','Genesis','Exodus','Psalms','Proverbs','Isaiah',
    'Jeremiah','Ezekiel','Daniel'
  ];

  try {
    const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': 'sermon-interpreter-assist'
      },
      body: JSON.stringify({
        expires_after: { anchor: 'created_at', seconds: 600 },
        session: {
          type: 'transcription',
          audio: {
            input: {
              noise_reduction: { type: 'far_field' },
              transcription: {
                model: 'gpt-live-transcribe',
                prompt: 'Live Christian church sermon in English. Transcribe accurately even when the preacher speaks quickly. Preserve Bible book names, people, quotations, theological vocabulary, numbers, verse references, and church terminology. Do not paraphrase.',
                keywords: christianKeywords,
                languages: ['en'],
                delay: 'medium'
              },
              turn_detection: null
            }
          }
        }
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || 'Could not create realtime client secret.',
        code: data?.error?.code || null,
        type: data?.error?.type || null
      });
    }

    return res.status(200).json({ value: data.value, expires_at: data.expires_at });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Token service failed.' });
  }
}
