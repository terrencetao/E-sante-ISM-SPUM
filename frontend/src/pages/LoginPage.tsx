import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, setAuthSession } from "../services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const token = await login(email, pin);
      setAuthSession(token.access_token, token.email ?? email, token.role_name);
      navigate("/dashboard");
    } catch {
      setError("Identifiants invalides");
    }
  };

  return (
    <main className="container">
      <h1>Connexion Intervenant</h1>
      <form onSubmit={onSubmit} className="card">
        <label>
          Courriel
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          PIN (4 chiffres)
          <input value={pin} onChange={(e) => setPin(e.target.value)} minLength={4} maxLength={4} required />
        </label>
        <button type="submit">Se connecter</button>
        {error ? <p className="error">{error}</p> : null}
      </form>
    </main>
  );
}
