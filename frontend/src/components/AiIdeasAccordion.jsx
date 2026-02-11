import { useState } from 'react';

/**
 * Acordeón opcional para enlazar herramientas de IA que generan música.
 * Cumple heurísticas de Nielsen:
 * - Es opcional, minimalista y con lenguaje claro.
 * - Previene errores explicando que Sonetyo sólo registra la huella del audio.
 */
export function AiIdeasAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card help-card">
      <button
        type="button"
        className="help-card__toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="ai-help-content"
      >
        <span className="help-card__title">🎛 Generar ideas con IA (opcional)</span>
        <span className="help-card__chevron" aria-hidden>
          {open ? '▼' : '▶'}
        </span>
      </button>

      <div
        id="ai-help-content"
        className="help-card__content"
        hidden={!open}
        role="region"
        aria-label="Herramientas externas de IA para generar audio"
      >
        {open && (
          <>
            <p className="help-card__note">
              <strong>¿No tienes todavía un audio?</strong> Puedes crearlo en tu DAW, grabarlo con tu
              celular o generar una idea con IA en estas plataformas, descargar el archivo y luego
              registrarlo en Sonetyo.
            </p>

            <ul className="help-card__list">
              <li>
                <span role="img" aria-hidden="true">🎤</span>{' '}
                <a href="https://www.suno.com" target="_blank" rel="noopener noreferrer">
                  Suno
                </a>{' '}
                — canciones completas con voz y letra.
              </li>
              <li>
                <span role="img" aria-hidden="true">🎚</span>{' '}
                <a href="https://www.udio.com" target="_blank" rel="noopener noreferrer">
                  Udio
                </a>{' '}
                — más control para productores.
              </li>
              <li>
                <span role="img" aria-hidden="true">🎼</span>{' '}
                <a href="https://www.aiva.ai" target="_blank" rel="noopener noreferrer">
                  AIVA
                </a>{' '}
                — ideal para música instrumental y cinemática.
              </li>
              <li>
                <span role="img" aria-hidden="true">🎧</span>{' '}
                <a href="https://soundraw.io" target="_blank" rel="noopener noreferrer">
                  Soundraw
                </a>{' '}
                — loops y fondos musicales para vídeo.
              </li>
              <li>
                <span role="img" aria-hidden="true">🎵</span>{' '}
                <a href="https://www.boomy.com" target="_blank" rel="noopener noreferrer">
                  Boomy
                </a>{' '}
                — pensado para principiantes que quieren crear tracks rápidos.
              </li>
            </ul>

            <p className="help-card__note">
              Después de generar tu idea, descarga el archivo (MP3, WAV u otro formato compatible) y
              súbelo en <strong>&quot;Registrar nueva idea&quot;</strong> para guardar su huella
              on-chain como Sonetyo Proof.
            </p>

            <p className="help-card__note">
              <strong>Importante:</strong> estas plataformas son externas a Sonetyo. Revisa siempre sus
              términos de uso y licencias antes de usar el audio generado en proyectos comerciales.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

