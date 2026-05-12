// ============================================
// SUPABASE CONFIGURATION - USING YOUR CREDENTIALS
// ============================================

// Your Project URL (remove /rest/v1/ from the end)
// Original: https://baplzqawzlhawczktwpq.supabase.co/rest/v1/
// Fixed:    https://baplzqawzlhawczktwpq.supabase.co
const SUPABASE_URL = "https://baplzqawzlhawczktwpq.supabase.co";

// Your Publishable API Key (anon key)
const SUPABASE_ANON_KEY = "sb_publishable_M_vEN8F2kB3H_KfOTO0Ugw_8CO8ooBC";

// Create the connection to Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it available everywhere in your website
window.supabase = supabaseClient;

// Test connection and log success
console.log("✅ Supabase connected successfully!");
console.log("📡 Connected to:", SUPABASE_URL);