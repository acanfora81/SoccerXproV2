import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

// Pagine
import Dashboard from "@/features/dashboard/pages/Dashboard";
import PlayersList from "@/features/players/pages/PlayersList";
function Performance() {
  return <h1 className="text-xl font-bold">Performance</h1>;
}
function Contracts() {
  return <h1 className="text-xl font-bold">Contratti</h1>;
}
function Medical() {
  return <h1 className="text-xl font-bold">Area Medica</h1>;
}
function Market() {
  return <h1 className="text-xl font-bold">Mercato</h1>;
}
function Admin() {
  return <h1 className="text-xl font-bold">Amministrazione</h1>;
}
function Security() {
  return <h1 className="text-xl font-bold">Sicurezza 2FA</h1>;
}
function System() {
  return <h1 className="text-xl font-bold">Utilità di Sistema</h1>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "players", element: <PlayersList /> },
      { path: "performance", element: <Performance /> },
      { path: "contracts", element: <Contracts /> },
      { path: "medical", element: <Medical /> },
      { path: "market", element: <Market /> },
      { path: "admin", element: <Admin /> },
      { path: "security", element: <Security /> },
      { path: "system", element: <System /> },
      { path: "*", element: <Dashboard /> }, // fallback
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
