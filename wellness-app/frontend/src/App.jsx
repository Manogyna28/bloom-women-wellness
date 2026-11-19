import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Privacy from "./pages/Privacy.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Food from "./pages/Food.jsx";
import Track from "./pages/Track.jsx";
import Cycle from "./pages/Cycle.jsx";
import Insights from "./pages/Insights.jsx";
import Settings from "./pages/Settings.jsx";
import Layout from "./components/Layout.jsx";
import { getSession } from "./lib/storage.js";

function Protected({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />

      <Route
        path="/app"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="food" element={<Food />} />
        <Route path="track" element={<Track />} />
        <Route path="cycle" element={<Cycle />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}