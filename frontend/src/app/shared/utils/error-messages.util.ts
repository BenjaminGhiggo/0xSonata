// POR QUE: Los errores de la blockchain son tecnicos y crípticos para el usuario.
//   Por ejemplo: "CALL_EXCEPTION" o "insufficient funds for intrinsic transaction cost".
//   Necesitamos traducirlos a mensajes claros y utiles.
//
// QUE: Funcion que recibe un error y devuelve un mensaje amigable en espanol.
//   Cada patron regex busca palabras clave en el mensaje de error.
//
// COMO: Iteramos por una lista de patrones regex. Si alguno coincide con el
//   texto del error, devolvemos el mensaje asociado. Si ninguno coincide,
//   devolvemos el mensaje original tal cual.

import { environment } from '../../../environments/environment';

// Lista de patrones: cada uno tiene un regex (patron de busqueda)
// y un mensaje amigable para el usuario
const ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /insufficient funds|not enough funds/i,
    message: 'No tienes suficiente TSYS para pagar el gas. En la Devnet PoB el gas se acredita a wallets registradas.',
  },
  {
    pattern: /user rejected|user denied/i,
    message: 'Rechazaste la transaccion en la wallet. Puedes intentar de nuevo cuando quieras.',
  },
  {
    pattern: /network error|could not detect network/i,
    message: 'Problema de conexion con la red. Comprueba tu internet y que estes en zkSYS PoB Devnet (57042).',
  },
  {
    pattern: /already verified|Ya verificaste/i,
    message: 'Ya habias verificado esta idea antes. Cada cuenta solo puede verificar una vez por idea.',
  },
  {
    pattern: /No puedes verificar tu propia idea/i,
    message: 'No puedes verificar tu propia idea. Pide a otro artista que la verifique.',
  },
  {
    pattern: /Token no existe/i,
    message: 'Ese Token ID no existe. Comprueba el numero o registra una idea primero.',
  },
  {
    pattern: /Este audio ya fue registrado/i,
    message: 'Ese audio (o uno identico) ya esta registrado. Prueba con otro archivo.',
  },
  {
    pattern: /Hash invalido/i,
    message: 'El hash del audio no es valido. Intenta seleccionar otro archivo.',
  },
];

export function getFriendlyError(err: unknown): string {
  // Extraemos el texto del error (puede venir en .reason, .message, o como string)
  const errorObj = err as { reason?: string; message?: string };
  const reason = errorObj.reason || errorObj.message || String(err);

  // Buscamos si algun patron coincide con el texto del error
  for (let i = 0; i < ERROR_MAP.length; i++) {
    if (ERROR_MAP[i].pattern.test(reason)) {
      return ERROR_MAP[i].message;
    }
  }

  // Si ningun patron coincide, devolvemos el mensaje original
  return reason;
}

export const EXPLORER_BASE_URL = environment.explorerBaseUrl;
