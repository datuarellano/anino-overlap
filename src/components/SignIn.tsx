import { useState, type FormEvent } from 'react';
import { WrongPasswordError, joinEvent, validateName } from '../lib/api';

interface Props {
  eventId: string;
  onSignedIn: (key: string, name: string) => void;
}

export function SignIn({ eventId, onSignedIn }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateName(name);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const key = await joinEvent(eventId, name, password);
      onSignedIn(key, name.trim());
    } catch (err) {
      if (err instanceof WrongPasswordError) setError(err.message);
      else {
        console.error(err);
        setError('Could not sign in. Check your connection and try again.');
      }
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          className="input"
          autoComplete="nickname"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="pw">
          Password <span className="faint">(optional)</span>
        </label>
        <input
          id="pw"
          className="input"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Signing in…' : 'Continue'}
      </button>
      <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
        Names and passwords only apply to this event. New here? Pick any password to protect your row. Coming back on a
        new device? Use the same name and password.
      </p>
    </form>
  );
}
