import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?.trim()
  .replace(/^["']|["']$/g, "");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
  );
}

try {
  new URL(supabaseUrl);
} catch {
  throw new Error(`SUPABASE_URL is not a valid URL. Got: "${supabaseUrl}"`);
}

if (!supabaseUrl.startsWith("https://")) {
  throw new Error(
    `SUPABASE_URL must start with https://. Got: "${supabaseUrl}"`
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
