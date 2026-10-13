# Mimi AI Companion

Mobile-first starter for Mimi, a friendly AI voice companion.

## Starter features
- Dark navy starfield with cyan/purple lighting and a friendly CSS robot placeholder.
- Responsive layout for Android phones.
- Hindi browser speech recognition where supported.
- Browser speech output and automatic return to listening after a reply during an active session.
- Optional Gemini, Groq, and OpenRouter settings.
- API key held in page memory only; no keys belong in repository files.
- Basic service-worker shell cache.

## Preview
This is a static site. Enable GitHub Pages in repository Settings → Pages → Deploy from a branch → main → /(root).

## Important limitations
- This is an initial scaffold, not yet the original Three.js Mimi robot project. The CSS robot is a temporary placeholder and should be replaced with the exact original robot/background assets before calling this the finished Mimi build.
- Browser speech support varies. Use HTTPS and grant microphone permission.
- Direct browser-to-provider requests can expose the entered key to browser runtime and may be blocked by provider CORS. For production, route requests through a server-side API and deployment secrets.
- True interruption while Mimi is speaking is browser-dependent and not guaranteed.

## Security
Never commit API keys, passwords, tokens, or .env files. The .env.example file should contain placeholders only.

## License
MIT
