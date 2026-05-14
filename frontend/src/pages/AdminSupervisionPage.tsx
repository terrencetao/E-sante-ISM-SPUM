import { useEffect, useState } from "react";

import { listAuditLogs, listConflicts, resolveConflict } from "../services/adminService";
import type { AuditLog, ConflictLog } from "../types/api";

export function AdminSupervisionPage() {
  const [conflicts, setConflicts] = useState<ConflictLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [conflictRes, auditRes] = await Promise.all([listConflicts(), listAuditLogs()]);
    setConflicts(conflictRes);
    setAuditLogs(auditRes);
  };

  useEffect(() => {
    refresh().catch(() => setError("Chargement supervision echoue"));
  }, []);

  const onResolveConflict = async (conflictId: string) => {
    try {
      await resolveConflict(conflictId, {
        resolution_notes: "Resolue depuis la supervision",
        apply_client_payload: true,
      });
      await refresh();
    } catch {
      setError("Resolution du conflit echouee");
    }
  };

  return (
    <main className="container">
      <h1>Supervision</h1>
      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h2>Conflits de synchronisation</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Strategie</th>
                <th>Resolu</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((conflict) => (
                <tr key={conflict.id}>
                  <td>{conflict.id}</td>
                  <td>{conflict.resolution_strategy}</td>
                  <td>{conflict.resolved_at ? "Oui" : "Non"}</td>
                  <td>
                    {!conflict.resolved_at ? (
                      <button type="button" onClick={() => onResolveConflict(conflict.id)}>
                        Resoudre
                      </button>
                    ) : (
                      <span>--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Audit logs recents</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Ressource</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 20).map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.resource}</td>
                  <td>{log.status}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
