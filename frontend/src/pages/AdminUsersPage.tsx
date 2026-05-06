import { FormEvent, useEffect, useState } from "react";

import { createUser, listUsers, resetUserPin } from "../services/usersService";
import type { RoleName, User } from "../types/api";

const ROLES: RoleName[] = [
  "administrator_system",
  "administrator_campaign",
  "intervenant_terrain",
  "analyste",
];

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState<RoleName>("intervenant_terrain");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = async () => {
    const rows = await listUsers();
    setUsers(rows);
  };

  useEffect(() => {
    refreshUsers().catch(() => {
      setError("Impossible de charger les utilisateurs");
    });
  }, []);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const created = await createUser({ email, role_name: roleName });
      setEmail("");
      setRoleName("intervenant_terrain");
      setMessage(`Utilisateur cree. PIN temporaire: ${created.temporary_pin}`);
      await refreshUsers();
    } catch {
      setError("Creation utilisateur echouee");
    }
  };

  const onResetPin = async (userId: string) => {
    setError(null);
    setMessage(null);
    try {
      const reset = await resetUserPin(userId);
      setMessage(`PIN reinitialise: ${reset.temporary_pin}`);
      await refreshUsers();
    } catch {
      setError("Reinitialisation PIN echouee");
    }
  };

  return (
    <main className="container">
      <h1>Administration systeme</h1>
      <section className="card">
        <h2>Creer un utilisateur</h2>
        <form onSubmit={onCreate}>
          <label>
            Courriel
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Role
            <select value={roleName} onChange={(e) => setRoleName(e.target.value as RoleName)}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Creer utilisateur</button>
        </form>
        {message ? <p>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="card">
        <h2>Utilisateurs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Courriel</th>
                <th>Role</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.role_name}</td>
                  <td>{user.is_active ? "Oui" : "Non"}</td>
                  <td>
                    <button type="button" onClick={() => onResetPin(user.id)}>
                      Reset PIN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
