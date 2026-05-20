export type UserRole = "laboratory" | "client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

// Extension du type Request d'Express
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      originalImageBuffer?: Buffer;
      originalImageMimeType?: string;
    }
  }
}

export interface DbPasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
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
    /** Synthèse rédigée par l'IA (PDF / analyse automatique) */
    conclusion?: string;
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
