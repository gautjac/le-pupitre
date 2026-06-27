import JSZip from "jszip";
import type { GenerateResult } from "./python.ts";

/** Build a .zip Blob containing the generated script folder. */
export async function buildZip(result: GenerateResult): Promise<Blob> {
  const zip = new JSZip();
  for (const file of result.files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/** Trigger a browser download of the generated script as <scriptName>.zip. */
export async function downloadZip(result: GenerateResult): Promise<void> {
  const blob = await buildZip(result);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.scriptName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
