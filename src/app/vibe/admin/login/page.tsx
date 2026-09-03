import { redirect } from 'next/navigation'
import { currentAdmin } from '@/lib/vibe/adminAuth'
import { AdminLogin } from '@/components/vibe/admin/AdminLogin'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect('/vibe/admin')
  // The address list is deliberately NOT passed to the client. This URL is
  // public (the hidden trigger is discovery, not access control), and handing
  // over the admin addresses would undo the constant-time enumeration defence
  // in adminAuth.attemptLogin.
  return <AdminLogin />
}
