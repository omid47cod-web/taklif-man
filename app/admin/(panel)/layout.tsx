import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    redirect('/admin/login')
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', data.claims.sub)
    .maybeSingle()

  if (adminError || !admin) {
    redirect('/admin/login')
  }

  return children
}