// POR QUE: El backend necesita conocer 3 datos para funcionar:
//   1. RPC_URL: la direccion del nodo blockchain al que se conecta
//   2. SONATA_NFT_ADDRESS: la direccion del contrato desplegado
//   3. PORT: el puerto HTTP donde escucha peticiones
//
// QUE: Esta funcion lee esos 3 valores del archivo .env y los devuelve
//   como un objeto estructurado que cualquier servicio puede consultar.
//
// COMO: @nestjs/config llama a esta funcion al arrancar la aplicacion.
//   Internamente lee el archivo .env linea por linea (usa la libreria dotenv),
//   separa cada linea en clave=valor, y los deja en process.env.
//   Esta funcion simplemente toma esos valores y los agrupa en un objeto
//   con nombres claros y valores por defecto.
//
// VALIDACION ESTRICTA: Si RPC_URL no esta configurada, lanzamos un error
// inmediatamente. Esto evita que la aplicacion arranque silenciosamente
// y falle despues cuando se intente conectar a la blockchain.

export default () => {
  const rpcUrl = process.env.RPC_URL;
  const sonataNftAddress = process.env.SONATA_NFT_ADDRESS;

  // Validacion estricta: RPC_URL es obligatoria
  if (!rpcUrl) {
    throw new Error(
      'RPC_URL no configurada en .env. ' +
      'El backend no puede conectar a la blockchain sin una URL de nodo RPC. ' +
      'Agrega RPC_URL=https://rpc-pob.dev11.top a tu backend/.env'
    );
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    rpcUrl,
    sonataNftAddress: sonataNftAddress || '',
  };
};
