import { useState } from 'react';

/**
 * Ayuda colapsable (Heurística 8 - Diseño minimalista; Heurística 10 - Ayuda y documentación).
 * No ocupa espacio cuando el usuario ya sabe usar la app.
 */
export function HelpCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card help-card">
      <button
        type="button"
        className="help-card__toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="help-content"
      >
        <span className="help-card__title">📋 Cómo usar Sonetyo</span>
        <span className="help-card__chevron" aria-hidden>{open ? '▼' : '▶'}</span>
      </button>
      <div id="help-content" className="help-card__content" hidden={!open} role="region" aria-label="Instrucciones de uso">
        {open && (
          <>
            <ol className="help-card__list">
              <li>Conecta tu wallet (Pali Wallet).</li>
              <li>La app cambiará automáticamente a la red zkSYS PoB Devnet (57042).</li>
              <li>Sube un archivo de audio corto (beat, melodía, loop, tarareo).</li>
              <li>El sistema calculará el hash automáticamente.</li>
              <li>Haz clic en &quot;Registrar Idea&quot; para registrar tu idea on-chain.</li>
              <li>Para verificar ideas de otros, usa el Token ID que te dieron.</li>
            </ol>
            <p className="help-card__note">
              <strong>Nota:</strong> Este es un MVP. El audio se procesa en tu navegador (hash) y solo el hash se guarda on-chain. La metadata (IPFS) es opcional.
            </p>
            <p className="help-card__note">
              En la Devnet PoB, el gas (TSYS) se acredita a las wallets registradas en el programa. No hay faucet público; usa la misma wallet con la que te registraste.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
