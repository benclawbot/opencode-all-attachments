import { describe, expect, test } from "bun:test"
import { createPromptInputV2Attachments } from "./attachments"
import type { PromptInputV2Prompt } from "./types"

describe("prompt input v2 attachments", () => {
  test("adds text, PDF, archive, office, audio, video, and unknown binary files", async () => {
    let prompt: PromptInputV2Prompt = [{ type: "text", content: "", start: 0, end: 0 }]
    const attachments = createPromptInputV2Attachments({
      capture: () => ({
        current: () => prompt,
        cursor: () => 0,
        set: (value) => {
          prompt = value
        },
      }),
      editor: () => ({} as HTMLElement),
      focusEditor: () => undefined,
      addPart: () => true,
      setDraggingType: () => undefined,
      directory: () => "/repo",
      isDialogActive: () => false,
      warn: () => undefined,
      duplicate: () => undefined,
      onError: () => undefined,
      store: async (file) => ({ id: file.name, url: `blob:${file.name}` }),
    })

    expect(
      await attachments.addAttachments([
        new File(["{}"], "data.json", { type: "application/json" }),
        new File([Uint8Array.of(0, 255)], "guide.pdf", { type: "application/pdf" }),
        new File([Uint8Array.of(0, 255)], "archive.zip", { type: "application/zip" }),
        new File([Uint8Array.of(0, 255)], "report.docx", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
        new File([Uint8Array.of(0, 255)], "audio.wav", { type: "audio/wav" }),
        new File([Uint8Array.of(0, 255)], "video.mp4", { type: "video/mp4" }),
        new File([Uint8Array.of(0, 255)], "blob.bin", { type: "application/octet-stream" }),
      ]),
    ).toBe(true)

    expect(prompt.filter((part) => part.type === "image").map((part) => part.mime)).toEqual([
      "text/plain",
      "application/pdf",
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "audio/wav",
      "video/mp4",
      "application/octet-stream",
    ])
  })
})
