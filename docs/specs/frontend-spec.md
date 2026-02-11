# Especificación de Frontend – Sonetyo dApp

## 1. Páginas principales

1. **Home**
   - Secciones:
     - Conectar wallet (zkSYS PoB Devnet).
     - Registrar nueva idea (usa `SonetyoNFT.mint`).
     - Verificar idea (usa `SonetyoNFT.verify`).
     - Ayuda / explicación del flujo.

2. **Artist Dashboard**
   - Solo accesible con wallet conectada.
   - Muestra:
     - Stats del creador (`getCreatorStats` de `SonetyoNFT`).
     - Lista de ideas registradas (lectura de eventos o consultas por rango de `tokenId`).
     - Bloque “Creator Token”:
       - Dirección del `CreatorToken` asociado (config o leído de backend).
       - Supply, balance del artista.

3. **Projects (Vaults)**
   - Crear nuevo proyecto:
     - Seleccionar ideas propias (lista de `tokenId` donde `creator == msg.sender`).
     - Título / descripción → se suben a IPFS → `metadataURI`.
     - Botón “Crear Vault” → `ProjectVault.createVault`.
   - Ver proyectos existentes:
     - Lista de vaults del creador (por ahora filtrado simple por eventos `VaultCreated`).
     - Detalle de un vault: lista de ideas incluidas + link a cada `tokenId`.

## 2. Servicios de blockchain

`frontend/src/services/blockchain-service.(ts|js)` expondrá:

- `getSonetyoContract(providerOrSigner)`
- `getCreatorTokenContract(address, providerOrSigner)`
- `getProjectVaultContract(providerOrSigner)`
- Funciones de alto nivel:
  - `registerIdea(file, metadata)` → hash + llamada a `mint`.
  - `verifyIdea(tokenId)` → `verify`.
  - `createVault(ideaIds, metadataURI)` → `createVault`.

## 3. Gestión de estado

- `WalletContext` (ya existente) se considera la fuente de verdad de:
  - `account`, `chainId`, `provider`, `signer`.
- Se ampliará para:
  - Guardar direcciones de:
    - `SONETYO_NFT_ADDRESS`
    - `CREATOR_TOKEN_ADDRESS` (por ahora demo)
    - `PROJECT_VAULT_ADDRESS`

