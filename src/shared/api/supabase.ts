import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * This client intentionally accepts only the browser-safe publishable/anon key.
 * Service-role credentials must never be exposed in a Vite environment variable.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, publishableKey)
  : null;
