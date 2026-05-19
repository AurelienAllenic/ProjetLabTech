import { useEffect, useState, type ReactElement } from "react";
import { LogOut } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UiButton from "../../components/UiButton";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useScrollAnimations } from "../../hooks/useScrollAnimations";
import { apiGet, apiPost } from "../../lib/api";
import sampleDocsJson from "../../mocks/sample-documents.json";
import type { DocumentAssignment, ManagedLabAccount, SampleDocument } from "../../types/auth";

// ── Mapping types API → types frontend ────────────────────────────────────────

interface ApiUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}

interface ApiAssignment {
  id: string;
  document_id: string;
  document_title: string;
  assigned_at: string;
  users: { email: string; display_name: string } | null;
}

function toAccount(u: ApiUser): ManagedLabAccount {
  return { id: u.id, email: u.email, displayName: u.display_name, createdAt: u.created_at };
}

function toAssignment(a: ApiAssignment): DocumentAssignment {
  return {
    id: a.id,
    documentId: a.document_id,
    documentTitle: a.document_title,
    assignedToEmail: a.users?.email ?? "",
    assignedAt: a.assigned_at,
  };
}

function parseSampleDocuments(data: unknown): SampleDocument[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is SampleDocument =>
      typeof item === "object" && item !== null &&
      typeof (item as Record<string, unknown>).id === "string" &&
      typeof (item as Record<string, unknown>).title === "string" &&
      typeof (item as Record<string, unknown>).filename === "string",
  );
}

const SAMPLE_DOCUMENTS: SampleDocument[] = parseSampleDocuments(sampleDocsJson);

// ── Composant ─────────────────────────────────────────────────────────────────

