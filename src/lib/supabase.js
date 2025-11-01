import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// loginBuyer().then((data) => {
//     console.log(data);
// }).catch(() => {
//     console.log("買家登入失敗");
// })

// async function loginBuyer() {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email: "tao_test@example.com",
//     password: "testpassword"
//   });
//   if (error || !data?.session) {
//     console.error('❌ 買家登入失敗:', error?.message);
//     return null;
//   }
//   await supabase.auth.setSession({
//     access_token: data.session.access_token,
//     refresh_token: data.session.refresh_token
//   });
//   console.log('✅ 買家登入成功，session 已設置');
//   return data.user;
// }