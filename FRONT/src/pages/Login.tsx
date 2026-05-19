import { useEffect, useState, type ReactElement } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";
import { useAuth } from "../contexts/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { useScrollAnimations } from "../hooks/useScrollAnimations";

export default function Login(): ReactElement {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof (location.state as { from?: unknown }).from === "string"
      ? (location.state as { from: string }).from
      : "/dashboard";

  useScrollAnimations();
  usePageTitle("Connexion");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    const ok = await login(email, password);
    if (!ok) {
      setError("Identifiants incorrects. Essayez user@demo.lab / demo ou labo@demo.lab / demo.");
      return;
    }
    navigate(from === "/login" ? "/dashboard" : from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main
        id="main-content"
        role="main"
        aria-labelledby="login-title"
        className="relative flex-1 flex items-center justify-center px-4 py-28"
      >
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 id="login-title" className="text-xl font-bold text-gray-900 mb-1">
            Connexion professionnelle
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Accès réservé aux espaces laboratoire.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <UiButton type="submit" bg="raspberry" text="white" className="w-full justify-center py-3">
              Se connecter
            </UiButton>
          </form>


          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/" className="text-raspberry-600 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded">
              Retour au site public
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
