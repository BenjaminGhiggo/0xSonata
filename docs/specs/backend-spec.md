# Especificación de Backend – Sonetyo (Fase futura)

## 1. Objetivo

Proveer una API off-chain opcional que complemente a los contratos:
- Agregación de datos (listas de ideas por artista, proyectos enriquecidos).
- Indexación de eventos de la cadena.
- Endpoints amigables para el frontend.

## 2. Endpoints propuestos (versión mínima)

- `GET /artists/:address/ideas`
  - Devuelve lista de ideas registradas por ese artista (agregadas desde la chain, opcionalmente cacheadas en DB).

- `GET /artists/:address/projects`
  - Devuelve lista de proyectos (vaults) creados por ese artista, leídos desde la base de datos.

- `POST /projects`
  - Cuerpo:
    - `ideaTokenIds: number[]`
    - `metadata: { title: string; description: string; coverUrl?: string }`
    - `creatorAddress: string`
  - Flujo (versión actual):
    - (Fase siguiente) Validar que las ideas existan y pertenecen al creador (vía chain).
    - Persiste el proyecto off-chain en la base de datos.
    - (Fase siguiente) Sube metadata a IPFS → `metadataURI` y la guarda.
    - Devuelve payload para que el frontend pueda posteriormente llamar a `ProjectVault.createVault`.

## 3. Integración con blockchain

- Módulo `infrastructure/blockchain/syscoin-adapter`:
  - Conoce:
    - `SONETYO_NFT_ADDRESS`
    - `PROJECT_VAULT_ADDRESS`
  - Expone funciones de lectura:
    - `getIdeasByCreator(address)` (futuro)
    - `getVaultsByCreator(address)` (futuro, hoy se leen proyectos desde DB).

## 4. Base de datos

- Motor pensado para producción: **PostgreSQL**.
- Motor por defecto en el repositorio (desarrollo/local): **SQLite** (`./dev.db`).
- Tabla principal `projects` para persistir proyectos (vaults) off-chain:
  - `id` (PK interna, autoincremental)
  - `vault_id` (nullable, vinculado a ProjectVault cuando exista)
  - `creator_address` (text)
  - `idea_token_ids` (json / jsonb)
  - `title` (text)
  - `description` (text)
  - `cover_url` (text, nullable)
  - `metadata_uri` (text, nullable)
  - `created_at`, `updated_at` (timestamps)

