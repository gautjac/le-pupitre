import { useState } from "react";
import type { GenerateResult } from "../generator/python.ts";

const KEYWORDS = [
  "from",
  "import",
  "class",
  "def",
  "self",
  "return",
  "with",
  "as",
  "if",
  "else",
  "None",
  "True",
  "False",
  "super",
];

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Conservative, line-based Python highlighter (safe: escapes first). */
function highlight(code: string): string {
  const kw = new RegExp(`\\b(${KEYWORDS.join("|")})\\b`, "g");
  return code
    .split("\n")
    .map((line) => {
      const hashAt = line.indexOf("#");
      const codePart = hashAt >= 0 ? line.slice(0, hashAt) : line;
      const commentPart = hashAt >= 0 ? line.slice(hashAt) : "";
      let html = escapeHtml(codePart).replace(
        kw,
        '<span class="text-violet">$1</span>',
      );
      html = html.replace(/"([^"]*)"/g, '<span class="text-lime">"$1"</span>');
      html = html.replace(/\b(\d+)\b/g, '<span class="text-amber-glow">$1</span>');
      if (commentPart) {
        html += `<span class="text-ink-dim">${escapeHtml(commentPart)}</span>`;
      }
      return html || "&nbsp;";
    })
    .join("\n");
}

export function CodePreview({
  generated,
  onExport,
}: {
  generated: GenerateResult;
  onExport: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generated.mainModule);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div>
      {generated.warnings.length > 0 && (
        <div className="border-b border-amber-deep/40 bg-amber/10 px-4 py-2 text-xs text-amber-glow">
          {generated.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-desk-edge bg-desk-rail/40 px-4 py-2">
        <span className="text-xs text-ink-dim">
          {generated.files.length} fichiers · {generated.scriptName}/
        </span>
        <div className="flex gap-2">
          <button className="btn px-3 py-1.5 text-xs" onClick={copy}>
            {copied ? "Copié ✓" : "Copier"}
          </button>
          <button className="btn btn-amber px-3 py-1.5 text-xs font-semibold" onClick={onExport}>
            Télécharger .zip
          </button>
        </div>
      </div>
      <pre className="scroll-thin max-h-[420px] overflow-auto bg-desk-black/70 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-soft">
        <code dangerouslySetInnerHTML={{ __html: highlight(generated.mainModule) }} />
      </pre>
    </div>
  );
}
