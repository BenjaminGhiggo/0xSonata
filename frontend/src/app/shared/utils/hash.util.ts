// POR QUE: El contrato SonataNFT espera un hash SHA-256 del audio como bytes32.
//   Calculamos el hash en el navegador para que el archivo nunca salga del
//   dispositivo del usuario (privacidad). Solo el hash (huella digital) se
//   envia a la blockchain.
//
// QUE: Funcion que recibe un File (archivo de audio), lee su contenido
//   como bytes, calcula SHA-256, y devuelve el hash en formato 0x...
//
// COMO: Paso a paso:
//   1. file.arrayBuffer() lee el archivo completo como bytes en memoria
//   2. crypto.subtle.digest('SHA-256', bytes) calcula el hash
//      (crypto.subtle es la API de criptografia nativa del navegador,
//       no requiere librerias externas)
//   3. Convertimos cada byte del hash a hexadecimal (ej: 255 -> "ff")
//   4. Concatenamos todo con prefijo "0x" (formato que espera el contrato)

export async function calculateFileHash(file: File): Promise<string> {


  // Paso 1: Leer el archivo como un array de bytes
  // arrayBuffer() devuelve una Promise porque leer archivos es asincrono
  const arrayBuffer = await file.arrayBuffer();

  // Paso 2: Calcular SHA-256
  // digest() toma el algoritmo y los bytes, devuelve el hash como ArrayBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

  // Paso 3: Convertir ArrayBuffer a array de bytes individuales
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Paso 4: Convertir cada byte a string hexadecimal de 2 caracteres
  // Ejemplo: byte 171 -> "ab", byte 15 -> "0f" (padStart agrega el 0)
  const hashHex = '0x' + hashArray
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');


  return hashHex;
}
