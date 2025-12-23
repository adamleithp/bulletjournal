import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Browser client for client-side operations
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Server client for server-side operations (SSR)
export const createSSRClient = (request?: Request) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!request) return [];
        const cookieHeader = request.headers.get("cookie") ?? "";
        return cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll() {
        // Cookies are set via response headers in TanStack Start
      },
    },
  });
};

// Singleton for browser usage
let browserClient: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (typeof window === "undefined") {
    return createClient();
  }
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
};

