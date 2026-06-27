import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

interface Ctrl {
  id: string;
  label: string;
  kind: "fader" | "knob" | "button";
  strip: number | null;
}
interface Tgt {
  id: string;
  label: string;
  category: string;
  suits: ("fader" | "knob" | "button")[];
}

const ndjson = (obj: unknown) => JSON.stringify(obj) + "\n";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = (await req.json().catch(() => null)) as
    | { instruction?: string; controls?: Ctrl[]; targets?: Tgt[] }
    | null;

  const instruction = (body?.instruction ?? "").trim();
  const controls = body?.controls ?? [];
  const targets = body?.targets ?? [];
  if (!instruction || controls.length === 0 || targets.length === 0) {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.CLAUDE_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const beat = setInterval(() => {
        try {
          controller.enqueue(enc.encode("\n"));
        } catch {
          /* closed */
        }
      }, 10000);

      const finish = (result: unknown) => {
        try {
          controller.enqueue(enc.encode(ndjson({ result })));
        } catch {
          /* closed */
        }
        clearInterval(beat);
        controller.close();
      };

      if (!apiKey) {
        finish({ assignments: {}, note: "Clé IA absente sur le serveur — édite le mappage à la main." });
        return;
      }

      try {
        const result = await propose(apiKey, instruction, controls, targets);
        finish(result);
      } catch {
        finish({ assignments: {}, note: "L'assistant IA n'a pas répondu — réessaie ou édite à la main." });
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
};

async function propose(apiKey: string, instruction: string, controls: Ctrl[], targets: Tgt[]) {
  const client = new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });

  const kindById = new Map(controls.map((c) => [c.id, c.kind]));
  const targetById = new Map(targets.map((t) => [t.id, t]));

  const tool: Anthropic.Tool = {
    name: "set_mapping",
    description: "Assign a Live action target id to each physical control id.",
    input_schema: {
      type: "object",
      properties: {
        assignments: {
          type: "array",
          description: "One entry per control you want to assign. Omit controls left untouched.",
          items: {
            type: "object",
            properties: {
              controlId: { type: "string" },
              targetId: { type: "string" },
            },
            required: ["controlId", "targetId"],
          },
        },
        note: { type: "string", description: "One short French sentence summarising the mapping." },
      },
      required: ["assignments"],
    },
  };

  const system = [
    "Tu configures une surface de contrôle MIDI pour Ableton Live (un Korg nanoKONTROL Studio).",
    "On te donne la liste des contrôles physiques (avec leur type: fader, knob, button et leur numéro de piste) et la liste des actions Live possibles (avec les types de contrôle qu'elles acceptent).",
    "Assigne à chaque contrôle pertinent une action via l'outil set_mapping.",
    "Règles STRICTES:",
    "- targetId DOIT exister dans la liste des actions.",
    "- L'action doit accepter le type du contrôle (champ 'suits').",
    "- Les actions de piste (volume, pan, mute, solo, arm, sélection, envois) doivent aller sur le contrôle de la BONNE piste (respecte le numéro de strip).",
    "- N'invente jamais d'id. Réponds uniquement via l'outil.",
  ].join("\n");

  const userPayload = {
    instruction,
    controls,
    targets,
  };

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: "set_mapping" },
    messages: [{ role: "user", content: JSON.stringify(userPayload) }],
  });

  const block = res.content.find((b) => b.type === "tool_use") as
    | Anthropic.ToolUseBlock
    | undefined;
  const input = (block?.input ?? {}) as {
    assignments?: { controlId: string; targetId: string }[];
    note?: string;
  };

  const assignments: Record<string, string> = {};
  for (const a of input.assignments ?? []) {
    const kind = kindById.get(a.controlId);
    const tgt = targetById.get(a.targetId);
    if (!kind || !tgt) continue;
    if (!tgt.suits.includes(kind)) continue; // enforce compatibility
    assignments[a.controlId] = a.targetId;
  }

  return { assignments, note: input.note ?? null };
}
