import { useEffect, useMemo, useState } from "react";

import { OfflineIndicator } from "../components/OfflineIndicator";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useSync } from "../hooks/useSync";
import { getMyAssignments } from "../services/assignmentService";
import { getDb } from "../services/rxdb";
import { useOfflineStore } from "../store/offline";
import { useSyncStore } from "../store/sync";
import type { MyAssignment } from "../types/api";

function toDraftId(assignmentId: string): string {
  return `draft-${assignmentId}`;
}

export function DataCollectionPage() {
  const { online } = useNetworkStatus();
  const { queued, setQueued } = useOfflineStore();
  const { runSync, syncing } = useSync();
  const { lastSyncAt } = useSyncStore();

  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [payloadText, setPayloadText] = useState("");
  const [status, setStatus] = useState("Pret");

  const selectedAssignment = useMemo(
    () => assignments.find((row) => row.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId],
  );

  const refreshQueued = async () => {
    const db = await getDb();
    const docs = await db.collections.collected_data.find().exec();
    setQueued(docs.map((d) => d.toJSON()).filter((row) => row.sync_status === "pending").length);
  };

  useEffect(() => {
    getMyAssignments()
      .then((rows) => {
        setAssignments(rows);
        if (rows.length > 0) {
          setSelectedAssignmentId(rows[0].id);
        }
      })
      .catch(() => setAssignments([]));
    refreshQueued();
  }, []);

  useEffect(() => {
    if (!selectedAssignment) {
      setPayloadText("");
      return;
    }

    getDb().then(async (db) => {
      const draft = await db.collections.collected_data.findOne(toDraftId(selectedAssignment.id)).exec();
      setPayloadText((draft?.get("data_payload") as { text?: string } | undefined)?.text ?? "");
    });
  }, [selectedAssignment]);

  useEffect(() => {
    if (!selectedAssignment) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      const db = await getDb();
      await db.collections.collected_data.upsert({
        id: toDraftId(selectedAssignment.id),
        campaign_id: selectedAssignment.campaign_id,
        health_area_id: selectedAssignment.health_area_id,
        village_id: null,
        data_payload: {
          text: payloadText,
          meta: {
            assignment_id: selectedAssignment.id,
            campaign_name: selectedAssignment.campaign_name,
            health_area_name: selectedAssignment.health_area_name,
            captured_at: new Date().toISOString(),
          },
        },
        source_timestamp: new Date().toISOString(),
        sync_status: "pending",
      });
      await refreshQueued();
      setStatus("Sauvegarde locale auto effectuee");

      if (online) {
        try {
          await runSync();
          setStatus("Synchronisation automatique effectuee");
        } catch {
          setStatus("Erreur de synchronisation automatique");
        }
      }
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [online, payloadText, runSync, selectedAssignment]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!online || syncing) {
        return;
      }
      runSync().catch(() => setStatus("Erreur de synchronisation automatique"));
    }, 30000);

    return () => window.clearInterval(interval);
  }, [online, runSync, syncing]);

  return (
    <main className="container">
      <div className="topline">
        <h1>Collecte de donnees</h1>
        <OfflineIndicator />
      </div>

      <section className="card">
        <h2>Campagnes assignees</h2>
        <label>
          Selection
          <select value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)}>
            {assignments.length === 0 ? <option value="">Aucune assignation</option> : null}
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.campaign_name} - {assignment.health_area_name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card">
        <h2>Donnees</h2>
        <label>
          Saisie libre
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            rows={8}
            placeholder="Entrez votre collecte en texte libre"
            disabled={!selectedAssignment}
          />
        </label>
      </section>

      <section className="card">
        <p>Etat reseau: {online ? "En ligne" : "Hors ligne"}</p>
        <p>Synchronisation en cours: {syncing ? "Oui" : "Non"}</p>
        <p>Entrees en attente: {queued}</p>
        <p>Derniere synchronisation: {lastSyncAt ?? "Jamais"}</p>
        <p>{status}</p>
      </section>
    </main>
  );
}
