/**
 * Calcula el hash SHA-256 de un archivo (ArrayBuffer)
 * @param {File} file - Archivo a hashear
 * @returns {Promise<string>} Hash hexadecimal con prefijo 0x
 */
export async function calculateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
