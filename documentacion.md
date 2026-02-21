# 0xSonata — Creative Process Chain

## El problema real

En enero 2025, la U.S. Copyright Office establecio que la musica generada 100% por IA no tiene copyright. Cae en dominio publico. Cualquiera puede tomarla, usarla y reclamarla como suya sin consecuencias legales.

Pero la misma Copyright Office aclaro: si el humano demuestra **"control creativo suficiente"** sobre el resultado (seleccion, edicion, mezcla, produccion), la obra SI es elegible para proteccion.

El problema: no existe ninguna herramienta que ayude al creador a **documentar y probar ese control creativo**. Las plataformas de timestamp (SongProof, OpenTimestamps) solo registran el hash del audio final. No documentan el proceso. No sirven como evidencia de intervencion humana.

Mientras tanto:
- Suno tiene 12 millones de usuarios generando musica con IA.
- Deezer reporta que el 70% de streams de musica IA en H1 2025 eran fraudulentos.
- TuneCore ya rechaza distribuir musica 100% IA.
- Sound.xyz entro en "maintenance mode" en mayo 2025.
- Los artistas emergentes que usan IA no tienen forma de proteger su trabajo.

---

## La solucion: 0xSonata

0xSonata no es un notario digital. No es una plataforma de NFTs coleccionables. Es la **cadena de evidencia** que documenta el proceso creativo de un artista que usa IA, haciendo que su musica sea elegible para proteccion legal.

**Pitch**: "0xSonata documenta tu proceso creativo con IA para que tu musica sea elegible para copyright."

---

## Usuarios objetivo

### Persona 1: Valeria (Lima, 22 anos)

Valeria estudia comunicaciones y usa Suno para crear beats de reggaeton. No sabe tocar instrumentos pero tiene buen oido: genera 10 variaciones, elige la mejor, la edita en GarageBand y le agrega su voz. Publico 3 canciones en SoundCloud que juntas tienen 15,000 reproducciones. La semana pasada encontro su beat en un video de TikTok con 200K views. El creador del video nunca le pidio permiso. Valeria no puede hacer nada porque no tiene copyright ni prueba de que ella creo ese beat primero.

**Con 0xSonata**: Valeria registra cada paso de su proceso (prompt en Suno, las 10 variaciones, su seleccion, su edicion en GarageBand, el master final). Cada paso tiene un hash y un timestamp on-chain. Cuando encuentra su beat robado, descarga un certificado PDF con toda la cadena de evidencia y lo presenta como prueba de anterioridad y de intervencion humana.

### Persona 2: Diego (Bogota, 28 anos)

Diego es productor de trap y usa Udio para generar bases instrumentales que luego modifica en Ableton. Quiere registrar sus producciones en la Direccion Nacional de Derechos de Autor (DNDA) de Colombia, pero cada registro cuesta ~$30 USD y tarda semanas. El produce 4 beats por semana. Registrar todo le costaria $480 USD al mes, imposible para un artista emergente.

**Con 0xSonata**: Diego registra cada produccion por el costo del gas en zkSYS (~centavos). Tiene un historial publico e inmutable de toda su produccion. Cuando un sello le pide prueba de autoria para firmar un contrato, Diego muestra su perfil de 0xSonata con 200+ ideas registradas, verificaciones de otros productores, y certificados descargables. El sello verifica las transacciones directamente en el explorer.

### Persona 3: Camila y Andres (Buenos Aires, 25 y 30 anos)

Camila escribe letras y Andres genera instrumentales con IA. Colaboran remotamente. Publicaron un EP de 5 tracks pero nunca dejaron claro quien hizo que. Ahora Andres quiere usar 2 de esos tracks para un proyecto solista y Camila dice que no puede porque ella escribio las letras.

**Con 0xSonata**: Desde el inicio, cada uno registra su contribucion por separado. Luego crean un Project Vault que agrupa ambas contribuciones con splits definidos (Camila 40%, Andres 60%). El smart contract distribuye automaticamente cualquier pago futuro segun esos porcentajes. No hay ambiguedad.

---

## Arquitectura funcional

### Capa 1: Creative Process Chain (evolucion de SonataNFT)

El contrato `SonataNFT` se extiende para registrar no solo el audio final, sino la **cadena completa del proceso creativo**:

