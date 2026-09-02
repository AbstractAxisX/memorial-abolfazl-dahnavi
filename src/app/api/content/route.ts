import { fetchSiteData } from "@/lib/site-data"

export const dynamic = "force-dynamic"

// GET the full site tree: settings + pages (with sections) + blog posts + guest messages + custom fonts + media
// NOTE: sensitive fields (adminPassword*) are stripped server-side.
export async function GET() {
  const data = await fetchSiteData()
  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  })
}
