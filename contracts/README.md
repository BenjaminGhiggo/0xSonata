# 0xSonata - Contratos Inteligentes

Contratos ERC-721 para registro de ideas musicales en zkSYS PoB Devnet (Chain ID: 57042).

---

## Requisitos Previos

1. **Node.js** v20 o superior
2. **npm** v10 o superior
3. **Wallet** con tokens tSYS (para deploy en devnet)

---

## Instalación

### Paso 1: Instalar dependencias

```bash
cd /home/benjamin/Documentos/mvp/auto/u42/v2-bc/0xSonata/contracts
npm install
```

---

## Configuración

### Paso 2: Crear archivo .env

Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

### Paso 3: Editar .env con tus datos

```bash
nano .env
```

Contenido requerido:

```env
# Private key de tu wallet (zkSYS PoB Devnet)
PRIVATE_KEY=tu_clave_privada_aqui

# URL del nodo RPC
RPC_URL=https://rpc-pob.dev11.top

# Chain ID de la red
CHAIN_ID=57042

# URLs del explorador
EXPLORER_API_URL=https://explorer-pob.dev11.top/api
EXPLORER_BROWSER_URL=https://explorer-pob.dev11.top
```

**Importante:** Nunca compartas tu `PRIVATE_KEY`. Este archivo está en `.gitignore`.

---

## Comandos Disponibles

### 1. Compilar contratos

Compila los contratos Solidity y genera los archivos ABI y TypeChain:

```bash
npm run compile
```

**Qué hace:**
- Lee `contracts/SonataNFT.sol`
- Genera `artifacts/` con el bytecode y ABI
- Genera `typechain-types/` para TypeScript

**Salida esperada:**
```
Compiled 20 Solidity files successfully
Generating typings for: 20 artifacts
```

---

### 2. Ejecutar tests

Ejecuta los tests unitarios de los contratos:

```bash
npm run test
```

**Qué hace:**
- Corre 19 tests en una blockchain local (Hardhat Network)
- Prueba mint, verify, consultas y casos borde

**Salida esperada:**
```
  SonataNFT
    Mint
      ✔ should mint with valid hash (50ms)
      ✔ should emit SonataMinted event
      ...
  19 passing (500ms)
```

---

### 3. Desplegar a Devnet

Despliega el contrato a zkSYS PoB Devnet:

```bash
npm run deploy:devnet
```

**Qué hace:**
- Conecta a `https://rpc-pob.dev11.top`
- Despliega `SonataNFT.sol` con tu wallet
- Imprime la dirección del contrato

**Salida esperada:**
```
Deploying SonataNFT with account: 0xTuWallet...
SonataNFT deployed to: 0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373
```

**Importante:** Guardá la dirección que se muestra. La necesitarás en `backend/.env` y `frontend/.env`.

---

### 4. Desplegar en red local (testing)

Despliega en una blockchain local de Hardhat (puerto 8545):

```bash
npm run deploy:local
```

**Qué hace:**
- Levanta una blockchain efímera en memoria
- Despliega el contrato
- Útil para tests rápidos sin gastar gas

---

## Estructura de Archivos

```
contracts/
├── contracts/
│   └── SonataNFT.sol       # Contrato principal (ERC-721)
├── scripts/
│   └── deploy.ts           # Script de despliegue
├── test/
│   └── SonataNFT.test.ts   # Tests unitarios
├── hardhat.config.ts       # Configuración de Hardhat
├── package.json            # Dependencias y scripts
├── .env.example            # Plantilla de variables
└── .env                    # Variables (NO subir a git)
```

---

## Funciones del Contrato

### SonataNFT (ERC-721)

| Función | Tipo | Descripción |
|---------|------|-------------|
| `mint(bytes32 audioHash, string uri)` | Write | Registra una nueva idea musical |
| `verify(uint256 tokenId)` | Write | Verifica la idea de otro artista |
| `getProof(uint256 tokenId)` | View | Obtiene datos de una idea |
| `getCreatorStats(address creator)` | View | Estadísticas de un artista |
| `isHashRegistered(bytes32 audioHash)` | View | Verifica si un hash ya existe |
| `totalSupply()` | View | Cantidad total de ideas registradas |

---

## Flujo de Trabajo Típico

### Primera vez (despliegue inicial)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env
nano .env  # Agregar PRIVATE_KEY

# 3. Compilar
npm run compile

# 4. Testear
npm run test

# 5. Desplegar a devnet
npm run deploy:devnet

# 6. Copiar dirección del contrato a backend/.env y frontend/.env
```

### En una nueva PC (contrato ya desplegado)

```bash
# 1. Clonar repositorio
git clone <repo>
cd contracts

# 2. Instalar dependencias
npm install

# 3. Configurar .env con la dirección EXISTENTE
cp .env.example .env
nano .env  # Agregar PRIVATE_KEY y verificar RPC_URL

# 4. NO hace falta desplegar de nuevo
# El contrato ya vive en la blockchain

# 5. Opcional: compilar para tener los artifacts
npm run compile
```

---

## Solución de Problemas

### Error: "insufficient funds for gas"

**Causa:** Tu wallet no tiene tSYS suficiente en devnet.

**Solución:** Solicita tokens en el faucet de zkSYS PoB Devnet.

---

### Error: "PRIVATE_KEY no configurada"

**Causa:** El archivo `.env` no tiene `PRIVATE_KEY`.

**Solución:**
```bash
cp .env.example .env
nano .env  # Agregar tu clave privada
```

---

### Error: "nonce has already been used"

**Causa:** Múltiples transacciones con el mismo nonce.

**Solución:** Esperá a que la transacción anterior se confirme antes de enviar otra.

---

### Error: "contract not deployed"

**Causa:** Intentás usar una dirección de contrato que no existe en la blockchain.

**Solución:** Verificá que `SONATA_NFT_ADDRESS` en `backend/.env` y `frontend/.env` sea correcta.

---

## Red Actual

| Parámetro | Valor |
|-----------|-------|
| Red | zkSYS PoB Devnet |
| Chain ID | 57042 (0xDED2) |
| RPC URL | https://rpc-pob.dev11.top |
| Explorer | https://explorer-pob.dev11.top |
| Token | tSYS (test) |

---

## Recursos

- [Documentación de Hardhat](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [zkSYS PoB Devnet Docs](https://docs.syscoin.org)

---

## Soporte

Para dudas o problemas, abrir un issue en el repositorio principal.
