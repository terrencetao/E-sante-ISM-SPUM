import { FormEvent, useEffect, useMemo, useState } from "react";

import { assignCampaign, createCampaign, listCampaigns } from "../services/campaignsService";
import { listUsers } from "../services/usersService";
import { createZone, listZones } from "../services/zonesService";
import type { Campaign, HealthArea, User } from "../types/api";

function toErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string" && detail.length > 0) {
    return detail;
  }
  return fallback;
}

export function AdminCampaignPage() {
  const [zones, setZones] = useState<HealthArea[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");

  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");

  const [assignCampaignId, setAssignCampaignId] = useState("");
  const [assignZoneId, setAssignZoneId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignees = useMemo(
    () => users.filter((user) => user.role_name === "intervenant_terrain" || user.role_name === "developer_superuser"),
    [users],
  );

  const refresh = async () => {
    const [zonesRows, campaignRows, userRows] = await Promise.all([listZones(), listCampaigns(), listUsers()]);
    setZones(zonesRows);
    setCampaigns(campaignRows);
    setUsers(userRows);
    if (!assignCampaignId && campaignRows.length > 0) {
      setAssignCampaignId(campaignRows[0].id);
    }
    if (!assignZoneId && zonesRows.length > 0) {
      setAssignZoneId(zonesRows[0].id);
    }
    if (!assignUserId && userRows.length > 0) {
      const firstIntervenant = userRows.find((row) => row.role_name === "intervenant_terrain");
      if (firstIntervenant) {
        setAssignUserId(firstIntervenant.id);
      }
    }
  };

  useEffect(() => {
    refresh().catch((error) => setError(toErrorMessage(error, "Impossible de charger les donnees campagne")));
  }, []);

  const onCreateZone = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createZone({ name: zoneName, description: zoneDescription || undefined });
      setZoneName("");
      setZoneDescription("");
      setMessage("Zone creee");
      await refresh();
    } catch (error) {
      setError(toErrorMessage(error, "Creation de zone echouee"));
    }
  };

  const onCreateCampaign = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createCampaign({ name: campaignName, description: campaignDescription || undefined });
      setCampaignName("");
      setCampaignDescription("");
      setMessage("Campagne creee");
      await refresh();
    } catch (error) {
      setError(toErrorMessage(error, "Creation de campagne echouee"));
    }
  };

  const onAssign = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!assignCampaignId || !assignZoneId || !assignUserId) {
      setError("Selection incomplete pour l'assignation");
      return;
    }

    try {
      await assignCampaign(assignCampaignId, { health_area_id: assignZoneId, user_id: assignUserId });
      setMessage("Assignation creee");
    } catch (error) {
      setError(toErrorMessage(error, "Creation assignation echouee"));
    }
  };

  return (
    <main className="container">
      <h1>Administration campagne</h1>
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h2>Creer une aire de sante</h2>
        <form onSubmit={onCreateZone}>
          <label>
            Nom
            <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={zoneDescription} onChange={(e) => setZoneDescription(e.target.value)} />
          </label>
          <button type="submit">Creer zone</button>
        </form>
      </section>

      <section className="card">
        <h2>Creer une campagne</h2>
        <form onSubmit={onCreateCampaign}>
          <label>
            Nom
            <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} />
          </label>
          <button type="submit">Creer campagne</button>
        </form>
      </section>

      <section className="card">
        <h2>Assigner un intervenant</h2>
        <form onSubmit={onAssign}>
          <label>
            Campagne
            <select value={assignCampaignId} onChange={(e) => setAssignCampaignId(e.target.value)} required>
              <option value="">Selectionner</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Zone
            <select value={assignZoneId} onChange={(e) => setAssignZoneId(e.target.value)} required>
              <option value="">Selectionner</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Intervenant / Superuser
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} required>
              <option value="">Selectionner</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Creer assignation</button>
        </form>
      </section>
    </main>
  );
}
