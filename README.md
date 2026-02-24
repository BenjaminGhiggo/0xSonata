# 0xSonata

## Prueba de Autoría Humana para Música con IA

**0xSonata** ayuda a artistas que usan IA musical (Suno, Udio) a documentar su proceso creativo en blockchain para cumplir con los requisitos del **Copyright Office de EE.UU.** y proteger su derecho a monetizar.

---

## 🎯 Problema que Resolvemos

### Contexto Legal (Enero 2025)

El **Copyright Office de EE.UU.** estableció que:
- ❌ Música **100% generada por IA** NO puede copyrightearse
- ✅ Música creada por **humanos con asistencia de IA** SÍ puede protegerse
- ⚠️ Se requiere demostrar **"autoría humana significativa"**

### El Dolor de Nuestros Usuarios

```
┌─────────────────────────────────────────────────────────────┐
│  "Generé 50 canciones en Suno, no puedo copyrightear ninguna" │
│                                                               │
│  - Usuario paga $30/mes en Suno Pro                           │
│  - Sube canciones a Spotify/YouTube                           │
│  - Lee que "música 100% IA no tiene copyright"                │
│  - Teme que alguien registre SUS canciones                    │
│  - No puede pagar $45 por registro en Copyright Office        │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Solución

0xSonata registra cada paso del proceso creativo con IA:

1. **🤖 Prompt en Suno/Udio** - El prompt exacto que usaste
2. **✍️ Variaciones IA** - Las opciones que la IA generó
3. **⛓️ Tu Selección** - Por qué elegiste esa variación (decisión humana)
4. **📜 Edición DAW** - Tu aporte humano en Ableton/FL Studio
5. **💾 Master Final** - El resultado final

Cada paso genera un **hash SHA-256 con timestamp** en blockchain, creando una **cadena de evidencia inmutable** de tu autoría humana.

---

## 🚀 Características

| Característica | Descripción |
|---|---|
| **🤖 Proceso Creativo con IA** | Registra prompts, variaciones, selecciones y ediciones humanas |
| **🔐 Evidencia Inmutable** | Hash SHA-256 + timestamp en blockchain (zkSYS PoB Devnet) |
| **🏆 Reputación Verificada** | Sistema de tiers: Emergente → Bronce → Plata → Oro |
| **🤝 Colaboraciones Claras** | Project Vault con splits automáticos (ej: 50%-50%) |
| **📜 Certificados PDF** | Evidencia descargable para Copyright Office/Spotify |

---

## 🛠️ Stack Tecnológico

```
┌─────────────────┐
│   Frontend      │  Angular 21 + ethers.js v6
│   (dApp)        │  Conecta Pali Wallet, registra proceso
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│   Backend       │  NestJS + PostgreSQL + TypeORM
│   (API)         │  Leaderboard, certificados, indexador
└────────┬────────┘
         │ RPC
┌────────▼────────┐
│   Contracts     │  Solidity 0.8.24 + OpenZeppelin
│   (Blockchain)  │  ERC-721 en zkSYS PoB Devnet
└─────────────────┘
```

### Redes Desplegadas

| Red | Chain ID | Propósito |
|---|---|---|
| **zkSYS PoB Devnet** | 57042 | Desarrollo y testing |
| **Syscoin Mainnet** | 57 | Producción (futuro) |

### Contrato Desplegado

```
Dirección: 0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373
Red: zkSYS PoB Devnet (Chain ID 57042)
Explorer: https://explorer-pob.dev11.top/address/0x01c9A88bFe2a2B3729c3d97279Ca88F7cC3Ef373
```

---

## 🏁 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Docker + Docker Compose
- Pali Wallet (extensión de navegador)

### 1. Clonar y Configurar

```bash
cd 0xsonata_net

# Backend: Copiar .env.example
cp backend/.env.example backend/.env
# Editar con tus variables (RPC_URL, SONATA_NFT_ADDRESS, etc.)

# Frontend: Copiar .env.example
cp frontend/.env.example frontend/.env
```

### 2. Levantar con Docker

```bash
# Construir y levantar todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Acceder a:
# - Frontend: http://0xsonata.net (o http://localhost si no tienes dominio)
# - Backend API: http://localhost:3000/api
# - pgAdmin: http://localhost:5050
```

### 3. Probar Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Leaderboard (datos seed)
curl http://localhost:3000/api/leaderboard

# Stats de artista
curl http://localhost:3000/api/artists/0x.../stats
```

