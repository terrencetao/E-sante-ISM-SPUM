import { FormEvent, useEffect, useState } from "react";

import { OfflineIndicator } from "../components/OfflineIndicator";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useSync } from "../hooks/useSync";
import { getDb } from "../services/rxdb";
import { useOfflineStore } from "../store/offline";

export function DataCollectionPage() {
  const { online } = useNetworkStatus();
  const { queued, setQueued } = useOfflineStore();
  const { runSync, syncing } = useSync();

  const [campaignId, setCampaignId] = useState("");
  const [healthAreaId, setHealthAreaId] = useState("");
  const [payloadText, setPayloadText] = useState('{"status":"ok"}');

  useEffect(() => {
    getDb().then(async (db) => {
      const docs = await db.collections.collected_data.find().exec();
      setQueued(docs.map((d) => d.toJSON()).filter((row) => row.sync_status === "pending").length);
    });
  }, [setQueued]);

  const onSaveLocal = async (event: FormEvent) => {
    event.preventDefault();
    const db = await getDb();
    const id = crypto.randomUUID();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      parsed = { raw: payloadText };
    }
    await db.collections.collected_data.insert({
      id,
      campaign_id: campaignId,
      health_area_id: healthAreaId,
      village_id: null,
      data_payload: parsed,
      source_timestamp: new Date().toISOString(),
      sync_status: "pending",
    });
    const docs = await db.collections.collected_data.find().exec();
    setQueued(docs.map((d) => d.toJSON()).filter((row) => row.sync_status === "pending").length);
  };

  return (
    <main className="container">
      <div className="topline">
        <h1>Collecte de donnees</h1>
        <OfflineIndicator />
      </div>
      <form className="card" onSubmit={onSaveLocal}>
        <label>
          ID campagne
          <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} required />
        </label>
        <label>
          ID aire de sante
          <input value={healthAreaId} onChange={(e) => setHealthAreaId(e.target.value)} required />
        </label>
        <label>
          Donnees JSON
          <textarea value={payloadText} onChange={(e) => setPayloadText(e.target.value)} rows={5} />
        </label>
        <button type="submit">Sauvegarder localement</button>
      </form>
      <section className="card">
        <p>Entrees en attente: {queued}</p>
        <button onClick={() => runSync()} disabled={!online || syncing}>
          {syncing ? "Synchronisation..." : "Synchroniser"}
        </button>
      </section>
    </main>
  );
}
