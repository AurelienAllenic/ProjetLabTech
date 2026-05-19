import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UiButton from "../../components/UiButton";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useScrollAnimations } from "../../hooks/useScrollAnimations";
import sampleDocsJson from "../../mocks/sample-documents.json";
import {
  loadAssignments,
  loadManagedAccounts,
  saveAssignments,
  saveManagedAccounts,
} from "../../lib/laboMockStorage";
import type { DocumentAssignment, ManagedLabAccount, SampleDocument } from "../../types/auth";

function parseSampleDocuments(data: unknown): SampleDocument[] {
  if (!Array.isArray(data)) return [];
  const out: SampleDocument[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.id === "string" &&
      typeof o.title === "string" &&
      typeof o.filename === "string"
    ) {
      out.push({ id: o.id, title: o.title, filename: o.filename });
    }
  }
  return out;
}

const SAMPLE_DOCUMENTS: SampleDocument[] = parseSampleDocuments(sampleDocsJson);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function LaboDashboard(): JSX.Element {
  const { user, logout } = useAuth();
  useScrollAnimations();
  usePageTitle("Gestion laboratoire");

  const [accounts, setAccounts] = useState<ManagedLabAccount[]>([]);
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [formMsg, setFormMsg] = useState("");

  const [assignEmail, setAssignEmail] = useState("");
  const [assignDocId, setAssignDocId] = useState(SAMPLE_DOCUMENTS[0]?.id ?? "");
  const [assignMsg, setAssignMsg] = useState("");

  useEffect(() => {
    setAccounts(loadManagedAccounts());
    setAssignments(loadAssignments());
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !assignEmail) {
      setAssignEmail(accounts[0].email);
    }
  }, [accounts, assignEmail]);

  if (!user) {
    return null;
  }

  const handleCreateAccount = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setFormMsg("");
    const email = newEmail.trim().toLowerCase();
    const displayName = newDisplayName.trim();
    if (!email || !displayName) {
      setFormMsg("Renseignez l'e-mail et le nom affiché.");
      return;
    }
    if (accounts.some((a) => a.email.toLowerCase() === email)) {
      setFormMsg("Un compte avec cet e-mail existe déjà (mock local).");
      return;
    }
    const row: ManagedLabAccount = {
      id: newId(),
      email,
      displayName,
      createdAt: new Date().toISOString(),
    };
    const next = [...accounts, row];
    setAccounts(next);
    saveManagedAccounts(next);
    setNewEmail("");
    setNewDisplayName("");
    setFormMsg("Compte enregistré localement (mock).");
    setAssignEmail(email);
  };

  const handleAssign = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setAssignMsg("");
    if (!assignEmail) {
      setAssignMsg("Créez au moins un compte utilisateur.");
      return;
    }
    const doc = SAMPLE_DOCUMENTS.find((d) => d.id === assignDocId);
    if (!doc) {
      setAssignMsg("Document inconnu.");
      return;
    }
    const row: DocumentAssignment = {
      id: newId(),
      documentId: doc.id,
      documentTitle: doc.title,
      assignedToEmail: assignEmail,
      assignedAt: new Date().toISOString(),
    };
    const next = [...assignments, row];
    setAssignments(next);
    saveAssignments(next);
    setAssignMsg(`Document « ${doc.title} » attribué à ${assignEmail} (mock).`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" className="flex-1 px-4 pt-28 pb-16 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-raspberry-600 mb-1">
              Gestionnaire laboratoire
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Espace administration — {user.displayName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>
          <UiButton
            type="button"
            bg="white"
            text="raspberry"
            onClick={logout}
            className="flex items-center gap-2 shrink-0"
          >
            <LogOut size={18} aria-hidden="true" /> Déconnexion
          </UiButton>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section
            aria-labelledby="create-account-title"
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 id="create-account-title" className="text-lg font-semibold text-gray-900 mb-2">
              Créer un compte utilisateur labo
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Les comptes sont stockés dans le navigateur (
              <code className="text-xs bg-gray-100 px-1 rounded">localStorage</code>), uniquement pour la démo.
            </p>
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-email" className="text-sm font-medium text-gray-700">
                  E-mail du compte
                </label>
                <input
                  id="new-account-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-name" className="text-sm font-medium text-gray-700">
                  Nom affiché
                </label>
                <input
                  id="new-account-name"
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              {formMsg ? (
                <p role="status" className="text-sm text-gray-600">
                  {formMsg}
                </p>
              ) : null}
              <UiButton type="submit" bg="raspberry" text="white" className="w-fit px-6">
                Créer le compte (mock)
              </UiButton>
            </form>
          </section>

          <section
            aria-labelledby="assign-doc-title"
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 id="assign-doc-title" className="text-lg font-semibold text-gray-900 mb-2">
              Attribuer un document PDF
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Liste des pièces disponibles : fichier{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">sample-documents.json</code>.
            </p>
            <form onSubmit={handleAssign} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="assign-user" className="text-sm font-medium text-gray-700">
                  Compte destinataire
                </label>
                <select
                  id="assign-user"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  disabled={accounts.length === 0}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400 disabled:bg-gray-50"
                >
                  {accounts.length === 0 ? (
                    <option value="">Aucun compte créé</option>
                  ) : (
                    accounts.map((a) => (
                      <option key={a.id} value={a.email}>
                        {a.displayName} ({a.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="assign-document" className="text-sm font-medium text-gray-700">
                  Document
                </label>
                <select
                  id="assign-document"
                  value={assignDocId}
                  onChange={(e) => setAssignDocId(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                >
                  {SAMPLE_DOCUMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} — {d.filename}
                    </option>
                  ))}
                </select>
              </div>
              {assignMsg ? (
                <p role="status" className="text-sm text-gray-600">
                  {assignMsg}
                </p>
              ) : null}
              <UiButton
                type="submit"
                bg="raspberry"
                text="white"
                className="w-fit px-6"
                disabled={accounts.length === 0}
              >
                Attribuer (mock)
              </UiButton>
            </form>
          </section>
        </div>

        <section aria-labelledby="accounts-table-title" className="mt-10">
          <h2 id="accounts-table-title" className="text-lg font-semibold text-gray-900 mb-3">
            Comptes créés
          </h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun compte pour le moment.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                      Nom
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                      E-mail
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                      Créé le
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-800">{a.displayName}</td>
                      <td className="px-4 py-3 text-gray-600">{a.email}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(a.createdAt).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="assignments-table-title" className="mt-10 mb-6">
          <h2 id="assignments-table-title" className="text-lg font-semibold text-gray-900 mb-3">
            Documents attribués
          </h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune attribution enregistrée.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                      Document
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                      Destinataire
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-800">{r.documentTitle}</td>
                      <td className="px-4 py-3 text-gray-600">{r.assignedToEmail}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(r.assignedAt).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
