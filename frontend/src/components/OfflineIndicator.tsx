import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function OfflineIndicator() {
  const { online } = useNetworkStatus();
  return (
    <div className={online ? "badge online" : "badge offline"}>
      {online ? "En ligne" : "Hors ligne"}
    </div>
  );
}
