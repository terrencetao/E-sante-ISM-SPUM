import { useEffect, useState } from "react";
import { getDb } from "../services/rxdb";

export function useRxDB() {
  const [db, setDb] = useState<Awaited<ReturnType<typeof getDb>> | null>(null);

  useEffect(() => {
    let mounted = true;
    getDb().then((database) => {
      if (mounted) setDb(database);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return db;
}
