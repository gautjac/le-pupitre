// Prompt-caching contract of /api/automap. This file lives outside
// netlify/functions/ on purpose: every file in that directory is deployed as a
// function.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./functions/automap.mts";
import { buildAutoMapPayload } from "../src/lib/automap.ts";
import { NANOKONTROL_STUDIO } from "../src/model/device.ts";
import type { Lang } from "../src/i18n/core.ts";

interface TextBlock {
  type: string;
  text: string;
  cache_control?: { type: string };
}
interface SentBody {
  model: string;
  system: unknown;
  tools: unknown;
  tool_choice: unknown;
  messages: { role: string; content: TextBlock[] }[];
}

/** Run the real handler with the payload the real client builds; return the
 * request body the SDK sent to the API. */
async function sentBody(instruction: string, lang: Lang): Promise<SentBody> {
  let raw = "";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
      raw = String(init?.body);
      return new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-opus-4-8",
          content: [{ type: "tool_use", id: "tu", name: "set_mapping", input: { assignments: [], note: "ok" } }],
          stop_reason: "tool_use",
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }),
  );
  const res = await handler(
    new Request("http://localhost/api/automap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAutoMapPayload(NANOKONTROL_STUDIO, instruction, lang)),
    }),
  );
  await res.text(); // drain the NDJSON stream so the call completes
  return JSON.parse(raw) as SentBody;
}

/** Everything up to and including the cache breakpoint, as the API sees it. */
const cachedPrefix = (b: SentBody) =>
  JSON.stringify([b.model, b.tools, b.tool_choice, b.system, b.messages[0].content[0]]);

describe("automap request — cacheable prefix", () => {
  beforeEach(() => {
    vi.stubEnv("CLAUDE_API_KEY", "test-key-not-sent");
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("puts the device payload first, with the breakpoint, and the instruction after it", async () => {
    const b = await sentBody("Faders to volume, knobs to pan.", "en");
    const [payload, instr] = b.messages[0].content;
    expect(payload.cache_control).toEqual({ type: "ephemeral" });
    expect(Object.keys(JSON.parse(payload.text))).toEqual(["controls", "targets"]);
    expect(payload.text).not.toContain("Faders to volume");
    expect(instr.cache_control).toBeUndefined();
    expect(JSON.parse(instr.text)).toEqual({ instruction: "Faders to volume, knobs to pan." });
  });

  it.each<Lang>(["en", "fr"])("two different instructions share a byte-identical prefix (%s)", async (lang) => {
    const a = await sentBody("A classic mixer: faders to volume, knobs to pan.", lang);
    const b = await sentBody("Faders 1–4 to volume, faders 5–8 to Send A, the rec buttons arm tracks.", lang);
    expect(cachedPrefix(a)).toBe(cachedPrefix(b));
    expect(a.messages[0].content[1].text).not.toBe(b.messages[0].content[1].text);
  });
});
