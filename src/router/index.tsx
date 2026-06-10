import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Organization from "@/pages/Organization";
import Applications from "@/pages/Applications";
import Permissions from "@/pages/Permissions";
import Audit from "@/pages/Audit";
import Risk from "@/pages/Risk";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/dashboard",
    element: (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    ),
  },
  {
    path: "/users",
    element: (
      <AppLayout>
        <Users />
      </AppLayout>
    ),
  },
  {
    path: "/organization",
    element: (
      <AppLayout>
        <Organization />
      </AppLayout>
    ),
  },
  {
    path: "/applications",
    element: (
      <AppLayout>
        <Applications />
      </AppLayout>
    ),
  },
  {
    path: "/permissions",
    element: (
      <AppLayout>
        <Permissions />
      </AppLayout>
    ),
  },
  {
    path: "/audit",
    element: (
      <AppLayout>
        <Audit />
      </AppLayout>
    ),
  },
  {
    path: "/risk",
    element: (
      <AppLayout>
        <Risk />
      </AppLayout>
    ),
  },
]);

export default router;
