export function Setup() {
  return (
    <div className="card setup" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2>Almost there</h2>
      <p className="sub">This app needs a Firebase project to store events. Add its web config as environment variables:</p>
      <pre>
        {`VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=...
VITE_FB_PROJECT_ID=...
VITE_FB_APP_ID=...`}
      </pre>
      <p className="muted">
        Locally, put these in <code>.env.local</code> and restart <code>npm run dev</code>. For GitHub Pages, add them as
        repository secrets. Full steps are in the README.
      </p>
    </div>
  );
}
