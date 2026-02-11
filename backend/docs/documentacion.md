## ✅ Segunda revisión — Cumplimiento de requisitos (Sonetyo)

Este documento resume cómo **Sonetyo** cumple con todos los requisitos de la 2da revisión del programa **zkSYS Proof‑of‑Builders**.

---

### 1. Nombre final del proyecto

- **Nombre oficial:** `Sonetyo`
- **Descripción corta:**  
  **Sonetyo** es una plataforma Web3 para que artistas casuales, emergentes y profesionales registren sus ideas musicales (beats, melodías, loops, tarareos, demos) y obtengan una **prueba pública, inmutable y fechada de autoría** representada por un NFT en la red zkSYS PoB.

---

### 2. Documentación técnica y de diseño (arquitectura)

**Arquitectura general**

- **Frontend (`frontend/`):**
  - Implementado con **React + Vite**.
  - Conexión a wallet a través de `window.ethereum` (Pali Wallet).
  - Componentes principales:
    - `WalletConnect` + `WalletContext` (`frontend/src/components/WalletConnect.jsx`, `frontend/src/context/WalletContext.jsx`): gestionan conexión de la wallet, detección de red y estado compartido (cuenta conectada, `signer`, contrato).
    - `MintForm` (`frontend/src/components/MintForm.jsx`): permite subir un archivo de audio, calcular el hash SHA‑256 en el navegador y llamar a `mint(bytes32 audioHash, string uri)` en el contrato.
    - `VerifyForm` (`frontend/src/components/VerifyForm.jsx`): permite introducir un Token ID y llamar a `verify(uint256 tokenId)` para atestiguar ideas de otros artistas.
  - Utiliza **`ethers.js`** con `BrowserProvider` y `Signer` para firmar transacciones y leer datos del contrato `SonetyoNFT`.
  - Configuración de contrato y red centralizada en `frontend/src/utils/config.js`, donde se importa `VITE_CONTRACT_ADDRESS` desde variables de entorno y se define la configuración de **zkSYS PoB Devnet (Chain ID 57042)**.

- **Backend / Smart Contracts (`backend/`):**
  - Proyecto **Hardhat** con:
    - `backend/hardhat.config.js` — configuración de redes (incluyendo `devnet` → zkSYS PoB Devnet), compilador Solidity (0.8.24) y toolbox.
    - `backend/contracts/SonetyoNFT.sol` — contrato ERC‑721 principal.
    - `backend/scripts/deploy.js` — script de despliegue a zkSYS PoB Devnet.
    - `backend/test/SonetyoNFT.test.js` — 14 tests unitarios para validar el comportamiento.
  - **Contrato `SonetyoNFT.sol`:**
    - Deriva de `ERC721` y `ERC721URIStorage` (OpenZeppelin).
    - `mint(bytes32 audioHash, string uri) external returns (uint256)`  
      Registra una idea musical calculando su hash SHA‑256 en el frontend y almacenándolo on‑chain junto con un `timestamp` y el `creator`. Previene duplicados usando `hashExists[audioHash]`.
    - `verify(uint256 tokenId) external`  
      Permite a cualquier cuenta, excepto el propio creador del NFT, atestiguar que conoce/ha visto la idea asociada al `tokenId`, incrementando `verificationCount` y `verifierCount[msg.sender]`. Evita verificaciones duplicadas por la misma cuenta.
    - `getProof(uint256 tokenId) external view returns (SonetyoProof)`  
      Devuelve la estructura `SonetyoProof` (hash del audio, timestamp, creador, número de verificaciones).
    - `getCreatorStats(address creator) external view returns (uint256 totalMints, uint256 totalVerificationsGiven)`  
      Proporciona métricas de reputación del creador.
    - `isHashRegistered(bytes32 audioHash) external view returns (bool)`  
      Permite al frontend saber si un determinado hash ya está registrado, usado para prevenir reverts y mejorar la UX.
  - Estructura y diseño se documentan en:
    - `backend/README.md` (instalación, estructura de carpetas, flujo general).
    - `backend/propuesta.md` (visión, capas del sistema, relación con la economía creativa).
    - `backend/plan.md` (roadmap de implementación).
    - `backend/criterios.md` y `backend/entregable.semana1.md` (alineación con los criterios del programa).

---

### 3. URL para testear la demo

