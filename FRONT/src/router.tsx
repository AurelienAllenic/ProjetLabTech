import { createBrowserRouter, Outlet } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import LabIALanding from "./pages/LabIALanding";
import LabResultsPage from "./pages/LabResultsPage";
import Upload from "./pages/Upload";
import Manual from "./pages/Manual";
import ManualValues from "./pages/ManualValues";
import Help from "./pages/Help";
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";
import Cookies from "./pages/Cookies";

function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/",                element: <LabIALanding /> },
      { path: "/upload",          element: <Upload /> },
      { path: "/manual",          element: <Manual /> },
      { path: "/manual/values",   element: <ManualValues /> },
      { path: "/results",         element: <LabResultsPage /> },
      { path: "/help",            element: <Help /> },
      { path: "/mentions-legales",element: <MentionsLegales /> },
      { path: "/confidentialite", element: <Confidentialite /> },
      { path: "/cookies",         element: <Cookies /> },
    ],
  },
]);
