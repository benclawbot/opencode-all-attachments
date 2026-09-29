import { describe, expect, test } from "bun:test"
import { readLocalAttachmentWith } from "../../src/component/prompt/local-attachment"
import type { LocalFiles } from "../../src/component/prompt/local-attachment"

function files(input: { mime: string; text?: string; bytes?: Uint8Array }): LocalFiles {
  return {
    mime: async () => input.mime,
    readText: async () => input.text ?? "",
    readBytes: async () => input.bytes ?? new Uint8Array(),
  }
}

describe("prompt local attachments", () => {
  test("reads SVG attachments as text", async () => {
    expect(await readLocalAttachmentWith(files({ mime: "image/svg+xml", text: "<svg />" }), "/tmp/image.svg")).toEqual({
      type: "text",
      mime: "image/svg+xml",
      content: "<svg />",
    })
  })

  test("reads image and PDF attachments as bytes", async () => {
    const content = new Uint8Array([1, 2, 3])
    expect(await readLocalAttachmentWith(files({ mime: "application/pdf", bytes: content }), "/tmp/file.pdf")).toEqual({
      type: "binary",
      mime: "application/pdf",
      content,
    })
  })

  test("reads text and any binary file type", async () => {
    expect(await readLocalAttachmentWith(files({ mime: "text/csv", text: "name,count\nalpha,1\n" }), "/tmp/data.csv"))
      .toEqual({ type: "text", mime: "text/csv", content: "name,count\nalpha,1\n" })

    const content = new Uint8Array([1, 2, 3])
    for (const mime of ["application/zip", "audio/wav", "video/mp4", "application/octet-stream"]) {
      expect(await readLocalAttachmentWith(files({ mime, bytes: content }), "/tmp/file.bin")).toEqual({
        type: "binary",
        mime,
        content,
      })
    }
  })

  test("allows empty text files and ignores unreadable files", async () => {
    expect(await readLocalAttachmentWith(files({ mime: "text/plain", text: "" }), "/tmp/empty.txt")).toEqual({
      type: "text",
      mime: "text/plain",
      content: "",
    })
    expect(
      await readLocalAttachmentWith(
        {
          ...files({ mime: "image/png" }),
          readBytes: async () => Promise.reject(new Error("missing")),
        },
        "/tmp/missing.png",
      ),
    ).toBeUndefined()
  })
})