```
struct CreativeStep {
    bytes32 contentHash;    // hash SHA-256 del contenido de este paso
    uint8 stepType;         // 0=prompt, 1=variacion_ia, 2=seleccion, 3=edicion_daw, 4=master_final
    uint256 timestamp;      // cuando se registro este paso
    string metadata;        // descripcion breve (ej: "Edicion en Ableton: corte intro + EQ bass")
}

struct SonataProof {
    bytes32 audioHash;           // hash del audio final
    uint256 timestamp;           // timestamp del registro final
    address creator;             // direccion del creador
    uint256 verificationCount;   // verificaciones recibidas
    uint256 stepCount;           // cantidad de pasos del proceso creativo
}
```

Flujo de registro:

1. El artista genera musica con Suno/Udio.
2. En el frontend, selecciona el archivo del prompt (texto) y lo hashea -> `addStep(tokenId, hash, 0, "Prompt: reggaeton beat 120bpm")`
3. Sube las variaciones generadas -> `addStep(tokenId, hash, 1, "5 variaciones generadas en Suno v4")`
4. Sube el archivo que selecciono -> `addStep(tokenId, hash, 2, "Seleccion: variacion 3 de 5")`
5. Sube el archivo editado en su DAW -> `addStep(tokenId, hash, 3, "Edicion en GarageBand: corte intro + reverb")`
6. Registra el master final -> `mint(audioHash, uri)` que crea el SonataProof con todos los steps vinculados

Cada paso es un timestamp on-chain que demuestra intervencion humana progresiva. Esto es exactamente lo que la Copyright Office pide para considerar una obra IA-asistida como elegible para copyright.

**Que lo diferencia de SongProof**: SongProof hashea un archivo y ya. 0xSonata documenta el proceso completo. Es la diferencia entre una foto del resultado y un video de la creacion.

### Capa 2: Verificacion con Stake (evolucion del sistema de verify)

El sistema actual de verificaciones es gameable (creo 10 wallets y me verifico). La evolucion:

```
function verify(uint256 tokenId) external {
    require(stakeBalance[msg.sender] >= MIN_STAKE, "Stake insuficiente");
    // ... validaciones existentes ...
    proofs[tokenId].verificationCount++;
}
```

Mecanica:
- Para verificar, necesitas tener stake minimo depositado en el contrato.
- Si la comunidad reporta que verificaste algo fraudulento (audio robado, proceso falso), tu stake puede ser slashed.
- Tu reputacion sube con verificaciones exitosas.
- Artistas con mas reputacion tienen verificaciones con mas peso.

Esto crea un sistema de curacion real donde verificar tiene costo y responsabilidad, no es un click gratis.

### Capa 3: Reputacion y Tierlist (reemplaza a CreatorToken)

El CreatorToken ERC-20 original no tenia utilidad. Se reemplaza por un sistema de reputacion on-chain basado en metricas reales:

**Metricas que alimentan la reputacion:**
- Ideas registradas con proceso creativo documentado (no solo hash)
- Verificaciones recibidas de artistas con stake
- Verificaciones dadas que no fueron disputadas
- Antiguedad en la plataforma
- Diversidad de proceso (usa multiples pasos, no solo mint directo)

**Tiers:**
- Emergente: 0-5 ideas registradas
- Bronce: 6-20 ideas + al menos 3 verificaciones recibidas
- Plata: 21-50 ideas + 10 verificaciones + 6 meses de antiguedad
- Oro: 50+ ideas + 25 verificaciones + verificador activo + 1 ano

**Utilidad de los tiers:**
- Artistas Oro pueden verificar con peso 3x
- Artistas Plata pueden verificar con peso 2x
- Los tiers son visibles en el perfil publico (atractivo para sellos, managers, colaboradores)
- Los tiers no se compran, se ganan con actividad real

### Capa 4: Project Vault con Revenue Share (evolucion del ProjectVault)

El vault original solo agrupaba ideas. La evolucion agrega splits de revenue entre colaboradores:

```
struct Vault {
    uint256[] ideaTokenIds;
    address creator;
    address[] collaborators;
    uint256[] splits;           // porcentajes (ej: [60, 40] = 60% creador, 40% colaborador)
    string metadataURI;
}
```

Cuando el vault recibe pagos (ej: un sello paga por licenciar el proyecto), el smart contract distribuye automaticamente segun los splits definidos. No hay intermediarios.

### Certificado PDF (nuevo, no existia)

Cuando un artista completa un registro con proceso creativo documentado y recibe al menos 1 verificacion, puede generar un certificado PDF que incluye:

- Nombre del artista (wallet address + alias opcional)
- Hash del audio final
- Cadena completa de pasos creativos con hashes y timestamps
- Transaction hashes verificables en el explorer
- Lista de verificadores con sus addresses y timestamps
- QR code que enlaza a la verificacion on-chain

