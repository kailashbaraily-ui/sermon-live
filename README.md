# Sermon Interpreter Assist — AI version

Purpose: help a human Nepali interpreter keep up with a fast English Christian sermon.

## What changed from the basic browser version

- Uses OpenAI `gpt-live-transcribe` instead of Chrome SpeechRecognition.
- Adds a Christian-sermon transcription prompt and keyword hints.
- Uses recent English sermon context when producing the Nepali line to say.
- Uses client-side voice activity detection and forces a segment about every 4.5 seconds during continuous fast speech, so the interpreter does not wait for a long pause.
- Shows a short context note only when a phrase/reference needs explanation.
- Keeps the standard API key on the server; it is never placed in the browser HTML.

## Important

ChatGPT Plus and OpenAI API billing are separate. You need an OpenAI API key with API billing enabled.

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. In Vercel Project Settings -> Environment Variables, add `OPENAI_API_KEY`.
3. Redeploy.
4. Open the resulting HTTPS URL in Chrome on the phone.
5. Allow microphone permission and press **Start live assist**.

Optional: set `INTERPRET_MODEL` to another Responses API text model. Default is `gpt-6-luna` for low-latency interpretation.

## Microphone placement

The transcription token is configured with far-field noise reduction because the phone may be listening to a preacher/loudspeaker from a room. Put the phone where the English speaker is clear and avoid placing it directly beside the Nepali interpreter's loudspeaker/microphone if possible.

## Test phrases

- Jesus loves me, this I know, for the Bible tells me so.
- We are saved by grace through faith, not by our works.
- Paul is referring back to the promise God made to Abraham.
- Turn with me to First Corinthians chapter thirteen, verse four.

## Limits

No speech recognizer or translation system is perfect. Use this as an interpreter aid, especially for fast speech, unfamiliar phrases, memory support, and context—not as an infallible transcript.
