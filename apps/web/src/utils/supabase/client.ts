import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const getSupabaseConfig = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
};

export const createClient = () => {
  const { url, publishableKey } = getSupabaseConfig();

  return createBrowserClient(url, publishableKey);
};
