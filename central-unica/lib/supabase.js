// Cliente Supabase da Central Única.
// Enquanto as variáveis de ambiente não estiverem configuradas no Vercel
// (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY), o app roda em
// modo demonstração com dados de exemplo.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anonKey);

export const supabase = supabaseConfigurado ? createClient(url, anonKey) : null;
