import { useState, type ReactElement } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";

type Status = "idle" | "loading" | "success" | "error" | "invalid";

export default function SetPassword(): ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>(token ? "idle" : "invalid");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");

    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const data = await res.json() as { error?: string };
      setErrorMsg(data.error ?? "Une erreur est survenue.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-28">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

          {status === "invalid" && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
              <p className="text-sm text-gray-500 mb-6">
                Ce lien de définition du mot de passe est invalide ou manquant.
              </p>
              <Link to="/login" className="text-sm text-raspberry-600 underline">
                Retour à la connexion
              </Link>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-center mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
                Mot de passe défini !
              </h1>
              <p className="text-sm text-gray-500 mb-6 text-center">
                Vous pouvez maintenant vous connecter avec vos identifiants.
              </p>
              <UiButton bg="raspberry" text="white" onClick={() => void navigate("/login")} className="w-full">
                Se connecter
              </UiButton>
            </>
          )}

          {(status === "idle" || status === "loading" || status === "error") && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Définir votre mot de passe
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Choisissez un mot de passe sécurisé d'au moins 8 caractères.
              </p>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                    placeholder="••••••••"
                  />
                </div>

                {errorMsg && (
                  <p role="alert" className="text-sm text-red-600">
                    {errorMsg}
                  </p>
                )}

                <UiButton
                  type="submit"
                  bg="raspberry"
                  text="white"
                  disabled={status === "loading"}
                  className={`w-full py-2.5 ${status === "loading" ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {status === "loading" ? "Enregistrement..." : "Définir le mot de passe"}
                </UiButton>
              </form>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
