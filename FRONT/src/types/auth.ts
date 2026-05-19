/** Rôle métier : utilisateur labo (analyses) ou gestionnaire laboratoire */
export type LabRole = "userLabo" | "labo";

export interface AuthUser {
  email: string;
  displayName: string;
  role: LabRole;
}

/** Entrée dans le fichier mock (mot de passe en clair uniquement pour la démo) */
export interface AuthUserRecord extends AuthUser {
  password: string;
}

export interface ManagedLabAccount {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SampleDocument {
  id: string;
  title: string;
  filename: string;
}

export interface DocumentAssignment {
  id: string;
  documentId: string;
  documentTitle: string;
  assignedToEmail: string;
  assignedAt: string;
}

export function isLabRole(value: string): value is LabRole {
  return value === "userLabo" || value === "labo";
}
