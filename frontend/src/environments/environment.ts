// POR QUE: Centralizar la configuracion del frontend en un solo lugar.
//   Si cambia la direccion del contrato o la red, solo se modifica aqui.
//
// QUE: Exporta un objeto con los datos que el frontend necesita para
//   conectarse a la blockchain y mostrar links al explorer.
//
// COMO: Angular puede reemplazar este archivo por environment.prod.ts
//   en builds de produccion (configurado en angular.json).

export const environment = {
  production: false,

  // Direccion del contrato SonataNFT desplegado
  // Se obtiene tras ejecutar: cd ../contracts && npm run deploy:devnet
  contractAddress: '',

  // Chain ID de zkSYS PoB Devnet en formato hexadecimal y decimal
  chainIdHex: '0xDED2',
  chainId: 57042,

  // URL del nodo RPC para lecturas directas desde el frontend
  rpcUrl: 'https://rpc-pob.dev11.top',

  // URL base del block explorer para links a transacciones y direcciones
  explorerBaseUrl: 'https://explorer-pob.dev11.top',

  // Configuracion completa de la red (usada para agregarla a la wallet)
  networkConfig: {
    chainId: '0xDED2',
    chainName: 'zkSYS PoB Devnet',
    rpcUrls: ['https://rpc-pob.dev11.top'],
    nativeCurrency: {
      name: 'TSYS',
      symbol: 'TSYS',
      decimals: 18,
    },
    blockExplorerUrls: ['https://explorer-pob.dev11.top'],
  },

  // URL del backend NestJS
  apiUrl: 'http://localhost:3000/api',
};
