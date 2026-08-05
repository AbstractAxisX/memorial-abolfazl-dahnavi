export function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

export async function parseJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
