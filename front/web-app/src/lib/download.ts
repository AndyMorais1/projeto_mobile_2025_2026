// src/lib/download.ts (client-side)
export async function downloadFromUrl(url: string, filename: string) {
  const resp = await fetch(url); // sem credenciais; público
  if (!resp.ok) throw new Error(`Falha ao buscar recibo (${resp.status})`);
  const blob = await resp.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;         // força nome do ficheiro (mesma origem não é exigida p/ blob)
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
