import "dotenv/config";

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  get PORT(): number {
    return Number(process.env.PORT ?? 3001);
  },
  get FRONTEND_URL(): string | undefined {
    return process.env.FRONTEND_URL;
  },
  get SUPABASE_URL(): string {
    return requireEnv("SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY(): string {
    return requireEnv("SUPABASE_ANON_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get DATABASE_URL(): string {
    return requireEnv("DATABASE_URL");
  },
  get MISTRAL_API_KEY(): string {
    return process.env.MISTRAL_API_KEY || requireEnv("API_KEY");
  },
};
