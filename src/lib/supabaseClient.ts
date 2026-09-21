import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cliente Supabase (Etapa 11: nuvem). `undefined` enquanto as variáveis de
 * ambiente não estiverem configuradas — o app continua funcionando 100%
 * local nesse caso (login/sincronização ficam ocultos em Configurações).
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : undefined

export const isCloudEnabled = Boolean(supabase)
