// A small, shared browser-download helper, used by every generated document
// (PDF, JSON, CSV) so there is exactly one place that creates the Blob and
// the temporary link, instead of each generator repeating it.

export function downloadBytes(bytes: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string, mimeType: string): void {
  downloadBytes(new TextEncoder().encode(text), filename, mimeType);
}
