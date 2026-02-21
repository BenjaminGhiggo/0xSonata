export default () => {
  const rpcUrl = process.env.RPC_URL;

  if (!rpcUrl) {
    throw new Error(
      'RPC_URL no configurada en .env. ' +
      'Agrega RPC_URL=https://rpc-pob.dev11.top a tu backend/.env'
    );
  }

  let dbHost = process.env.DB_HOST || 'localhost';
  let dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  let dbUsername = process.env.DB_USERNAME || 'postgres';
  let dbPassword = process.env.DB_PASSWORD || 'postgres';
  let dbName = process.env.DB_NAME || '0xsonata';

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    dbHost = url.hostname;
    dbPort = parseInt(url.port || '5432', 10);
    dbUsername = url.username;
    dbPassword = url.password;
    dbName = url.pathname.replace('/', '');
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    rpcUrl,
    sonataNftAddress: process.env.SONATA_NFT_ADDRESS || '',
    projectVaultAddress: process.env.PROJECT_VAULT_ADDRESS || '',
    database: {
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      name: dbName,
    },
  };
};
