# 0xSonata Frontend

Frontend React para 0xSonata — Sistema de registro de ideas musicales on-chain.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Build para producción

```bash
npm run build
```

Los archivos estáticos se generan en `dist/`.

## Características

- ✅ Conexión de wallet (Pali Wallet)
- ✅ Cambio automático a red Tanenbaum
- ✅ Upload de audio + cálculo de hash SHA-256
- ✅ Mint de ideas musicales
- ✅ Verificación de ideas de otros artistas
- ✅ Links al explorer de Tanenbaum
- ✅ Diseño responsive para móviles

## Configuración

El contrato desplegado está configurado en `src/utils/config.js`:

- **Contrato:** `0x136aC7D8D981f013524718B46AbB83d99c265f3f`
- **Red:** Syscoin Tanenbaum Testnet (Chain ID: 5700)