Este PDF es el documento que el artista presenta ante:
- La Copyright Office (USA) como evidencia de "sufficient human creative control"
- INDECOPI (Peru), DNDA (Colombia), INPI (Argentina) como prueba de anterioridad
- Un sello discografico como prueba de autoria
- Un tribunal en caso de disputa

---

## Cumplimiento de requisitos del programa zkSYS Proof-of-Builders

### Requisitos ya cumplidos (revisiones anteriores)

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| Nombre final del proyecto | Cumplido | 0xSonata |
| Documentacion tecnica | Cumplido | Este documento + specs originales |
| URL demo en produccion | Cumplido | https://0xsonata.site |
| Contrato en zkSYS PoB Devnet | Cumplido | `0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373` (Chain ID 57042) |
| Integracion con wallet | Cumplido | Pali Wallet + MetaMask, switch automatico a zkSYS |
| Codigo fuente en GitHub | Cumplido | https://github.com/BenjaminGhiggo/0xSonata |
| Cuenta de X para difusion | Cumplido | @0xSonata |
| Stack reconstruido | Cumplido | NestJS + Angular + Hardhat (TypeScript) |
| Deploy automatizado | Cumplido | install.sh con Docker Compose, proxy SSL, deteccion de puertos |
| Tests unitarios | Cumplido | 19 tests en SonataNFT |

### Como esta propuesta sobrepasa los requisitos originales

**1. De "prueba de existencia" a "cadena de evidencia"**

El requisito original era: "registrar ideas musicales como NFTs con hash + timestamp". Eso se cumplio con SonataNFT. La evolucion agrega el registro paso a paso del proceso creativo, convirtiendo un simple timestamp en una cadena de evidencia legal. Ninguna otra plataforma en el ecosistema zkSYS hace esto.

**2. De "verificaciones sociales" a "curacion con stake"**

El requisito original era: "verificaciones de otros artistas". Eso se cumplio con el sistema de verify. La evolucion agrega stake (piel en el juego), haciendo que las verificaciones tengan valor real y resistencia a Sybil. Esto convierte un contador inflable en un sistema de reputacion confiable.

**3. De 3 contratos separados a un ecosistema integrado**

Los requisitos originales pedian SonataNFT + CreatorToken + ProjectVault como piezas independientes. La evolucion los integra en un flujo unico con proposito claro: documentar → verificar → certificar → colaborar. El CreatorToken se reemplaza por reputacion on-chain (mas util, menos especulativo).

**4. Caso de uso real con mercado validado**

El hackathon pide innovacion en el ecosistema Syscoin/zkSYS. Esta propuesta aborda un problema con 12+ millones de usuarios afectados (usuarios de Suno) y un vacio legal documentado por la propia Copyright Office. No es un proyecto teorico; es una solucion a un dolor que crece cada mes.

---

## Por que un artista emergente elegiria 0xSonata

### Razon 1: No tiene alternativa accesible

Registrar musica en oficinas de copyright cuesta $30-130 USD por obra y tarda semanas/meses. Un artista que produce 4 beats por semana no puede pagar eso. 0xSonata cuesta centavos de gas y es instantaneo.

### Razon 2: Nadie mas documenta el proceso creativo con IA

SongProof solo hashea el resultado final. Las oficinas de copyright no ofrecen herramientas para documentar intervencion humana en obras IA-asistidas. 0xSonata es la unica plataforma que crea la cadena de evidencia que la Copyright Office exige para considerar la obra elegible.

### Razon 3: Reputacion visible que abre puertas

Un artista emergente con 200 ideas registradas, 50 verificaciones de otros productores, y tier Plata tiene un perfil publico verificable. Un sello discografico, un manager o un colaborador puede verificar esa trayectoria on-chain. Es un CV musical inmutable.

### Razon 4: Proteccion real cuando te roban

Sin 0xSonata: alguien usa tu beat en TikTok con 1M views. No tienes copyright. No tienes prueba de anterioridad. No puedes hacer nada.

Con 0xSonata: descargas el certificado PDF con timestamps, hashes, tx hashes y verificaciones. Presentas un reclamo con evidencia verificable en blockchain. Es la primera linea de defensa, no un reemplazo del copyright formal, sino el puente hacia el.

### Razon 5: Colaboracion sin ambiguedad

Con vault + revenue share, dos artistas que colaboran remotamente definen desde el inicio quien contribuyo que y en que porcentaje. Si el proyecto genera ingresos, el smart contract distribuye automaticamente. No hay peleas, no hay "yo hice mas que tu".

---

## Ejemplo de flujo completo: Valeria registra un beat

