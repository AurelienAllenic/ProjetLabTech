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
