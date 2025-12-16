// src/api/client.ts  (ou onde estiver no teu projeto)

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// logs só para debug
console.log("🔧 URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("🔑 KEY:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "✅ OK" : "❌ MISSING");

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// *** AQUI ESTÁ A MAGIA: storage + persistSession ***
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // obrigatório no mobile
    },
});
