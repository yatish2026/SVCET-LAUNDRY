import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://hmnutpplsmuyxtrkelrv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbnV0cHBsc211eXh0cmtlbHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNzQ1MTUsImV4cCI6MjEwMjg1MDUxNX0.wjQsU1vFiedMUolTx1uao4gjfRluHA3FVLeM6-ANqJw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
