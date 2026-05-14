import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  assignCampaign,
  createCampaign,
  deleteAssignment,
  deleteCampaign,
  listAssignments,
  listCampaigns,
  updateAssignment,
  updateCampaign,
} from "../services/campaignsService";
import { listUsers } from "../services/usersService";
import { createZone, deleteZone, listZones, updateZone } from "../services/zonesService";
import type { Assignment, Campaign, HealthArea, User } from "../types/api";

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
    const [zonesRows, campaignRows, assignmentRows, userRows] = await Promise.all([
      listZones(),
      listCampaigns(),
      listAssignments(),
      listUsers(),
    ]);
    setZones(zonesRows);
    setCampaigns(campaignRows);
    setAssignments(assignmentRows);
    setUsers(userRows);

    if (!assignCampaignId && campaignRows.length > 0) {
      setAssignCampaignId(campaignRows[0].id);
    }
    if (!assignZoneId && zonesRows.length > 0) {
      setAssignZoneId(zonesRows[0].id);
    }
    if (!assignUserId) {
      const assignable = userRows.filter(
        (user) => user.role_name === "intervenant_terrain" || user.role_name === "developer_superuser",
      );
      if (assignable.length > 0) {
        setAssignUserId(assignable[0].id);
      }
    }
  };

  useEffect(() => {
    refresh().catch((loadError) => setError(toErrorMessage(loadError, "Impossible de charger les donnees campagne")));
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
    } catch (createError) {
      setError(toErrorMessage(createError, "Creation de zone echouee"));
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
    } catch (createError) {
      setError(toErrorMessage(createError, "Creation de campagne echouee"));
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
      await refresh();
    } catch (assignError) {
      setError(toErrorMessage(assignError, "Creation assignation echouee"));
    }
  };

  const onEditZone = async (zone: HealthArea) => {
    const nextName = window.prompt("Nouveau nom de la zone", zone.name);
    if (!nextName) {
      return;
    }
    const nextDescription = window.prompt("Nouvelle description", zone.description ?? "") ?? undefined;
    try {
      await updateZone(zone.id, { name: nextName, description: nextDescription });
      setMessage("Zone modifiee");
      await refresh();
    } catch (editError) {
      setError(toErrorMessage(editError, "Modification de zone echouee"));
    }
  };

  const onDeleteZone = async (zone: HealthArea) => {
    if (!window.confirm(`Supprimer la zone ${zone.name} ?`)) {
      return;
    }
    try {
      await deleteZone(zone.id);
      setMessage("Zone supprimee");
      await refresh();
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, "Suppression de zone echouee"));
    }
  };

  const onEditCampaign = async (campaign: Campaign) => {
    const nextName = window.prompt("Nouveau nom de la campagne", campaign.name);
    if (!nextName) {
      return;
    }
    const nextDescription = window.prompt("Nouvelle description", campaign.description ?? "") ?? undefined;
    const nextStatus = window.prompt("Nouveau statut", campaign.status) ?? campaign.status;
    try {
      await updateCampaign(campaign.id, { name: nextName, description: nextDescription, status: nextStatus });
      setMessage("Campagne modifiee");
      await refresh();
    } catch (editError) {
      setError(toErrorMessage(editError, "Modification de campagne echouee"));
    }
  };

  const onDeleteCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Supprimer la campagne ${campaign.name} ?`)) {
      return;
    }
    try {
      await deleteCampaign(campaign.id);
      setMessage("Campagne supprimee");
      await refresh();
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, "Suppression de campagne echouee"));
    }
  };

  const onEditAssignment = async (assignment: Assignment) => {
    const nextStatus = window.prompt("Nouveau statut de l'assignation", assignment.status);
    if (!nextStatus) {
      return;
    }
    try {
      await updateAssignment(assignment.id, { status: nextStatus });
      setMessage("Assignation modifiee");
      await refresh();
    } catch (editError) {
      setError(toErrorMessage(editError, "Modification d'assignation echouee"));
    }
  };

  const onDeleteAssignment = async (assignment: Assignment) => {
    if (!window.confirm("Supprimer cette assignation ?")) {
      return;
    }
    try {
      await deleteAssignment(assignment.id);
      setMessage("Assignation supprimee");
      await refresh();
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, "Suppression assignation echouee"));
    }
  };

  return (
    <main className="container">
      <h1>Administration campagne</h1>
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h2>Aires de sante (CRUD)</h2>
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td>{zone.name}</td>
                  <td>{zone.description}</td>
                  <td className="actions">
                    <button type="button" onClick={() => onEditZone(zone)}>Modifier</button>
                    <button type="button" onClick={() => onDeleteZone(zone)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Campagnes (CRUD)</h2>
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.name}</td>
                  <td>{campaign.description}</td>
                  <td>{campaign.status}</td>
                  <td className="actions">
                    <button type="button" onClick={() => onEditCampaign(campaign)}>Modifier</button>
                    <button type="button" onClick={() => onDeleteCampaign(campaign)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Assignations (CRUD)</h2>
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Zone</th>
                <th>Intervenant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.campaign_name ?? assignment.campaign_id}</td>
                  <td>{assignment.health_area_name ?? assignment.health_area_id}</td>
                  <td>{assignment.user_email ?? assignment.user_id}</td>
                  <td>{assignment.status}</td>
                  <td className="actions">
                    <button type="button" onClick={() => onEditAssignment(assignment)}>Modifier</button>
                    <button type="button" onClick={() => onDeleteAssignment(assignment)}>Supprimer</button>
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
