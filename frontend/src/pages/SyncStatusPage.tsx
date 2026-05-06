import { useSyncStore } from "../store/sync";
import { useOfflineStore } from "../store/offline";

export function SyncStatusPage() {
  const { syncing, lastSyncAt } = useSyncStore();
  const { queued } = useOfflineStore();

  return (
    <main className="container">
      <h1>Statut de synchronisation</h1>
      <section className="card">
        <p>Synchronisation en cours: {syncing ? "Oui" : "Non"}</p>
        <p>Derniere synchronisation: {lastSyncAt ?? "Jamais"}</p>
        <p>Elements en attente: {queued}</p>
      </section>
    </main>
  );
}
