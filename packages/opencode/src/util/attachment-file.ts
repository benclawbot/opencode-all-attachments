import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { extension } from "mime-types"
import { Global } from "@opencode-ai/core/global"

export async function matchesLocalAttachment(part: { filename?: string; url: string }) {
  if (!part.filename || !path.isAbsolute(part.filename)) return false
  const encoded = part.url.split(";base64,")[1]
  if (!part.url.startsWith("data:") || !encoded) return false
  const uploaded = Buffer.from(encoded, "base64")
  return readFile(part.filename).then(
    (disk) => disk.equals(uploaded),
    () => false,
  )
}

export async function attachmentPath(part: { filename?: string; url: string; mime: string }) {
  if (await matchesLocalAttachment(part)) return part.filename!
  if (part.url.startsWith("file:")) return fileURLToPath(part.url)
  if (!part.url.startsWith("data:")) return part.url
  const encoded = /^data:[^,]*;base64,([A-Za-z0-9+/]*={0,2})$/.exec(part.url)?.[1]
  if (encoded === undefined) throw new Error("Invalid attachment data URL")
  const bytes = Buffer.from(encoded, "base64")
  if (bytes.toString("base64").replace(/=+$/, "") !== encoded.replace(/=+$/, ""))
    throw new Error("Invalid attachment base64 data")
  const suffix = /\.[a-z0-9]{1,16}$/i.exec(part.filename ?? "")?.[0] ?? `.${extension(part.mime) || "bin"}`
  const filename = path.join(
    Global.Path.data,
    "attachments",
    `${createHash("sha256").update(bytes).digest("hex")}${suffix}`,
  )
  await mkdir(path.dirname(filename), { recursive: true })
  await writeFile(filename, bytes)
  return filename
}
