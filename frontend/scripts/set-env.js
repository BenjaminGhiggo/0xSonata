/**
 * set-env.js
 *
 * Lee .env y genera los archivos environment.ts (dev) y environment.prod.ts (prod).
 *
 * POR QUE: Angular no tiene acceso a process.env en el navegador.
 *   Las variables de blockchain (direccion de contrato, RPC, chain ID)
 *   deben vivir en .env, nunca hardcodeadas en el codigo fuente.
 *   Este script es el puente: .env -> TypeScript -> Angular lo compila.
 *
 * COMO FUNCIONA:
 *   1. Lee .env linea por linea, ignora comentarios (#) y lineas vacias
 *   2. Extrae pares clave=valor
 *   3. Genera environment.ts (production: false) y environment.prod.ts (production: true)
 *
 * SE EJECUTA AUTOMATICAMENTE:
 *   - Antes de `ng serve` (via script "prestart" en package.json)
 *   - Antes de `ng build` (via script "prebuild" en package.json)
 *   - Manualmente con `npm run config`
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const envsDir = path.resolve(__dirname, '..', 'src', 'environments');

if (!fs.existsSync(envPath)) {
  process.exit(1);
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    vars[trimmed.substring(0, eqIndex).trim()] = trimmed.substring(eqIndex + 1).trim();
  }
  return vars;
}

const vars = parseEnvFile(envPath);

const required = ['CONTRACT_ADDRESS', 'CHAIN_ID', 'RPC_URL'];
const missing = required.filter((k) => !vars[k]);
if (missing.length > 0) {
  process.exit(1);
}

const chainId = parseInt(vars['CHAIN_ID'], 10);
const chainIdHex = vars['CHAIN_ID_HEX'] || '0x' + chainId.toString(16).toUpperCase();
const explorerBaseUrl = vars['EXPLORER_BASE_URL'] || '';

function generateEnvFile(isProduction) {
  const apiUrl = isProduction ? '/api' : (vars['API_URL'] || 'http://localhost:3000/api');

  return `// ARCHIVO GENERADO por scripts/set-env.js — NO EDITAR MANUALMENTE
// Para cambiar valores, edita .env y ejecuta: npm run config

export const environment = {
  production: ${isProduction},

  contractAddress: '${vars['CONTRACT_ADDRESS']}',

  chainId: ${chainId},
  chainIdHex: '${chainIdHex}',
  rpcUrl: '${vars['RPC_URL']}',
  explorerBaseUrl: '${explorerBaseUrl}',

  networkConfig: {
    chainId: '${chainIdHex}',
    chainName: 'zkSYS PoB Devnet',
    nativeCurrency: { name: 'tSYS', symbol: 'tSYS', decimals: 18 },
    rpcUrls: ['${vars['RPC_URL']}'],
    blockExplorerUrls: ${explorerBaseUrl ? `['${explorerBaseUrl}']` : '[]'},
  },

  apiUrl: '${apiUrl}',
};
`;
}

fs.mkdirSync(envsDir, { recursive: true });

const devPath = path.join(envsDir, 'environment.ts');
const prodPath = path.join(envsDir, 'environment.prod.ts');

fs.writeFileSync(devPath, generateEnvFile(false), 'utf-8');
fs.writeFileSync(prodPath, generateEnvFile(true), 'utf-8');

