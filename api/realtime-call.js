export const config = { api: { bodyParser: false } };

const christianKeywords = [
  'Jesus Christ','Jesus','Christ','Holy Spirit','God','Lord','grace','salvation','faith','repentance',
  'resurrection','righteousness','sanctification','redemption','covenant','gospel','Scripture','Bible',
  'church','prayer','worship','sin','forgiveness','cross','crucifixion','kingdom of God','eternal life',
  'born again','disciple','disciples','apostle','apostles','Moses','Abraham','David','Paul','Peter','John',
  'Matthew','Mark','Luke','Romans','Corinthians','Galatians','Ephesians','Philippians','Colossians',
  'Thessalonians','Timothy','Hebrews','Revelation','Genesis','Exodus','Psalms','Proverbs','Isaiah',
  'Jeremiah','Ezekiel','Daniel'
];

async function readSdp(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function makeMultipart(sdp, session) {
  const boundary = '----sermonInterpreter' + Math.random().toString(16).slice(2);
  const body = [
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="sdp"\r\n',
    'Content-Type: application/sdp\r\n\r\n',
    sdp,
    '\r\n',
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="session"\r\n',
    'Content-Type: application/json\r\n\r\n',
    JSON.stringify(session),
    '\r\n',
    `--${boundary}--\r\n`
  ].join('');
  return { boundary, body: Buffer.from(body, 'utf8') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('POST only');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).send('OPENAI_API_KEY is not configured on the server.');

  try {
    let sdp = await readSdp(req);
    sdp = sdp.replace(/^\uFEFF/, '');
    if (!sdp.trimStart().startsWith('v=0')) return res.status(400).send('Missing or invalid WebRTC SDP offer.');
    if (!sdp.endsWith('\r\n')) sdp = sdp.replace(/[\r\n]+$/, '') + '\r\n';

    const session = {
      type: 'realtime',
      model: 'gpt-realtime-2.1-mini',
      output_modalities: ['text'],
      audio: {
        input: {
          noise_reduction: { type: 'far_field' },
          transcription: {
            model: 'gpt-live-transcribe',
            prompt: 'Live Christian church sermon in English. Preserve Bible book names, people, quotations, theological vocabulary, numbers, verse references, and church terminology exactly as spoken.',
            keywords: christianKeywords,
            languages: ['en']
          },
          turn_detection: null
        }
      }
    };

    const mp = makeMultipart(sdp, session);
    const upstream = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Safety-Identifier': 'sermon-interpreter-assist',
        'Content-Type': `multipart/form-data; boundary=${mp.boundary}`,
        'Content-Length': String(mp.body.length)
      },
      body: mp.body
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).send(text || `OpenAI realtime call failed (${upstream.status}).`);
    }

    res.setHeader('Content-Type', 'application/sdp');
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).send(err?.message || 'Realtime call setup failed.');
  }
}