```
1. Valeria abre Suno y escribe: "reggaeton beat, 120bpm, dark vibes, minor key"
   -> Copia el prompt en 0xSonata
   -> Frontend hashea el texto: 0xa3f2...
   -> Se registra on-chain: Step 0 (prompt), timestamp: 2026-02-20 14:30:00 UTC

2. Suno genera 5 variaciones. Valeria las descarga todas.
   -> Sube los 5 archivos en 0xSonata
   -> Frontend hashea cada uno
   -> Se registra on-chain: Step 1 (variaciones_ia), hashes: [0xb1..., 0xb2..., 0xb3..., 0xb4..., 0xb5...]

3. Valeria elige la variacion 3. La marca como seleccionada.
   -> Se registra on-chain: Step 2 (seleccion), hash: 0xb3..., metadata: "Variacion 3 de 5"

4. Abre GarageBand, corta la intro, agrega reverb, sube los graves.
   -> Exporta el archivo editado y lo sube a 0xSonata
   -> Se registra on-chain: Step 3 (edicion_daw), hash: 0xc7..., metadata: "GarageBand: corte intro + reverb + EQ bass"

5. Exporta el master final.
   -> Sube a 0xSonata -> mint(0xd9..., "ipfs://Qm...")
   -> Se crea el SonataProof NFT con 4 steps documentados
   -> Token ID: 42

6. Diego (productor de Bogota, tier Bronce) escucha el beat en 0xSonata.
   -> Le gusta, lo verifica: verify(42)
   -> El beat ahora tiene 1 verificacion de un artista con stake

7. Valeria descarga el certificado PDF:
   -> Artista: 0x7a2F... (Valeria)
   -> Audio final: 0xd9...
   -> Proceso: 4 pasos documentados con timestamps y hashes
   -> Verificado por: 0x3bE1... (Diego, tier Bronce)
   -> Todas las tx verificables en explorer-pob.dev11.top
```

---

## Tecnologias

| Componente | Tecnologia | Justificacion |
|------------|-----------|---------------|
| Smart contracts | Solidity 0.8.24 + Hardhat 2.x | Ecosistema maduro, compatible con zkSYS |
| Backend | NestJS 11 (TypeScript) | Framework robusto con DI, validacion, y modularidad |
| Frontend | Angular 21 (TypeScript) | Signals, standalone components, SCSS |
| Blockchain | zkSYS PoB Devnet (Chain ID 57042) | Red del hackathon, gas bajo |
| Base de datos | PostgreSQL 16 | Indexacion de eventos, rankings, cache |
| Deploy | Docker Compose + nginx proxy + SSL | Produccion-ready, automatizado |
| Wallet | Pali Wallet + MetaMask | Wallets del ecosistema Syscoin |

---

## Roadmap

### Fase 1 (actual — completada)
- SonataNFT desplegado con mint + verify
- Frontend Angular con registro de idea y verificacion
- Backend NestJS con API de consulta
- Deploy automatizado con install.sh

### Fase 2 (proxima)
- Registro de pasos del proceso creativo (Creative Process Chain)
- Generacion de certificado PDF
- IPFS para almacenamiento de audio (Pinata/web3.storage)
- Mejora de UI: reproductor de audio, visualizacion de proceso

### Fase 3
- Verificacion con stake (anti-Sybil)
- Sistema de reputacion y tiers on-chain
- Rankings: top creadores, top ideas verificadas, emergentes de la semana
- Dashboard de artista con metricas

### Fase 4
- Project Vault con revenue share
- Splits automaticos entre colaboradores
- Integracion con plataformas de distribucion (estudiar API de DistroKid, TuneCore)
- App movil (PWA o nativa)

---

## Competencia y diferenciacion

| Plataforma | Que hace | Limitacion | Ventaja de 0xSonata |
|------------|----------|------------|---------------------|
| SongProof | Timestamp de audio en Bitcoin/Polygon | Solo hashea resultado final, sin proceso | Documenta cadena completa del proceso creativo |
| OpenTimestamps | Timestamp generico en Bitcoin | No es especifico para musica, sin UI | UI especializada para musica + comunidad |
| Sound.xyz | NFTs de musica coleccionable | Entro en maintenance mode (mayo 2025) | No depende de especulacion NFT |
| Audius | Streaming descentralizado | No ofrece prueba de autoria ni timestamp | Enfocado en prueba, no en streaming |
| Copyright Office | Registro oficial | $65-130 USD, 30-120 dias, no acepta IA pura | Instantaneo, centavos, documenta intervencion humana |
| INDECOPI (Peru) | Registro oficial | S/ 195, 30-120 dias | Instantaneo, centavos |
