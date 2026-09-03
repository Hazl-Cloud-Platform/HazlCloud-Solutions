import { redirect } from 'next/navigation'
import { currentAdmin } from '@/lib/vibe/adminAuth'
import { AdminConsole } from '@/components/vibe/admin/AdminConsole'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await currentAdmin()
  if (!admin) redirect('/vibe/admin/login')
  return <AdminConsole email={admin} />
}
