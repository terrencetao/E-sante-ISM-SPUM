import { useEffect, useState } from "react";

import { listAuditLogs, listConflicts, resolveConflict } from "../services/adminService";
import { getAnalyticsSummary, listAnalyticsData } from "../services/analyticsService";
import type { AnalyticsSummary, AuditLog, CollectedDataRow, ConflictLog } from "../types/api";

export function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dataRows, setDataRows] = useState<CollectedDataRow[]>([]);
  const [conflicts, setConflicts] = useState<ConflictLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [summaryRes, dataRes, conflictRes, auditRes] = await Promise.all([
      getAnalyticsSummary(),
      listAnalyticsData(),
      listConflicts(),
      listAuditLogs(),
    ]);
    setSummary(summaryRes);
    setDataRows(dataRes);
    setConflicts(conflictRes);
    setAuditLogs(auditRes);
  };

  useEffect(() => {
    refresh().catch(() => setError("Chargement analytics/admin echoue"));
  }, []);

  const onResolveConflict = async (conflictId: string) => {
    try {
      await resolveConflict(conflictId, {
        resolution_notes: "Resolue depuis l'UI admin",
        apply_client_payload: true,
      });
      await refresh();
    } catch {
      setError("Resolution du conflit echouee");
    }
  };

  return (
    <main className="container">
      <h1>Analyse & supervision</h1>
      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h2>Resume analytics</h2>
        <p>Total enregistrements: {summary?.total_records ?? 0}</p>
        <h3>Par campagne</h3>
        <ul>
          {Object.entries(summary?.by_campaign ?? {}).map(([label, count]) => (
            <li key={label}>
              {label}: {count}
            </li>
          ))}
        </ul>
        <h3>Par aire de sante</h3>
        <ul>
          {Object.entries(summary?.by_health_area ?? {}).map(([label, count]) => (
            <li key={label}>
              {label}: {count}
            </li>
          ))}
        </ul>
      </section>

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
        <h2>Dernieres donnees collectees</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Campaign</th>
                <th>Zone</th>
                <th>Sync</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.slice(0, 20).map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.campaign_id}</td>
                  <td>{row.health_area_id}</td>
                  <td>{row.sync_status}</td>
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
