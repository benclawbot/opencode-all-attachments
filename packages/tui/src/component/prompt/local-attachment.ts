import { readFile } from "node:fs/promises"
import path from "node:path"

export type LocalFiles = Readonly<{
  readText(path: string): Promise<string>
  readBytes(path: string): Promise<Uint8Array>
  mime(path: string): Promise<string>
}>

export type LocalAttachment =
  | Readonly<{ type: "text"; mime: string; content: string }>
  | Readonly<{ type: "binary"; mime: string; content: Uint8Array }>

export function readLocalAttachment(file: string) {
  return readLocalAttachmentWith(
    {
      readText: (value) => readFile(value, "utf8"),
      readBytes: (value) => readFile(value),
      mime: async (value) => mimeTypes[path.extname(value).toLowerCase()] ?? "application/octet-stream",
    },
    file,
  )
}

const mimeTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".yaml": "application/yaml",
  ".yml": "application/yaml",
  ".toml": "application/toml",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".tar": "application/x-tar",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".doc": "application/msword",
  ".xls": "application/vnd.ms-excel",
  ".ppt": "application/vnd.ms-powerpoint",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".py": "text/x-python",
  ".js": "text/javascript",
  ".ts": "text/typescript",
  ".jsx": "text/jsx",
  ".tsx": "text/tsx",
  ".html": "text/html",
  ".css": "text/css",
  ".rs": "text/rust",
  ".go": "text/go",
  ".java": "text/java",
  ".c": "text/x-c",
  ".cpp": "text/x-c++",
  ".sh": "text/x-shellscript",
  ".exe": "application/octet-stream",
  ".dll": "application/octet-stream",
  ".bin": "application/octet-stream",
}

export async function readLocalAttachmentWith(files: LocalFiles, path: string): Promise<LocalAttachment | undefined> {
  const mime = await files.mime(path).catch(() => undefined)
  if (!mime) return
  if (mime === "image/svg+xml") {
    const content = await files.readText(path).catch(() => undefined)
    if (content === undefined) return
    return { type: "text", mime, content }
  }
  const isText =
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("yaml") ||
    mime.includes("toml")
  if (isText) {
    const textContent = await files.readText(path).catch(() => undefined)
    if (textContent === undefined) return
    return { type: "text", mime, content: textContent }
  }
  const bytes = await files.readBytes(path).catch(() => undefined)
  if (!bytes) return
  return { type: "binary", mime, content: bytes }
}