export default function LaboDashboard(): ReactElement | null {
  const { user, logout } = useAuth();
  useScrollAnimations();
  usePageTitle("Gestion laboratoire");

  const [accounts,    setAccounts]    = useState<ManagedLabAccount[]>([]);
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);

  const [newEmail,       setNewEmail]       = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword,    setNewPassword]    = useState("");
  const [formMsg,        setFormMsg]        = useState("");
  const [formLoading,    setFormLoading]    = useState(false);

  const [assignEmail,   setAssignEmail]   = useState("");
  const [assignDocId,   setAssignDocId]   = useState(SAMPLE_DOCUMENTS[0]?.id ?? "");
  const [assignMsg,     setAssignMsg]     = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // ── Chargement initial ───────────────────────────────────────────────────────

  useEffect(() => {
    apiGet<{ users: ApiUser[] }>("/users")
      .then(({ users }) => {
        const mapped = users.map(toAccount);
        setAccounts(mapped);
        if (mapped.length > 0) setAssignEmail(mapped[0].email);
      })
      .catch(() => { /* silencieux, tableau vide */ });

    apiGet<{ assignments: ApiAssignment[] }>("/assignments")
      .then(({ assignments }) => setAssignments(assignments.map(toAssignment)))
      .catch(() => { /* silencieux, tableau vide */ });
  }, []);

  if (!user) return null;

  // ── Créer un compte ──────────────────────────────────────────────────────────

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormMsg("");
    if (!newEmail || !newDisplayName || !newPassword) {
      setFormMsg("Tous les champs sont requis.");
      return;
    }
    setFormLoading(true);
    try {
      const { user: created } = await apiPost<{ user: ApiUser }>("/users", {
        email: newEmail,
        displayName: newDisplayName,
        password: newPassword,
      });
      const account = toAccount(created);
      setAccounts((prev) => [...prev, account]);
      setNewEmail("");
      setNewDisplayName("");
      setNewPassword("");
      setFormMsg("Compte créé avec succès.");
      setAssignEmail(account.email);
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Attribuer un document ────────────────────────────────────────────────────

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setAssignMsg("");
    const doc = SAMPLE_DOCUMENTS.find((d) => d.id === assignDocId);
    if (!doc) { setAssignMsg("Document inconnu."); return; }
    setAssignLoading(true);
    try {
      const { assignment } = await apiPost<{ assignment: ApiAssignment }>("/assignments", {
        assignedToEmail: assignEmail,
        documentId: doc.id,
        documentTitle: doc.title,
      });
      setAssignments((prev) => [toAssignment(assignment), ...prev]);
      setAssignMsg(`Document « ${doc.title} » attribué à ${assignEmail}.`);
    } catch (err) {
      setAssignMsg(err instanceof Error ? err.message : "Erreur lors de l'attribution.");
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────

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
          <UiButton type="button" bg="white" text="raspberry" onClick={logout} className="flex items-center gap-2 shrink-0">
            <LogOut size={18} aria-hidden="true" /> Déconnexion
          </UiButton>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Créer un compte */}
          <section aria-labelledby="create-account-title" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 id="create-account-title" className="text-lg font-semibold text-gray-900 mb-4">
              Créer un compte utilisateur labo
            </h2>
            <form onSubmit={(e) => { void handleCreateAccount(e); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-email" className="text-sm font-medium text-gray-700">E-mail</label>
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
                <label htmlFor="new-account-name" className="text-sm font-medium text-gray-700">Nom affiché</label>
                <input
                  id="new-account-name"
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-password" className="text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  id="new-account-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              {formMsg && <p role="status" className="text-sm text-gray-600">{formMsg}</p>}
              <UiButton type="submit" bg="raspberry" text="white" className="w-fit px-6" disabled={formLoading}>
                {formLoading ? "Création..." : "Créer le compte"}
              </UiButton>
            </form>
          </section>

          {/* Attribuer un document */}
          <section aria-labelledby="assign-doc-title" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 id="assign-doc-title" className="text-lg font-semibold text-gray-900 mb-4">
              Attribuer un document PDF
            </h2>
            <form onSubmit={(e) => { void handleAssign(e); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="assign-user" className="text-sm font-medium text-gray-700">Compte destinataire</label>
                <select
                  id="assign-user"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  disabled={accounts.length === 0}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400 disabled:bg-gray-50"
                >
                  {accounts.length === 0
                    ? <option value="">Aucun compte créé</option>
                    : accounts.map((a) => (
                        <option key={a.id} value={a.email}>{a.displayName} ({a.email})</option>
                      ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="assign-document" className="text-sm font-medium text-gray-700">Document</label>
                <select
                  id="assign-document"
                  value={assignDocId}
                  onChange={(e) => setAssignDocId(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                >
                  {SAMPLE_DOCUMENTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.title} — {d.filename}</option>
                  ))}
                </select>
              </div>
              {assignMsg && <p role="status" className="text-sm text-gray-600">{assignMsg}</p>}
              <UiButton type="submit" bg="raspberry" text="white" className="w-fit px-6" disabled={accounts.length === 0 || assignLoading}>
                {assignLoading ? "Attribution..." : "Attribuer"}
              </UiButton>
            </form>
          </section>
        </div>

        {/* Tableau des comptes */}
        <section aria-labelledby="accounts-table-title" className="mt-10">
          <h2 id="accounts-table-title" className="text-lg font-semibold text-gray-900 mb-3">
            Comptes créés ({accounts.length})
          </h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun compte pour le moment.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Nom</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">E-mail</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-800">{a.displayName}</td>
                      <td className="px-4 py-3 text-gray-600">{a.email}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tableau des attributions */}
        <section aria-labelledby="assignments-table-title" className="mt-10 mb-6">
          <h2 id="assignments-table-title" className="text-lg font-semibold text-gray-900 mb-3">
            Documents attribués ({assignments.length})
          </h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune attribution enregistrée.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Document</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Destinataire</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-800">{r.documentTitle}</td>
                      <td className="px-4 py-3 text-gray-600">{r.assignedToEmail}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(r.assignedAt).toLocaleString("fr-FR")}</td>
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
