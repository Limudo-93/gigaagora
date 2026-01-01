import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function normalizeEnvValue(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed.replace(/\\r|\\n/g, "").trim();
}

function sanitizeSupabaseKey(value?: string) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;
  return normalized.replace(/[^A-Za-z0-9._-]/g, "");
}

export async function createClient() {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = sanitizeSupabaseKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore when called from Server Components (read-only cookies)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Ignore when called from Server Components (read-only cookies)
        }
      },
    },
  });
}