---

## 👥 Público Objetivo

### Usuario Ideal

```
┌─────────────────────────────────────────────────────────────┐
│  - Usa Suno o Udio (pago, $10-30/mes)                       │
│  - Generó 10+ canciones en los últimos 3 meses              │
│  - Quiere subir a Spotify/YouTube y monetizar               │
│  - Leyó sobre Copyright Office ruling 2025                  │
│  - Tiene MIEDO de que le roben o no pueda monetizar         │
│  - Activo en Discord/Reddit de Suno/Udio                    │
│  - Edad: 18-35, productor emergente                         │
│  - Ingreso: $500-3000/mes de música                         │
└─────────────────────────────────────────────────────────────┘
```

### Dónde Encontrarlos

- **Reddit**: r/SunoAI (150k+), r/UdioAI (80k+)
- **Discord**: Suno Oficial (300k+), Udio Oficial (250k+)
- **Facebook**: "Suno AI Music" (200k+)

---

## 📊 Métricas de Uso

### Transacciones por Usuario

| Acción | TX | Costo Gas (aprox) |
|---|---|---|
| `mint()` - Registrar idea | 1 | ~$0.0001 USD |
| `addStep()` - Documentar paso | 1-5 | ~$0.0001 USD c/u |
| `verify()` - Verificar otro | 1 | ~$0.0001 USD |
| **Total por usuario activo** | **3-7** | **~$0.001 USD** |

### Stake Requerido

- **Mínimo para verificar**: 0.001 tSYS
- **Sugerido para múltiples verificaciones**: 0.002 tSYS
- **Stake NO se gasta**, se puede retirar con `withdraw()`

---

## 🧪 Desarrollo

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

### Frontend (Angular)

```bash
cd frontend
npm install
npm start  # http://localhost:4200
```

### Contratos (Hardhat)

```bash
cd contracts
npm install
npm run compile
npm run deploy:devnet  # Despliega a zkSYS PoB Devnet
```

### Tests

```bash
# Backend
cd backend && npm run test

# Contratos
cd contracts && npx hardhat test
```

---

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE)

---

## 🔗 Enlaces

- **Sitio Web**: https://0xsonata.net
- **Explorer**: https://explorer-pob.dev11.top
- **Faucet**: https://faucet-pob.dev11.top (tSYS gratis)
- **Pali Wallet**: https://palicrypto.com/
- **Syscoin**: https://syscoin.org/

---

## 🙋 FAQ

### ¿0xSonata copyrightea mi música?

**No.** 0xSonata proporciona **evidencia de tu proceso creativo** que puedes presentar al Copyright Office o plataformas como Spotify. El registro oficial de copyright requiere un trámite separado.

### ¿Necesito abogado para usar 0xSonata?

**No.** La plataforma está diseñada para ser usada sin asistencia legal. Sin embargo, para registros formales en Copyright Office, recomendamos consultar con un abogado especializado.

### ¿Qué pasa si Suno/Udio cierran?

Tu evidencia en blockchain **permanece para siempre**. Los hashes registrados son independientes de las plataformas de IA.

### ¿Puedo usar 0xSonata para música 100% humana?

**Sí.** Aunque el foco es música con IA, puedes registrar cualquier proceso creativo musical.

---

## 🎯 Roadmap

### Q1 2026 (Completado ✅)
- [x] Contrato SonataNFT (mint, verify, addStep)
- [x] Backend NestJS + PostgreSQL
- [x] Frontend Angular + Pali Wallet
- [x] Leaderboard con gamificación
- [x] Certificados PDF (en desarrollo)

### Q2 2026 (Planificado)
- [ ] Integración con Discord de Suno/Udio
- [ ] Plugin para Ableton/FL Studio
- [ ] Certificados PDF descargables
- [ ] Project Vault para colaboraciones

### Q3 2026 (Futuro)
- [ ] Despliegue en Syscoin Mainnet
- [ ] Integración con DistroKid/TuneCore
- [ ] API pública para terceros

---

## 🤝 Contribuciones

¡Bienvenidas! Por favor:

1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Hecho con ❤️ para el Hackathon Syscoin Proof-of-Builders 2026**
