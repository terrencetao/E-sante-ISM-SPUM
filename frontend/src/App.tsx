import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { DevToolsPanel } from "./components/DevToolsPanel";
import { SessionIndicator } from "./components/SessionIndicator";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { AdminCampaignPage } from "./pages/AdminCampaignPage";
import { AdminSupervisionPage } from "./pages/AdminSupervisionPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DataCollectionPage } from "./pages/DataCollectionPage";
import { LoginPage } from "./pages/LoginPage";
import { getCurrentRole, onAuthSessionChange } from "./services/authService";
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

function AuthenticatedFrame({ children, sessionVersion }: { children: JSX.Element; sessionVersion: number }) {
  return (
    <div key={sessionVersion}>
      <SessionIndicator />
      <DevToolsPanel />
      <AppShell>{children}</AppShell>
    </div>
  );
}

export default function App() {
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    return onAuthSessionChange(() => {
      setSessionVersion((prev) => prev + 1);
    });
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <AuthenticatedFrame sessionVersion={sessionVersion}>
              <DashboardPage />
            </AuthenticatedFrame>
          </RequireAuth>
        }
      />
      <Route
        path="/data-collection"
        element={
          <RequireAuth>
            <AuthenticatedFrame sessionVersion={sessionVersion}>
              <DataCollectionPage />
            </AuthenticatedFrame>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <AuthenticatedFrame sessionVersion={sessionVersion}>
              <RequireRole allowedRoles={["administrator_system", "developer_superuser"]}>
                <AdminUsersPage />
              </RequireRole>
            </AuthenticatedFrame>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/campaign"
        element={
          <RequireAuth>
            <AuthenticatedFrame sessionVersion={sessionVersion}>
              <RequireRole allowedRoles={["administrator_campaign", "developer_superuser"]}>
                <AdminCampaignPage />
              </RequireRole>
            </AuthenticatedFrame>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAuth>
            <AuthenticatedFrame sessionVersion={sessionVersion}>
              <RequireRole allowedRoles={["administrator_system", "analyste", "developer_superuser"]}>
                <AdminAnalyticsPage />
              </RequireRole>
            </AuthenticatedFrame>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/supervision"
        element={
          <RequireAuth>
            <AuthenticatedFrame sessionVersion={sessionVersion}>
              <RequireRole allowedRoles={["administrator_system", "developer_superuser"]}>
                <AdminSupervisionPage />
              </RequireRole>
            </AuthenticatedFrame>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
