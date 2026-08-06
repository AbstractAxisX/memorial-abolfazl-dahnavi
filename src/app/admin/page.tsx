"use client"

import { AdminPanel } from "@/components/memorial/admin/admin-panel"
import { useMemorial } from "@/lib/store"

export default function AdminPage() {
  const { load } = useMemorial()
  return <AdminPanel onClose={() => { window.location.href = "/" }} onChanged={load} />
}
