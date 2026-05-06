import { Navigate, Route, Routes } from "react-router-dom";

import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { AdminCampaignPage } from "./pages/AdminCampaignPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DataCollectionPage } from "./pages/DataCollectionPage";
import { LoginPage } from "./pages/LoginPage";
import { SyncStatusPage } from "./pages/SyncStatusPage";
import { getCurrentRole } from "./services/authService";
import type { RoleName } from "./types/api";

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireRole({ children, allowedRoles }: { children: JSX.Element; allowedRoles: RoleName[] }) {
  const role = getCurrentRole();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/data-collection"
        element={
          <RequireAuth>
            <DataCollectionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/sync-status"
        element={
          <RequireAuth>
            <SyncStatusPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["administrator_system"]}>
              <AdminUsersPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/campaign"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["administrator_campaign"]}>
              <AdminCampaignPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["administrator_system", "analyste"]}>
              <AdminAnalyticsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
