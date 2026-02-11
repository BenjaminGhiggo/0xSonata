import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { calculateFileHash } from '../utils/hash';
import { EXPLORER_BASE_URL } from '../utils/config';
import { getFriendlyError, FAUCET_URL } from '../utils/errorMessages';

const MAX_FILE_MB = 10;
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-wav', 'audio/*'];

export function MintForm() {
  const { contract, isConnected } = useWallet();
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState('');
  const [uri, setUri] = useState('');
  const [step, setStep] = useState(null); // 'hash' | 'tx' | 'confirm' | null
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const isProcessing = step !== null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setResult(null);

    // Prevención de errores (Heurística 5): validar tipo y tamaño
    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      setError(`El archivo es muy grande (${sizeMB.toFixed(1)} MB). Usa un audio de hasta ${MAX_FILE_MB} MB.`);
      setFile(null);
      setHash('');
      return;
    }
    const type = selectedFile.type?.toLowerCase() || '';
    const isAudio = ACCEPTED_TYPES.some(t => t === 'audio/*' || type.startsWith('audio/'));
    if (!isAudio) {
      setError('Por favor elige un archivo de audio (MP3, WAV, OGG, etc.).');
      setFile(null);
      setHash('');
      return;
    }

    setFile(selectedFile);
    setHash('');

    try {
      setStep('hash'); // Visibilidad del estado (Heurística 1)
      const calculatedHash = await calculateFileHash(selectedFile);
      setHash(calculatedHash);
    } catch (err) {
      console.error("Error calculando hash:", err);
      setError("No se pudo procesar el archivo. Prueba con otro formato de audio.");
    } finally {
      setStep(null);
    }
  };

  const handleMint = async (e) => {
    e?.preventDefault();
    if (!contract || !hash) {
      setError("Conecta la wallet y selecciona un archivo de audio primero.");
      return;
    }

    setError(null);
    setResult(null);

    try {
      // Comprobar si este audio ya está registrado (evita revert y "missing revert data")
      const alreadyRegistered = await contract.isHashRegistered(hash);
      if (alreadyRegistered) {
        setError("Este audio ya fue registrado on-chain. Elige otro archivo o otra idea.");
        return;
      }
    } catch (err) {
      console.error("Error al comprobar hash:", err);
      setError("No se pudo comprobar el estado del audio. Intenta de nuevo.");
      return;
    }

    setStep('tx');

    try {
      const tokenURI = uri.trim() || `ipfs://demo/sonetyo/${Date.now()}`;
      const tx = await contract.mint(hash, tokenURI);
      setResult({
        type: 'pending',
        txHash: tx.hash,
        message: 'Transacción enviada, esperando confirmación en la red…'
      });
      setStep('confirm');

      const receipt = await tx.wait();
      const mintEvent = receipt.logs
        .map(log => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find(log => log && log.name === 'SonetyoMinted');

      const tokenId = mintEvent ? mintEvent.args.tokenId.toString() : 'N/A';

      setResult({
        type: 'success',
        txHash: receipt.hash,
        tokenId,
        blockNumber: receipt.blockNumber,
        message: 'Idea registrada correctamente.'
      });

      setFile(null);
      setHash('');
      setUri('');
      const input = document.getElementById('audioFile');
      if (input) input.value = '';
    } catch (err) {
      console.error("Error en mint:", err);
      const { message, action } = getFriendlyError(err);
      setError(message);
      if (action === 'faucet') setResult({ type: 'help', link: FAUCET_URL, linkLabel: 'Ir al faucet' });
    } finally {
      setStep(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setHash('');
    setUri('');
    setError(null);
    setResult(null);
    const input = document.getElementById('audioFile');
    if (input) input.value = '';
  };

  const statusMessage = step === 'hash' ? 'Calculando huella del audio…' : step === 'tx' ? 'Firmando en tu wallet…' : step === 'confirm' ? 'Confirmando en la blockchain…' : null;

  if (!isConnected) {
    return (
      <div className="card">
        <h2>1. Registrar nueva idea</h2>
        <p className="muted">Conecta tu wallet para poder registrar ideas.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>1. Registrar nueva idea</h2>
      <p className="muted">Sube un audio corto (beat, melodía, loop, tarareo) y regístralo on-chain.</p>

      <form onSubmit={handleMint} noValidate>
        <div className="form-group">
          <label htmlFor="audioFile">Archivo de audio</label>
          <input
            type="file"
            id="audioFile"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            aria-describedby="audioFile-hint"
          />
          <p id="audioFile-hint" className="form-hint">Máx. {MAX_FILE_MB} MB. Formatos: MP3, WAV, OGG.</p>
          {file && (
            <p className="file-info">
              📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {hash && (
          <div className="form-group">
            <label>Huella del audio (calculada automáticamente)</label>
            <input type="text" value={hash} readOnly className="hash-input" aria-readonly />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="uriInput">Token URI <span className="optional">(opcional)</span></label>
          <input
            type="text"
            id="uriInput"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="ipfs://… o déjalo vacío para demo"
            disabled={isProcessing}
          />
        </div>

        {statusMessage && (
          <p className="status-message" role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={!hash || isProcessing}
            className="btn-primary btn-large"
          >
            {isProcessing ? '⏳ ' + (statusMessage || 'Procesando…') : '🎵 Registrar idea'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isProcessing}
            className="btn-secondary"
          >
            Limpiar
          </button>
        </div>
      </form>

      {error && (
        <div className="alert error" role="alert">
          {error}
          {result?.type === 'help' && result.link && (
            <p>
              <a href={result.link} target="_blank" rel="noopener noreferrer" className="explorer-link">
                {result.linkLabel || 'Más información'}
              </a>
            </p>
          )}
        </div>
      )}

      {result && result.type !== 'help' && (
        <div className={`alert ${result.type === 'success' ? 'success' : 'info'}`}>
          <p>{result.message}</p>
          {result.txHash && (
            <a href={`${EXPLORER_BASE_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="explorer-link">
              Ver en Explorer →
            </a>
          )}
          {result.tokenId && result.tokenId !== 'N/A' && (
            <p className="token-id">Token ID: <strong>{result.tokenId}</strong> (guárdalo para verificar después)</p>
          )}
        </div>
      )}
    </div>
  );
}
