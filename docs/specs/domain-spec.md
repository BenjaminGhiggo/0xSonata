# Especificación de Dominio – 0xSonata

## 1. Entidades principales

- **Idea musical (Sonata Proof)**
  - Representación on-chain: NFT ERC-721 (`SonataNFT`).
  - Atributos:
    - `audioHash` (`bytes32`): hash SHA-256 del archivo de audio (puede provenir tanto de creaciones tradicionales como de herramientas de IA musical).
    - `timestamp` (`uint256`): momento de registro.
    - `creator` (`address`): dirección del creador original.
    - `verificationCount` (`uint256`): verificaciones sociales recibidas.

- **Artista**
  - Representación on-chain: contrato ERC-20 (`CreatorToken`) desplegado para un artista concreto.
  - Pensado para artistas **emergentes** que hoy pueden iniciar su carrera creativa apoyándose en herramientas de IA musical.
  - Atributos on-chain:
    - `artist` (`address`): dueño / owner del token.
    - `name`, `symbol`: identidad del token.
    - `totalSupply`: oferta total emitida.
  - Atributos off-chain (calculados en backend para rankings):
    - `totalIdeas`: número total de ideas registradas.
    - `totalVerificationsGiven`: verificaciones realizadas a otros artistas.
    - `tier`: nivel en la tierlist (Oro / Plata / Bronce / Emergente).
    - `rankGlobal`: posición en el ranking global.

- **Proyecto (Vault)**
  - Representación on-chain: NFT ERC-721 (`ProjectVault`).
  - Atributos:
    - `vaultId` (`uint256`): identificador del vault.
    - `creator` (`address`): creador del proyecto.
    - `ideaTokenIds` (`uint256[]`): lista de `tokenId` de `SonataNFT` incluidos.
    - `metadataURI` (`string`): metadata IPFS con título, descripción, portada, etc.

## 2. Relaciones

- Una **Idea**:
  - Pertenece a exactamente **un creador** (`creator`).
  - Puede aparecer en **cero o más Proyectos** (vaults).

- Un **Artista**:
  - Puede tener **muchas ideas** (varios `SonataNFT`).
  - Puede tener **uno o varios contratos CreatorToken** (para hackathon se asume 1 contrato principal).

- Un **Proyecto (Vault)**:
  - Agrupa **una o más ideas** de un único creador (simplificación actual).
  - Es representado por un NFT transferible (puede cambiar de dueño).

## 3. Casos de uso de dominio

1. **Registrar idea musical (incluyendo ideas generadas o asistidas por IA)**
   - Entrada: archivo de audio (grabación, demo, loop, beat o pieza generada/asistida por IA musical).
   - Proceso: calcular hash SHA-256 en frontend → llamar a `SonataNFT.mint(hash, uri)`.
   - Resultado: NFT emitido al creador + registro inmutable on-chain que actúa como **prueba de existencia y autoría** de la idea, independientemente de si la herramienta utilizada fue tradicional o IA.

2. **Verificar idea de otro artista**
   - Entrada: `tokenId`.
   - Proceso: `SonataNFT.verify(tokenId)` desde una dirección distinta a `creator`.
   - Resultado: incremento de `verificationCount` y métrica de reputación para verifier.

3. **Emitir Creator Token para un artista**
   - Entrada: `name`, `symbol`, `artist`, `initialSupply`.
   - Proceso: desplegar `CreatorToken` asociado a `artist`.
   - Resultado: el artista recibe el supply inicial para distribuir a seguidores.

4. **Crear Project Vault**
   - Entrada: lista de `ideaTokenIds`, `metadataURI`.
   - Proceso: validar que el llamador es creador/propietario de todas las ideas → mintear `ProjectVault`.
   - Resultado: un NFT que representa un proyecto (EP, álbum, pack de ideas) enlazado a Sonata Proofs existentes.

5. **Rankear artistas y contenidos**
   - Entrada: métricas on-chain (`creatorMintCount`, `verificationCount`, etc.) y datos off-chain agregados en backend.
   - Proceso: cálculo periódico de rankings (Top creadores, Top ideas verificadas, Emergentes de la semana) y asignación de una **tier visual** (Oro en llamas, Plata reluciente, Bronce brillante) para los primeros puestos.
   - Resultado: un modelo de reputación visible para los usuarios que premia la constancia creativa y la participación social, especialmente importante en un contexto donde la IA facilita la creación de cada vez más artistas emergentes.


