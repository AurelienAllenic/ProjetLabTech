import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./components/RootLayout";
import RequireAuth from "./components/RequireAuth";
import LabIALanding from "./pages/LabIALanding";
import LabResultsPage from "./pages/LabResultsPage";
import Upload from "./pages/Upload";
import Manual from "./pages/Manual";
import ManualValues from "./pages/ManualValues";
import Help from "./pages/Help";
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";
import Cookies from "./pages/Cookies";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import RoleDashboard from "./pages/dashboard/RoleDashboard";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/",                element: <LabIALanding /> },
      { path: "/login",           element: <Login /> },
      { path: "/set-password",    element: <SetPassword /> },
      {
        path: "/dashboard",
        element: (
          <RequireAuth>
            <RoleDashboard />
          </RequireAuth>
        ),
      },
      { path: "/upload",          element: <Upload /> },
      {
        path: "/manual",
        element: (
          <RequireAuth>
            <Manual />
          </RequireAuth>
        ),
      },
      {
        path: "/manual/values",
        element: (
          <RequireAuth>
            <ManualValues />
          </RequireAuth>
        ),
      },
      { path: "/results",         element: <LabResultsPage /> },
      { path: "/help",            element: <Help /> },
      { path: "/mentions-legales",element: <MentionsLegales /> },
      { path: "/confidentialite", element: <Confidentialite /> },
      { path: "/cookies",         element: <Cookies /> },
    ],
  },
]);
