# Especificación de Frontend – Sonetyo

## 1. Clientes previstos

- **Cliente web** (React + Vite, actual):
  - Interfaz principal de la dApp.
  - Integra wallet EVM (Pali/Metamask compatible con zkSYS PoB Devnet).
  - Orientado tanto a artistas tradicionales como a creadores que utilizan **herramientas de IA musical** (Suno, Udio, etc.) para generar sus primeras ideas.

La visión de Sonetyo es acompañar a la nueva ola de **artistas emergentes potenciados por IA**, permitiéndoles registrar pruebas de sus creaciones y mostrar sus méritos mediante rankings y reputación visible.

## 2. Rutas/páginas principales (cliente web)

1. `/landing` – Landing pública
   - Objetivo: atraer usuarios y clientes.
   - Contenido:
     - Hero con mensaje principal:
       - “La IA llegó a la música para quedarse. Sonetyo te ayuda a registrar tus ideas y mostrar tu éxito.”
     - Explicación de las 3 capas:
       - Prueba de creatividad (NFT ideas).
       - Reputación (stats, verificaciones, rankings).
       - Tokenización (Creator Tokens y Project Vaults).
     - Call-to-action:
       - “Registrar mi primera idea” (lleva al flujo de registro).
       - “Explorar artistas emergentes”.
     - Sección “¿Cómo funciona?” con 3 pasos:
       - Crear idea (incluso con IA musical).
       - Registrar hash en Sonetyo.
       - Crecer en reputación y ranking.

2. `/dashboard` – Dashboard de artista (requiere wallet conectada)
   - Módulos:
     - **Resumen**:
       - Stats del creador (`getCreatorStats` + datos agregados del backend).
       - Resumen de Creator Token (si existe).
       - Vista rápida de su posición en el ranking y de su tier (Oro/Plata/Bronce/Emergente).
     - **Mis ideas**:
       - Lista de ideas registradas (SonetyoNFT) con filtros.
       - Acciones: ver detalle, copiar hash, ver en explorer.
       - Enlace directo a herramientas de IA musical recomendadas (Suno, Udio, etc.), reforzando el mensaje de que la creatividad asistida por IA también merece ser registrada.
     - **Mis proyectos (Vaults)**:
       - Crear proyecto:
         - Selección de ideas propias.
         - Campos `title`, `description`, `coverUrl`.
         - Enviar payload al backend (`POST /api/projects`) y, en una fase posterior, usar `ProjectVault.createVault`.
       - Lista de proyectos guardados y on-chain.

3. `/explore` – Exploración pública
   - Listado de:
     - Artistas destacados según rankings.
     - Proyectos recientes (Vaults).
     - Ideas más verificadas.
   - Ranking visible:
     - Tarjetas especiales para top 3 (ver sección 3).
     - Resto del top 10 con tarjetas simplificadas.

4. `/admin` – Panel de administración (interno/staff)
   - Herramientas de monitorización:
     - Listas globales de rankings.
     - Estadísticas de uso.
   - No se exponen acciones de gestión crítica en esta fase, solo lectura.

## 3. Tierlist y Rankings

### 3.1. Ranking principal – Top creadores por ideas registradas

- Métrica base:
  - Número total de ideas registradas (`creatorMintCount`) y, opcionalmente, combinación con verificaciones recibidas.
- Visual:
  - **Primer lugar**:
    - Tarjeta con borde dorado, efecto de “llamas” suaves (animación CSS controlada).
    - Insignia: “🔥 Oro – Leyenda Sonetyo”.
  - **Segundo lugar**:
    - Tarjeta con borde plata reluciente, brillo animado.
    - Insignia: “🥈 Plata – Estrella en ascenso”.
  - **Tercer lugar**:
    - Tarjeta con borde bronce brillante.
    - Insignia: “🥉 Bronce – Artista destacado”.
  - Resto del top 10:
    - Tarjetas sencillas con medalla numérica.

### 3.2. Ranking adicional – Top ideas verificadas

- Métrica:
  - Ideas (`tokenId`) con mayor `verificationCount`.
- Uso:
  - Sección en `/explore` para descubrir ideas que otros artistas ya avalaron.

### 3.3. Ranking adicional – Emergentes de la semana

- Métrica:
  - Artistas con mayor crecimiento relativo en nuevas ideas registradas o verificaciones recibidas en los últimos 7 días.
- Visual:
  - Badge “🚀 Emergente” con fondo degradado diferente.

## 4. Servicios de frontend

- `frontend/src/services/blockchain-service.(ts|js)`:
  - `getSonetyoContract(providerOrSigner)`
  - `getCreatorTokenContract(address, providerOrSigner)`
  - `getProjectVaultContract(providerOrSigner)`
  - Funciones de alto nivel:
    - `registerIdea(file, metadata)` → hash + llamada a `mint`.
    - `verifyIdea(tokenId)` → `verify`.
    - `createVault(ideaIds, metadataURI)` → `createVault`.

- `frontend/src/services/api.(ts|js)` (nuevo):
  - Consumirá el backend:
    - `getArtistStats(address)`
    - `getArtistProjects(address)`
    - `createProject(payload)` → `POST /api/projects`
    - `getIdea(tokenId)`
    - `getVault(vaultId)`
    - (futuro) `getRankings()` (top creadores, top ideas, emergentes).

## 5. Gestión de estado

- `WalletContext` (ya existente) sigue siendo la fuente de verdad de:
  - `account`, `chainId`, `provider`, `signer`.
- Se ampliará para:
  - Guardar direcciones de:
    - `SONETYO_NFT_ADDRESS`
    - `CREATOR_TOKEN_ADDRESS` (por ahora demo)
    - `PROJECT_VAULT_ADDRESS`

## 6. Mensaje central para usuarios

El frontend debe reflejar explícitamente el objetivo principal del proyecto:

- En un mundo donde la **IA musical** hace posible que cada vez más personas experimenten y creen ideas sonoras, Sonetyo quiere ser la capa que:
  - Registra la **prueba de existencia y autoría** de esas ideas (aunque hayan sido generadas o asistidas por IA).
  - Ofrece herramientas de visibilidad y reputación (rankings, tierlist) para que los nuevos artistas emergentes puedan mostrar sus méritos y progresar en su carrera creativa.

