# Especificación de Dominio – Sonetyo

## 1. Entidades principales

- **Idea musical (Sonetyo Proof)**
  - Representación on-chain: NFT ERC-721 (`SonetyoNFT`).
  - Atributos:
    - `audioHash` (`bytes32`): hash SHA-256 del archivo de audio.
    - `timestamp` (`uint256`): momento de registro.
    - `creator` (`address`): dirección del creador original.
    - `verificationCount` (`uint256`): verificaciones sociales recibidas.

- **Artista**
  - Representación on-chain: contrato ERC-20 (`CreatorToken`) desplegado para un artista concreto.
  - Atributos:
    - `artist` (`address`): dueño / owner del token.
    - `name`, `symbol`: identidad del token.
    - `totalSupply`: oferta total emitida.

- **Proyecto (Vault)**
  - Representación on-chain: NFT ERC-721 (`ProjectVault`).
  - Atributos:
    - `vaultId` (`uint256`): identificador del vault.
    - `creator` (`address`): creador del proyecto.
    - `ideaTokenIds` (`uint256[]`): lista de `tokenId` de `SonetyoNFT` incluidos.
    - `metadataURI` (`string`): metadata IPFS con título, descripción, portada, etc.

## 2. Relaciones

- Una **Idea**:
  - Pertenece a exactamente **un creador** (`creator`).
  - Puede aparecer en **cero o más Proyectos** (vaults).

- Un **Artista**:
  - Puede tener **muchas ideas** (varios `SonetyoNFT`).
  - Puede tener **uno o varios contratos CreatorToken** (para hackathon se asume 1 contrato principal).

- Un **Proyecto (Vault)**:
  - Agrupa **una o más ideas** de un único creador (simplificación actual).
  - Es representado por un NFT transferible (puede cambiar de dueño).

## 3. Casos de uso de dominio

1. **Registrar idea musical**
   - Entrada: archivo de audio.
   - Proceso: calcular hash SHA-256 en frontend → llamar a `SonetyoNFT.mint(hash, uri)`.
   - Resultado: NFT emitido al creador + registro inmutable on-chain.

2. **Verificar idea de otro artista**
   - Entrada: `tokenId`.
   - Proceso: `SonetyoNFT.verify(tokenId)` desde una dirección distinta a `creator`.
   - Resultado: incremento de `verificationCount` y métrica de reputación para verifier.

3. **Emitir Creator Token para un artista**
   - Entrada: `name`, `symbol`, `artist`, `initialSupply`.
   - Proceso: desplegar `CreatorToken` asociado a `artist`.
   - Resultado: el artista recibe el supply inicial para distribuir a seguidores.

4. **Crear Project Vault**
   - Entrada: lista de `ideaTokenIds`, `metadataURI`.
   - Proceso: validar que el llamador es creador/propietario de todas las ideas → mintear `ProjectVault`.
   - Resultado: un NFT que representa un proyecto (EP, álbum, pack de ideas) enlazado a Sonetyo Proofs existentes.

