"use client"

import { useEffect } from "react"
import { AdminPanel } from "@/components/memorial/admin/admin-panel"
import { useMemorial } from "@/lib/store"

export default function AdminPage() {
  const { load, data } = useMemorial()

  // Load site data (pages, settings, fonts...) so admin tabs have content
  useEffect(() => {
    if (!data) load()
  }, [load, data])

  return <AdminPanel onClose={() => { window.location.href = "/" }} onChanged={load} />
}
