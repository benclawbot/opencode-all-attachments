import { expect, test } from "bun:test"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

test("OpenAI-compatible models forward arbitrary attachments to the provider", async () => {
  let body: { messages: Array<{ content: unknown }> } | undefined
  const model = createOpenAICompatible({
    name: "test",
    baseURL: "https://example.test/v1",
    fetch: Object.assign(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        body = JSON.parse(String(init?.body))
        return new Response(
          JSON.stringify({
            id: "test",
            object: "chat.completion",
            created: 0,
            model: "test",
            choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 1, completion_tokens: 1 },
          }),
          { headers: { "content-type": "application/json" } },
        )
      },
      { preconnect: fetch.preconnect },
    ),
  })("test")

  await model.doGenerate({
    prompt: [
      {
        role: "user",
        content: [
          { type: "text", text: "Read these attachments" },
          {
            type: "file",
            mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename: "notes.docx",
            data: new Uint8Array([1, 2, 3]),
          },
          { type: "file", mediaType: "video/mp4", filename: "clip.mp4", data: new Uint8Array([4, 5]) },
          { type: "file", mediaType: "application/octet-stream", filename: "blob.bin", data: new Uint8Array([6]) },
          { type: "file", mediaType: "text/plain", filename: "note.txt", data: new TextEncoder().encode("hello") },
        ],
      },
    ],
  })

  expect(body?.messages[0]?.content).toEqual([
    { type: "text", text: "Read these attachments" },
    {
      type: "file",
      file: {
        filename: "notes.docx",
        file_data: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AQID",
      },
    },
    { type: "file", file: { filename: "clip.mp4", file_data: "data:video/mp4;base64,BAU=" } },
    { type: "file", file: { filename: "blob.bin", file_data: "data:application/octet-stream;base64,Bg==" } },
    { type: "text", text: "hello" },
  ])
})
