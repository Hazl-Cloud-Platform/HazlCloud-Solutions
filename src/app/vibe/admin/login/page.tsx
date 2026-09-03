import { redirect } from 'next/navigation'
import { currentAdmin } from '@/lib/vibe/adminAuth'
import { AdminLogin } from '@/components/vibe/admin/AdminLogin'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect('/vibe/admin')
  return <AdminLogin emails={(process.env.VIBE_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)} />
}
