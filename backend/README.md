# 🎵 Sonetyo

**"La idea musical existe desde el momento en que la creas."**

Sonetyo es una plataforma Web3 para que artistas casuales, emergentes y profesionales registren sus ideas musicales y obtengan una **prueba pública, inmutable y fechada de autoría** representada por un NFT, usando estándares EVM.

## 🚀 Estado del Proyecto

### ✅ Completado (Semana 1)

- **Smart Contract:** `SonetyoNFT.sol` (ERC-721) desplegable en zkSYS PoB Devnet (57042)
- **Tests:** 14 tests unitarios pasando
- **Frontend:** App React + Vite con conexión de wallet, mint y verify
- **Red:** zkSYS PoB Devnet (Chain ID 57042). Tras deploy, configurar `VITE_CONTRACT_ADDRESS` en `frontend/.env`

### 📋 Funcionalidades

- ✅ Registro on-chain de ideas musicales (mint)
- ✅ Verificación social de ideas (verify)
- ✅ Prevención de duplicados (hash-based)
- ✅ Estadísticas del creador (getCreatorStats)
- ✅ UI responsive para móviles
- ✅ Conexión automática a red zkSYS PoB Devnet (57042)

## 🛠️ Instalación y Uso

### Prerrequisitos

- Node.js 18+ (o 20+ recomendado)
- npm o yarn
- Pali Wallet instalada

### Backend (Smart Contracts)

```bash
# Instalar dependencias
npm install

# Compilar contratos
npx hardhat compile

# Ejecutar tests
npx hardhat test

# Deploy a zkSYS PoB Devnet (requiere PRIVATE_KEY en .env; usa la wallet registrada en el programa)
npx hardhat run scripts/deploy.js --network devnet
# Luego crea frontend/.env con: VITE_CONTRACT_ADDRESS=<dirección_del_contrato>
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

Abre http://localhost:3000 en tu navegador.

## 📁 Estructura del Proyecto

```
hackathon-blockchain/
├── contracts/
│   └── SonetyoNFT.sol          # Contrato principal
├── frontend/                    # App React + Vite
│   ├── src/
│   │   ├── components/         # WalletConnect, MintForm, VerifyForm
│   │   ├── hooks/              # useWallet
│   │   ├── utils/              # config, hash calculation
│   │   └── App.jsx
│   └── package.json
├── scripts/
│   └── deploy.js               # Script de deploy
├── test/
│   └── SonetyoNFT.test.js      # Tests unitarios
├── hardhat.config.js
└── README.md
```

## 🔗 Links Importantes

- **Red:** zkSYS PoB Devnet (Chain ID: 57042)
- **RPC:** https://rpc-pob.dev11.top
- **Explorer:** https://explorer-pob.dev11.top
- **Gas (TSYS):** Se acredita a las wallets registradas en el programa Proof-of-Builders (100 TSYS por equipo)

## 📖 Documentación

- **Propuesta completa:** Ver `propuesta.md`
- **Plan de implementación:** Ver `plan.md`
- **Criterios del hackathon:** Ver `criterios.md`
- **Entregable Semana 1:** Ver `entregable.semana1.md`

## 🎯 Casos de Uso

### 1. Registrar una idea musical
1. Conecta tu wallet
2. Sube un archivo de audio (beat, melodía, loop, tarareo)
3. El sistema calcula el hash SHA-256 automáticamente
4. Haz clic en "Registrar Idea"
5. Recibe tu NFT de prueba con Token ID, hash y timestamp

### 2. Verificar ideas de otros artistas
1. Conecta tu wallet
2. Introduce el Token ID de una idea registrada
3. Haz clic en "Verificar Idea"
4. La idea recibe una verificación adicional

### 3. Prevención de plagio
- Si alguien intenta registrar el mismo archivo de audio, el sistema detecta el hash duplicado y rechaza la transacción

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PRIVATE_KEY=tu_private_key_de_testnet
CONTRACT_ADDRESS=0x136aC7D8D981f013524718B46AbB83d99c265f3f
PINATA_API_KEY=opcional
PINATA_SECRET=opcional
```

**⚠️ Nunca subas tu `.env` a git.** Usa `.env.example` como plantilla.

## 📝 Licencia

MIT

## 🙏 Agradecimientos

- Syscoin Foundation por el ecosistema y herramientas
- OpenZeppelin por los contratos base
- Comunidad Syscoin Proof-of-Builders