- **URL de la demo en producción:**  
  [`https://sonetyo.netlify.app/`](https://sonetyo.netlify.app/)

Desde esta URL cualquier revisor puede:

1. Conectar su wallet Pali (en el navegador).
2. Ver el estado de conexión y la red (zkSYS PoB Devnet).
3. Subir un archivo de audio y registrar una idea musical on‑chain (`mint`).
4. Ver el Token ID, hash de la transacción y enlace al explorer.
5. Verificar una idea existente introduciendo el Token ID y ejecutando `verify`.

---

### 4. Contrato desplegado en zkSYS PoB Devnet

- **Red:** `zkSYS PoB Devnet`
  - Chain ID: **57042**
  - RPC: `https://rpc-pob.dev11.top`
  - Explorer: `https://explorer-pob.dev11.top`

- **Contrato principal (SonetyoNFT):**

  - **Dirección (último despliegue):**

    ```text
    0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373
    ```

  - **Explorer:**  
    [`https://explorer-pob.dev11.top/address/0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373`](https://explorer-pob.dev11.top/address/0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373)

- **Script de despliegue:**  
  `backend/scripts/deploy.js`  
  (usa la red `devnet` configurada en `hardhat.config.js` y la `PRIVATE_KEY` de la wallet registrada en el programa).

---

### 5. Integración con la wallet

- **Wallet soportada:** [Pali Wallet](https://paliwallet.com/) (extensión de navegador).
- **Características de la integración:**
  - Detección de `window.ethereum` y comprobación de que Pali está instalada.
  - Solicitud de conexión de cuenta mediante `eth_requestAccounts`.
  - Cambio automático a la red **zkSYS PoB Devnet** si el usuario está en otra red:
    - Usa `wallet_switchEthereumChain` con `chainId: "0xDED2"`.
    - Si la red no está añadida en Pali, se llama a `wallet_addEthereumChain` con la configuración de la devnet (RPC, nombre, símbolo TSYS, explorer).
  - Obtención del `signer` desde `ethers.BrowserProvider` (`new ethers.BrowserProvider(window.ethereum)`), utilizado para firmar las transacciones `mint` y `verify`.
  - El estado de conexión (cuenta, red, contrato) se gestiona mediante `WalletContext` y el hook `useWallet`, compartiéndolo entre `WalletConnect`, `MintForm` y `VerifyForm`.

- **UX y manejo de errores:**
  - Estados de carga visibles: “Calculando huella del audio…”, “Firmando en tu wallet…”, “Confirmando en la blockchain…”.
  - Mensajes amigables para:
    - Fondos insuficientes (explicando que se requiere TSYS para gas).
    - Red incorrecta (indicando que debe cambiar a zkSYS PoB Devnet).
    - Intentos de auto‑verificación o verificaciones duplicadas.
    - Intentos de registrar un audio ya registrado (`isHashRegistered`).

---

### 6. Código fuente en GitHub para auditoría

Todo el código fuente del proyecto está publicado en un repositorio público de GitHub.

- **Repositorio:**  
  `hackathon-blockchain` (organizado en dos carpetas principales: `backend/` y `frontend/`).

- **Contenido relevante:**
  - **Backend (`backend/`):**
    - `contracts/SonetyoNFT.sol` — contrato principal ERC‑721.
    - `test/SonetyoNFT.test.js` — tests unitarios (14 casos).
    - `scripts/deploy.js` — script de despliegue a zkSYS PoB Devnet.
    - `hardhat.config.js` — configuración de Hardhat y redes.
    - Documentación y archivos de diseño (`propuesta.md`, `plan.md`, `criterios.md`, `entregable.semana1.md`).
  - **Frontend (`frontend/`):**
    - Componentes React (`src/components/`: `WalletConnect`, `MintForm`, `VerifyForm`, `HelpCard`).
    - Contexto y hook de wallet (`src/context/WalletContext.jsx`, `src/hooks/useWallet.js`).
    - Configuración de contrato y red (`src/utils/config.js`).
    - Estilos y tema (`src/App.css`).

Esta organización permite a los revisores auditar tanto la lógica on‑chain como la integración de frontend con la wallet y el contrato.

---

### 7. Cuenta oficial de X (Twitter) para difusión

Para la comunicación y difusión del proyecto se utiliza la siguiente cuenta oficial de X (Twitter):

- **Cuenta:** [`@0xSonata`](https://x.com/0xSonata)

Desde esta cuenta se comparten:

- Actualizaciones de progreso del proyecto Sonetyo.
- Enlaces a la demo (`https://sonetyo.netlify.app/`).
- Comunicaciones relacionadas con el hackathon y la comunidad.

---

### 8. Observaciones resueltas

A lo largo del desarrollo se identificaron y resolvieron las siguientes observaciones:

1. **Migración de Tanenbaum a zkSYS PoB Devnet**
   - Antes: el contrato y la dApp apuntaban a Syscoin Tanenbaum Testnet.
   - Ahora: el contrato `SonetyoNFT` está desplegado en **zkSYS PoB Devnet (57042)** y el frontend está configurado para usar esa red y la dirección de contrato via `VITE_CONTRACT_ADDRESS`.

2. **Sincronización del estado de la wallet entre componentes**
   - Problema: cada componente (WalletConnect, MintForm, VerifyForm) gestionaba su propia instancia de `useWallet`, generando estados inconsistentes.
   - Solución: creación de un único `WalletContext` y un hook `useWallet` compartido, que expone `account`, `chainId`, `signer` y `contract` a todos los componentes. Esto garantiza que la conexión y la red se gestionan de forma centralizada.

3. **Manejo de errores en `mint` (hash duplicado y `missing revert data`)**
   - Problema: cuando se intentaba registrar un audio ya registrado, el contrato revertía con un mensaje genérico y el frontend mostraba `missing revert data (CALL_EXCEPTION)`.
   - Solución: el frontend llama previamente a `contract.isHashRegistered(hash)` y, si devuelve `true`, muestra un mensaje claro al usuario (“Este audio ya fue registrado on‑chain. Elige otro archivo o idea.”) sin ni siquiera abrir la ventana de firma. Además, se mejoró el mapeo de errores (`errorMessages.js`) para traducir las razones del revert a mensajes legibles.

4. **Claridad y estética de la interfaz (heurísticas de Nielsen)**
   - Se aplicaron mejoras de UX:
     - Tema claro y vivo, con un encabezado que incluye una **clave de sol** (𝄞) y el nombre “Sonetyo” en degradado rojo‑rosa‑morado.
     - Mensajes de estado (visibilidad del sistema) durante operaciones críticas.
     - Textos y placeholders descriptivos (qué es un Token ID, qué formatos de audio se aceptan, etc.).
     - Mensajes de error en español claro, indicando tanto el problema como la acción sugerida.

Con todo lo anterior, **Sonetyo** cumple los criterios de la 2da revisión:

- Nombre final del proyecto.
- Documentación técnica y de arquitectura.
- URL pública para probar la demo.
- Contrato desplegado en zkSYS PoB Devnet.
- Integración con wallet.
- Código fuente disponible para auditoría.
- Cuenta oficial de X para difusión.
- Observaciones técnicas y de UX resueltas.

