// ── DB row types ─────────────────────────────────────────────────────────────

export type LabRole = "userLabo" | "labo";

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: LabRole;
  created_by: string | null;
  created_at: string;
}

export interface DbDocumentAssignment {
  id: string;
  user_id: string;
  document_id: string;
  document_title: string;
  assigned_by: string;
  assigned_at: string;
}

export interface DbAnalysis {
  id: string;
  user_id: string | null;
  elements: ApiElement[];
  created_at: string;
}

// Payload embarqué dans le JWT
export interface JwtPayload {
  userId: string;
  email: string;
  role: LabRole;
  displayName: string;
}

// Extension du type Request d'Express
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      originalImageBuffer?: Buffer;
      originalImageMimeType?: string;
    }
  }
}

// ── Mistral / analyse ─────────────────────────────────────────────────────────

export interface ApiElement {
  nom?: string;
  taux?: string;
  intervalle?: string;
  categorie?: string;
  explication?: string;
}

export interface AnalysisResult {
  success: boolean;
  result: {
    elements: ApiElement[];
    warning?: string;
  };
}

export interface MistralChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface MistralApiResponse {
  choices?: MistralChoice[];
  error?: {
    message: string;
  };
}
