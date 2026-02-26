# 0xSonata - Spec Driven Development (SDD)

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Especificación del Sistema](#especificación-del-sistema)
3. [Arquitectura](#arquitectura)
4. [Especificación de Smart Contracts](#especificación-de-smart-contracts)
5. [Especificación del Backend](#especificación-del-backend)
6. [Especificación del Frontend](#especificación-del-frontend)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [API Specification](#api-specification)
9. [Database Schema](#database-schema)
10. [Testing Strategy](#testing-strategy)

---

## Visión General

**0xSonata** es una plataforma de documentación de proceso creativo para músicos que utilizan IA, construida sobre zkSYS PoB Devnet.

**Problema**: La música generada 100% con IA no tiene copyright. Los artistas necesitan demostrar "control creativo humano significativo" para proteger su trabajo.

**Solución**: Documentar cada paso del proceso creativo en blockchain, creando una cadena de evidencia inmutable.

---

## Especificación del Sistema

### Requisitos Funcionales

| ID | Requisito | Prioridad | Estado |
|----|-----------|-----------|--------|
| RF-001 | Usuario puede registrar audio con hash SHA-256 | Alta | ✅ Implementado |
| RF-002 | Usuario puede documentar 5 pasos del proceso creativo | Alta | ✅ Implementado |
| RF-003 | Usuario puede verificar idea de otro artista | Alta | ✅ Implementado |
| RF-004 | Sistema muestra leaderboard de artistas | Media | ✅ Implementado |
| RF-005 | Sistema sincroniza blockchain con base de datos | Alta | ✅ Implementado |

### Requisitos No Funcionales

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-001 | Tiempo de respuesta API | < 200ms |
| RNF-002 | Disponibilidad | 99.9% |
| RNF-003 | Costo de transacción | < $0.01 USD (gas) |
| RNF-004 | Soporte de usuarios | 10,000+ concurrentes |

---

## Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Angular)                    │
│  - Wallet Connection (Pali/MetaMask)                    │
│  - Mint UI (5-step process)                             │
│  - Leaderboard Display                                  │
└────────────────┬────────────────────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────────────────────┐
│                   Backend (NestJS)                       │
│  - API Endpoints                                        │
│  - Blockchain Service (ethers.js)                       │
│  - Database Sync                                        │
│  - Leaderboard Service                                  │
└────────────────┬────────────────────────────────────────┘
                 │ TypeORM
┌────────────────▼────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  - artists table                                        │
│  - ideas table                                          │
│  - creative_steps table                                 │
└──────────────────────────────────────────────────────────┘
                 │ JSON-RPC
┌────────────────▼────────────────────────────────────────┐
│              zkSYS PoB Devnet (Blockchain)               │
│  - SonataNFT Contract                                   │
│  - ProjectVault Contract                                │
└──────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Smart Contracts | Solidity | 0.8.24 |
| Blockchain | zkSYS PoB Devnet | Chain ID 57042 |
| Backend Framework | NestJS | 11.x |
| Backend Language | TypeScript | 5.x |
| Frontend Framework | Angular | 21.x |
| Frontend Language | TypeScript | 5.9.x |
| Database | PostgreSQL | 16 |
| ORM | TypeORM | Latest |
| Blockchain Library | ethers.js | 6.16.0 |
| Wallet | Pali Wallet | Latest |
| Deploy | Docker Compose | Latest |

---

## Especificación de Smart Contracts

### SonataNFT

**Dirección**: `0x8b7597a435F55D56932c189D0004b647F97F9f0a`

#### Estructuras de Datos

```solidity
struct CreativeStep {
    bytes32 contentHash;    // Hash del contenido del paso
    uint8 stepType;         // 0=prompt, 1=variacion_ia, 2=seleccion, 3=edicion_daw, 4=master_final
    uint256 timestamp;      // Timestamp del registro
    string metadata;        // Descripción del paso
}

struct SonataProof {
    bytes32 audioHash;           // Hash del audio final
    uint256 timestamp;           // Timestamp del mint
    address creator;             // Dirección del creador
    uint256 verificationCount;   // Verificaciones recibidas
    uint256 stepCount;           // Cantidad de pasos documentados
}
```

#### Funciones Públicas

| Función | Parámetros | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `mint` | `bytes32 audioHash, string uri` | `uint256 tokenId` | Registra audio y crea NFT |
| `addStep` | `uint256 tokenId, bytes32 contentHash, uint8 stepType, string metadata` | `void` | Agrega paso al proceso |
| `verify` | `uint256 tokenId` | `void` | Verifica idea de otro artista |
| `getProof` | `uint256 tokenId` | `SonataProof` | Obtiene prueba completa |
| `getCreativeSteps` | `uint256 tokenId` | `CreativeStep[]` | Obtiene pasos documentados |
| `isHashRegistered` | `bytes32 audioHash` | `bool` | Verifica si hash ya existe |
| `deposit` | `payable` | `void` | Deposita stake para verificar |
| `getStakeBalance` | `address` | `uint256` | Obtiene balance de stake |

#### Eventos

```solidity
event SonataMinted(uint256 indexed tokenId, address indexed creator, bytes32 audioHash, uint256 timestamp);
event SonataVerified(uint256 indexed tokenId, address indexed verifier, uint256 newVerificationCount);
event StepAdded(uint256 indexed tokenId, uint8 stepType, bytes32 contentHash);
event StakeDeposited(address indexed user, uint256 amount);
```

#### Reglas de Negocio

1. **Mint**: 
   - El audioHash no puede estar previamente registrado
   - Emite evento `SonataMinted` y `Transfer` (ERC721)
   - El tokenId se incrementa secuencialmente

2. **AddStep**:
   - Solo el creador puede agregar pasos
   - stepType debe ser <= 4
   - Incrementa stepCount en SonataProof

3. **Verify**:
   - No se puede verificar tu propia idea
   - Requiere stake mínimo (0.001 tSYS)
   - No se puede verificar la misma idea dos veces

---

## Especificación del Backend

### Módulos Principales

#### 1. IdeasModule

**Responsabilidad**: Gestión de ideas y pasos creativos

**Endpoints**:
```typescript
GET  /api/ideas/:tokenId           // Obtener idea por Token ID
POST /api/ideas/sync               // Sincronizar idea desde blockchain
POST /api/ideas/sync-step          // Sincronizar paso desde blockchain
```

**Servicios**:
- `IdeasService`: Lógica de negocio de ideas
- `BlockchainService`: Interacción con smart contracts

#### 2. LeaderboardModule

**Responsabilidad**: Ranking de artistas

**Endpoints**:
```typescript
GET /api/leaderboard?limit=20  // Obtener top artistas
```

**Servicios**:
- `LeaderboardService`: Cálculo de scores y rankings

#### 3. ArtistsModule

**Responsabilidad**: Gestión de perfiles de artistas

**Endpoints**:
```typescript
GET /api/artists/:address/stats  // Obtener estadísticas de artista
```

### Base de Datos

#### Tabla: `artists`

```sql
CREATE TABLE artists (
    address VARCHAR(42) PRIMARY KEY,
    alias VARCHAR(255),
    totalMints INTEGER DEFAULT 0,
    totalVerificationsGiven INTEGER DEFAULT 0,
    totalVerificationsReceived INTEGER DEFAULT 0,
    tier INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    isSeed BOOLEAN DEFAULT false
);
```

#### Tabla: `ideas`

```sql
CREATE TABLE ideas (
    tokenId INTEGER PRIMARY KEY,
    audioHash VARCHAR(66) NOT NULL,
    creatorAddress VARCHAR(42) NOT NULL REFERENCES artists(address),
    verificationCount INTEGER DEFAULT 0,
    stepCount INTEGER DEFAULT 0,
    blockTimestamp BIGINT,
    txHash VARCHAR(66),
    tokenURI TEXT
);
```

#### Tabla: `creative_steps`

```sql
CREATE TABLE creative_steps (
    id SERIAL PRIMARY KEY,
    tokenId INTEGER NOT NULL REFERENCES ideas(tokenId),
    contentHash VARCHAR(66) NOT NULL,
    stepType INTEGER NOT NULL,
    metadata TEXT,
    blockTimestamp BIGINT,
    txHash VARCHAR(66)
);
```

### Servicios Backend

#### BlockchainService

```typescript
interface BlockchainService {
  getProof(tokenId: number): Promise<SonataProof>;
  getCreativeSteps(tokenId: number): Promise<CreativeStepData[]>;
  getTokenIdFromTx(txHash: string): Promise<string>;
  getTokenIdsByCreator(creatorAddress: string): Promise<string[]>;
}
```

#### IdeasService

```typescript
interface IdeasService {
  getIdea(tokenId: number): Promise<IdeaWithSteps>;
  syncIdea(data: SyncIdeaDTO): Promise<Idea>;
  syncStep(data: SyncStepDTO): Promise<CreativeStep>;
}

interface SyncIdeaDTO {
  tokenId: number;
  audioHash: string;
  creatorAddress: string;
  verificationCount: number;
  stepCount: number;
  blockTimestamp: number;
  txHash?: string;
}

interface SyncStepDTO {
  tokenId: number;
  contentHash: string;
  stepType: number;
  metadata: string;
  blockTimestamp: number;
  txHash?: string;
}
```

#### LeaderboardService

```typescript
interface LeaderboardService {
  getLeaderboard(limit: number): Promise<LeaderboardEntry[]>;
  upsertArtist(data: ArtistData): Promise<Artist>;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  alias: string;
  totalMints: number;
  totalVerificationsReceived: number;
  tier: number;
  tierLabel: string;
  score: number;
}
```

---

## Especificación del Frontend

### Componentes Principales

#### 1. MintComponent (`/mint`)

**Responsabilidad**: Registro de ideas y documentación de pasos

**Estado**:
```typescript
interface MintState {
  phase: 'upload' | 'steps' | 'complete';
  audioHash: string;
  mintedTokenId: string;
  completedStepIds: number[];
  stepFormData: Record<number, StepData>;
}

interface StepData {
  text: string;
  platform?: string;
  daw?: string;
  specs?: string;
}
```

**Flujo**:
1. Usuario sube archivo de audio
2. Calcula hash SHA-256
3. Ejecuta `mint()` en contrato
4. Sincroniza con backend (`/api/ideas/sync`)
5. Muestra formulario de 5 pasos
6. Por cada paso: `addStep()` + sync (`/api/ideas/sync-step`)

#### 2. LeaderboardComponent (`/`)

**Responsabilidad**: Mostrar ranking de artistas

**Estado**:
```typescript
interface LeaderboardState {
  entries: DisplayEntry[];
  isLoading: boolean;
  currentView: 'leaderboard' | 'register';
}
```

**Características**:
- Top 3 artistas con diseño destacado
- Lista de artistas restantes
- Avatar generado (Robohash)
- Score y tier de cada artista

#### 3. VerifyComponent (`/verify`)

**Responsabilidad**: Verificar ideas de otros artistas

**Estado**:
```typescript
interface VerifyState {
  tokenIdValue: string;
  stakeBalance: string;
  result: VerifySuccess | null;
}
```

**Flujo**:
1. Usuario ingresa Token ID
2. Verifica stake suficiente (mínimo 0.001 tSYS)
3. Ejecuta `verify()` en contrato
4. Muestra resultado

### Servicios Frontend

#### ContractService

```typescript
interface ContractService {
  mint(audioHash: string, uri: string): Promise<MintResult>;
  addStep(tokenId: number, contentHash: string, stepType: number, content: StepContent): Promise<string>;
  verify(tokenId: number): Promise<VerifyResult>;
  getProof(tokenId: number): Promise<SonataProof>;
  getCreativeSteps(tokenId: number): Promise<CreativeStepData[]>;
  findTokenIdsByOwner(address: string): Promise<string[]>;
}
```

#### WalletService

```typescript
interface WalletService {
  connect(): Promise<void>;
  disconnect(): void;
  account: Signal<string | null>;
  isConnected: Signal<boolean>;
  signer: Signal<JsonRpcSigner | null>;
}
```

#### ApiService

```typescript
interface ApiService {
  getLeaderboard(): Observable<LeaderboardEntry[]>;
  getArtistStats(address: string): Observable<ArtistStats>;
  getCertificate(tokenId: number): string;
}
```

---

## Flujos de Usuario

### Flujo 1: Registrar Idea Completa

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Usuario │     │ Frontend │     │ Backend  │     │ Database │     │Blockchain│
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │               │                │                │                │
     │ 1. Sube audio │                │                │                │
     │──────────────>│                │                │                │
     │               │                │                │                │
     │               │ 2. Calcula hash│                │                │
     │               │ SHA-256        │                │                │
     │               │                │                │                │
     │ 3. Confirma mint              │                │                │
     │───────────────────────────────>│                │                │
     │               │                │                │                │
     │               │ 4. mint()     │                │                │
     │               │────────────────────────────────────────────────>│
     │               │                │                │                │
     │               │ 5. TokenId=4  │                │                │
     │               │<────────────────────────────────────────────────│
     │               │                │                │                │
     │               │ 6. POST /sync │                │                │
     │               │───────────────>│                │                │
     │               │                │ 7. INSERT idea│                │
     │               │                │───────────────>│                │
     │               │                │                │                │
     │ 8. TokenId=4  │                │                │                │
     │<──────────────│                │                │                │
     │               │                │                │                │
     │ 9. Completa pasos             │                │                │
     │──────────────>│                │                │                │
     │               │                │                │                │
     │               │ 10. addStep() │                │                │
     │               │────────────────────────────────────────────────>│
     │               │                │                │                │
     │               │ 11. POST /sync-step           │                │
     │               │───────────────>│                │                │
     │               │                │ 12. INSERT step│               │
     │               │                │───────────────>│                │
     │               │                │                │                │
     │ 13. Éxito     │                │                │                │
     │<──────────────│                │                │                │
```

### Flujo 2: Verificar Idea

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Usuario │     │ Frontend │     │ Backend  │     │Blockchain│
└────┬────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │               │                │                │
     │ 1. Ingresa TokenId            │                │
     │──────────────>│                │                │
     │               │                │                │
     │ 2. Verifica stake             │                │
     │               │                │                │
     │ 3. Confirma verify            │                │
     │──────────────>│                │                │
     │               │                │                │
     │               │ 4. verify()   │                │
     │               │────────────────────────────────>│
     │               │                │                │
     │               │ 5. Éxito      │                │
     │               │<────────────────────────────────│
     │               │                │                │
     │ 6. Muestra resultado          │                │
     │<──────────────│                │                │
```

---

## API Specification

### Endpoints

#### GET `/api/leaderboard`

**Descripción**: Obtiene ranking de artistas

**Query Params**:
- `limit` (optional): Número de artistas a retornar (default: 20)

**Response**:
```json
[
  {
    "rank": 1,
    "address": "0xf32E0BE76ae8E0Aa83b6C34918128174F8757a3F",
    "alias": "Jake_FL",
    "totalMints": 5,
    "totalVerificationsReceived": 12,
    "tier": 1,
    "tierLabel": "Bronce",
    "score": 11000,
    "isSeed": false
  }
]
```

#### GET `/api/ideas/:tokenId`

**Descripción**: Obtiene idea con pasos

**Path Params**:
- `tokenId`: Token ID de la idea

**Response**:
```json
{
  "tokenId": 4,
  "audioHash": "0x34205346eedf...",
  "creator": "0xf32E0BE...",
  "verificationCount": 1,
  "stepCount": 5,
  "timestamp": 1772109202602,
  "steps": [
    {
      "contentHash": "0x...",
      "stepType": 0,
      "timestamp": 1772109202602,
      "metadata": "{\"prompt\":\"reggaeton beat...\"}"
    }
  ]
}
```

#### POST `/api/ideas/sync`

**Descripción**: Sincroniza idea desde blockchain

**Body**:
```json
{
  "tokenId": 4,
  "audioHash": "0x34205346eedf...",
  "creatorAddress": "0xf32E0BE...",
  "verificationCount": 0,
  "stepCount": 0,
  "blockTimestamp": 1772109202602,
  "txHash": "0xdf257c4a..."
}
```

**Response**: `200 OK`

#### POST `/api/ideas/sync-step`

**Descripción**: Sincroniza paso desde blockchain

**Body**:
```json
{
  "tokenId": 4,
  "contentHash": "0x1b906da6...",
  "stepType": 4,
  "metadata": "{\"platform\":\"\",\"daw\":\"\",\"specs\":\"lorem ipso\"}",
  "blockTimestamp": 1772107717082
}
```

**Response**: `200 OK`

#### GET `/api/artists/:address/stats`

**Descripción**: Obtiene estadísticas de artista

**Path Params**:
- `address`: Dirección del artista

**Response**:
```json
{
  "address": "0xf32E0BE...",
  "alias": null,
  "totalMints": 5,
  "totalVerificationsGiven": 3,
  "totalVerificationsReceived": 12,
  "tier": 1,
  "stakeBalance": "0.002"
}
```

---

## Database Schema

### Diagrama ER

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────────┐
│    artists      │       │      ideas       │       │  creative_steps    │
├─────────────────┤       ├──────────────────┤       ├────────────────────┤
│ address (PK)    │<──────│ creatorAddress   │       │ id (PK)            │
│ alias           │  1:N  │ tokenId (PK)     │  1:N  │ tokenId (FK)       │
│ totalMints      │       │ audioHash        │       │ contentHash        │
│ totalVerifGiven │       │ verificationCount│       │ stepType           │
│ totalVerifRecv  │       │ stepCount        │       │ metadata           │
│ tier            │       │ blockTimestamp   │       │ blockTimestamp     │
│ score           │       │ txHash           │       │ txHash             │
│ isSeed          │       │ tokenURI         │       │                    │
└─────────────────┘       └──────────────────┘       └────────────────────┘
```

### Índices

```sql
CREATE INDEX idx_ideas_creator ON ideas(creatorAddress);
CREATE INDEX idx_ideas_tokenid ON ideas(tokenId);
CREATE INDEX idx_steps_tokenid ON creative_steps(tokenId);
CREATE INDEX idx_artists_score ON artists(score DESC);
```

---

## Testing Strategy

### Smart Contracts

**Framework**: Hardhat + Chai

**Tests Implementados**: 19 tests

**Cobertura**:
- `mint()`: ✅
- `addStep()`: ✅
- `verify()`: ✅
- `getProof()`: ✅
- `getCreativeSteps()`: ✅
- Eventos: ✅

**Ejecutar Tests**:
```bash
cd contracts
npm test
```

### Backend

**Framework**: Jest (NestJS)

**Tests a Implementar**:
- IdeasService.syncIdea()
- IdeasService.syncStep()
- LeaderboardService.getLeaderboard()
- ArtistsService.getArtistStats()

**Ejecutar Tests**:
```bash
cd backend
npm run test
```

### Frontend

**Framework**: Karma + Jasmine (Angular)

**Tests a Implementar**:
- MintComponent: flujo completo de mint
- LeaderboardComponent: renderizado de entries
- VerifyComponent: verificación con stake

**Ejecutar Tests**:
```bash
cd frontend
npm run test
```

---

## Deployment

### Requisitos

- Docker & Docker Compose
- Node.js 20+
- PostgreSQL (en contenedor)
- Dominio configurado (opcional)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/BenjaminGhiggo/0xSonata.git
cd 0xSonata

# Ejecutar install.sh
chmod +x install.sh
./install.sh
```

### Variables de Entorno

#### Backend `.env`:
```env
PORT=3000
RPC_URL=https://rpc-pob.dev11.top
SONATA_NFT_ADDRESS=0x8b7597a435F55D56932c189D0004b647F97F9f0a
DATABASE_URL=postgresql://user:pass@localhost:5432/0xsonata
CORS_ORIGIN=https://0xsonata.site
```

#### Frontend `.env`:
```env
CONTRACT_ADDRESS=0x8b7597a435F55D56932c189D0004b647F97F9f0a
CHAIN_ID=57042
CHAIN_ID_HEX=0xDED2
RPC_URL=https://rpc-pob.dev11.top
EXPLORER_BASE_URL=https://explorer-pob.dev11.top
API_URL=/api
```

### Comandos Docker

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar servicio
docker compose restart backend

# Ver estado
docker compose ps
```

---

## Monitoreo

### Health Checks

```bash
# Backend health
curl https://0xsonata.site/api/health

# Expected response
{"status":"ok","timestamp":"2026-02-26T12:00:00.000Z"}
```

### Métricas a Monitorear

1. **Backend**:
   - Response time (p95 < 200ms)
   - Error rate (< 1%)
   - Active connections

2. **Blockchain**:
   - Gas price
   - Transaction confirmation time
   - Contract events

3. **Database**:
   - Query performance
   - Connection pool usage
   - Disk usage

---

## Changelog

### v1.0.0 (2026-02-26)

**Added**:
- SonataNFT contract deployed on zkSYS PoB Devnet
- Frontend Angular con mint de 5 pasos
- Backend NestJS con sync a database
- Leaderboard de artistas
- Verificación con stake
- Documentación SDD

**Fixed**:
- Leaderboard no mostraba usuarios (sync agregado)
- Foreign key constraints en database
- UX de stake en verificar

**Changed**:
- Forms simplificados (solo texto, IPFS próximamente)
- Mejora de UX en mensajes de error

---

## Contributing

### Cómo Contribuir

1. Fork del repositorio
2. Crear branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit de cambios (`git commit -m 'Add amazing feature'`)
4. Push a branch (`git push origin feature/amazing-feature`)
5. Pull Request

### Estándares de Código

- **TypeScript**: Strict mode activado
- **Smart Contracts**: Solidity ^0.8.24, tests obligatorios
- **Commits**: Convencionales (feat:, fix:, docs:, etc.)

---

## Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

## Contacto

- **GitHub**: https://github.com/BenjaminGhiggo/0xSonata
- **Twitter**: @0xSonata
- **Demo**: https://0xsonata.site
