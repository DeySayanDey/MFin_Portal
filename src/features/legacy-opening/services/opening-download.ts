export async function downloadWorkbook(response: Response, fallbackName: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const encoded = /(?:^|;)\s*filename\*\s*=\s*UTF-8'[^']*'([^;]+)/i.exec(disposition);
  const quoted = /(?:^|;)\s*filename\s*=\s*"((?:\\.|[^"\\])*)"/i.exec(disposition);
  const plain = /(?:^|;)\s*filename\s*=\s*([^;\s]+)/i.exec(disposition);
  let filename = quoted?.[1]?.replace(/\\(.)/g, "$1") ?? plain?.[1] ?? fallbackName;
  if (encoded) {
    try {
      filename = decodeURIComponent(encoded[1].trim());
    } catch {
      // Use the ordinary filename or fallback when the encoded name is invalid.
    }
  }
  filename = filename.split(/[\\/]/).pop()?.trim() || fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
