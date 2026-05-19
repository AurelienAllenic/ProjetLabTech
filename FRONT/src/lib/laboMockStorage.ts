import type { DocumentAssignment, ManagedLabAccount } from "../types/auth";

const MANAGED_KEY = "labia_mock_managed_accounts";
const ASSIGNMENTS_KEY = "labia_mock_document_assignments";

function parseManaged(raw: string): ManagedLabAccount[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isManagedAccount);
  } catch {
    return [];
  }
}

function isManagedAccount(item: unknown): item is ManagedLabAccount {
  if (typeof item !== "object" || item === null) return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.email === "string" &&
    typeof o.displayName === "string" &&
    typeof o.createdAt === "string"
  );
}

function parseAssignments(raw: string): DocumentAssignment[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isAssignment);
  } catch {
    return [];
  }
}

function isAssignment(item: unknown): item is DocumentAssignment {
  if (typeof item !== "object" || item === null) return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.documentId === "string" &&
    typeof o.documentTitle === "string" &&
    typeof o.assignedToEmail === "string" &&
    typeof o.assignedAt === "string"
  );
}

export function loadManagedAccounts(): ManagedLabAccount[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(MANAGED_KEY);
  if (!raw) return [];
  return parseManaged(raw);
}

export function saveManagedAccounts(accounts: ManagedLabAccount[]): void {
  localStorage.setItem(MANAGED_KEY, JSON.stringify(accounts));
}

export function loadAssignments(): DocumentAssignment[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(ASSIGNMENTS_KEY);
  if (!raw) return [];
  return parseAssignments(raw);
}

export function saveAssignments(rows: DocumentAssignment[]): void {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(rows));
}
