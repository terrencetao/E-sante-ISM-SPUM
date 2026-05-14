import { useEffect, useState } from "react";

import { getAnalyticsSummary, listAnalyticsData } from "../services/analyticsService";
import type { AnalyticsSummary, CollectedDataRow } from "../types/api";

export function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dataRows, setDataRows] = useState<CollectedDataRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [summaryRes, dataRes] = await Promise.all([getAnalyticsSummary(), listAnalyticsData()]);
    setSummary(summaryRes);
    setDataRows(dataRes);
  };

  useEffect(() => {
    refresh().catch(() => setError("Chargement analytics echoue"));
  }, []);

  return (
    <main className="container">
      <h1>Analytics</h1>
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
        <h2>Dernieres donnees collectees</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Campagne</th>
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
    </main>
  );
}
