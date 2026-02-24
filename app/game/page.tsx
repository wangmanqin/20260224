import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TankGame from './TankGame';

export default async function GamePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 如果用户未登录，重定向到登录页
    redirect('/login');
  }

  return <TankGame />;
}