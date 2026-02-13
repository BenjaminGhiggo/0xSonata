# Especificación de Tests – Sonetyo

## 1. Tests de contratos (unitarios)

- **SonetyoNFT**
  - Debe mintear correctamente con hash válido y no registrado.
  - Debe rechazar hashes duplicados.
  - No permite verificar propia idea.
  - No permite verificar dos veces la misma idea desde la misma address.

- **CreatorToken**
  - Constructor configura `artist` correctamente.
  - El artista recibe `initialSupply`.
  - Solo el artista puede llamar a `mintToSupporter`.

- **ProjectVault**
  - Rechaza listas vacías de ideas.
  - Rechaza ideas inexistentes.
  - Rechaza creación de vault si el msg.sender no es creador ni dueño de las ideas.
  - Crea vault correctamente y almacena `ideaTokenIds`.

## 2. Tests de integración / e2e (futuros)

- Flujo completo:
  1. Artista registra 2 ideas.
  2. Otro usuario verifica una de ellas.
  3. Artista despliega un CreatorToken y distribuye algunos tokens a un seguidor.
  4. Artista crea un ProjectVault agrupando las 2 ideas.
  5. Frontend muestra el vault y las ideas asociadas correctamente.

- Rankings y tierlist:
  - Verificar que el backend calcula correctamente el ranking **Top creadores** a partir de datos simulados de `creatorMintCount` y verificaciones.
  - Verificar que el endpoint de proyectos devuelve proyectos coherentes para un artista (`GET /artists/:address/projects`).
  - Verificar que el frontend:
    - Muestra al primer lugar con estilo “oro en llamas”.
    - Muestra al segundo con “plata reluciente”.
    - Muestra al tercero con “bronce brillante”.
  - Verificar que el ranking de **ideas más verificadas** muestra correctamente las ideas por orden descendente de `verificationCount`.
  - Verificar que el módulo de “Emergentes de la semana” incluye artistas cuyo crecimiento en número de ideas/verificaciones en la última semana supera un umbral definido.

