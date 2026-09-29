import { readFile } from "node:fs/promises"
import { isAbsolute } from "node:path"

export async function matchesLocalAttachment(part: { filename?: string; url: string }) {
  if (!part.filename || !isAbsolute(part.filename)) return false
  const encoded = part.url.split(";base64,")[1]
  if (!part.url.startsWith("data:") || !encoded) return false
  const uploaded = Buffer.from(encoded, "base64")
  return readFile(part.filename).then(
    (disk) => disk.equals(uploaded),
    () => false,
  )
}
