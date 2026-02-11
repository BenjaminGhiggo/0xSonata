/**
 * Mapeo de errores técnicos a mensajes claros (Heurística 9 - Nielsen).
 * Ayuda al usuario a reconocer, diagnosticar y recuperarse del error.
 */
const ERROR_MAP = [
  { pattern: /insufficient funds|not enough funds/i, message: 'No tienes suficiente TSYS para pagar la gas. En la Devnet PoB el gas se acredita a wallets registradas.', action: null },
  { pattern: /user rejected|user denied/i, message: 'Rechazaste la transacción en la wallet. Puedes intentar de nuevo cuando quieras.', action: null },
  { pattern: /network error|could not detect network/i, message: 'Problema de conexión con la red. Comprueba tu internet y que estés en zkSYS PoB Devnet (57042).', action: 'network' },
  { pattern: /wrong network|invalid chain/i, message: 'Estás en otra red. La app te pedirá cambiar a zkSYS PoB Devnet.', action: null },
  { pattern: /already verified|already verified this/i, message: 'Ya habías verificado esta idea antes. Cada cuenta solo puede verificar una vez por idea.', action: null },
  { pattern: /nonexistent token|token does not exist/i, message: 'Ese Token ID no existe. Comprueba el número o regístrate tú primero una idea.', action: null },
  { pattern: /invalid token id/i, message: 'Token ID no válido. Usa un número entero (0, 1, 2...).', action: null },
  { pattern: /hash already registered|duplicate|este audio ya fue registrado/i, message: 'Ese audio (o uno idéntico) ya está registrado. Prueba con otro archivo o otra idea.', action: null },
];

const FAUCET_URL = 'https://faucet.syscoin.org/';
const EXPLORER_NETWORK = 'https://explorer-pob.dev11.top';

export function getFriendlyError(err) {
  const reason = err?.reason || err?.message || String(err);
  for (const { pattern, message, action } of ERROR_MAP) {
    if (pattern.test(reason)) return { message, action };
  }
  return { message: reason, action: null };
}

export { FAUCET_URL, EXPLORER_NETWORK };
