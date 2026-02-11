import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { EXPLORER_BASE_URL } from '../utils/config';
import { getFriendlyError, FAUCET_URL } from '../utils/errorMessages';

export function VerifyForm() {
  const { contract, isConnected } = useWallet();
  const [tokenId, setTokenId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!contract) {
      setError("Conecta la wallet primero.");
      return;
    }

    const trimmed = tokenId.trim();
    if (!trimmed) {
      setError("Escribe el Token ID de la idea que quieres verificar (ej: 0, 1, 2).");
      return;
    }

    const id = parseInt(trimmed, 10);
    if (Number.isNaN(id) || id < 0) {
      setError("Token ID debe ser un número entero mayor o igual a 0.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const tx = await contract.verify(id);
      setResult({
        type: 'pending',
        txHash: tx.hash,
        message: 'Transacción enviada, esperando confirmación en la red…'
      });

      const receipt = await tx.wait();
      const verifyEvent = receipt.logs
        .map(log => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find(log => log && log.name === 'SonetyoVerified');

      const newCount = verifyEvent ? verifyEvent.args.newVerificationCount.toString() : 'N/A';

      setResult({
        type: 'success',
        txHash: receipt.hash,
        tokenId: id,
        verificationCount: newCount,
        blockNumber: receipt.blockNumber,
        message: 'Idea verificada correctamente.'
      });

      setTokenId('');
    } catch (err) {
      console.error("Error en verify:", err);
      const { message, action } = getFriendlyError(err);
      setError(message);
      if (action === 'faucet') setResult({ type: 'help', link: FAUCET_URL, linkLabel: 'Obtener tSYS (faucet)' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setTokenId('');
    setError(null);
    setResult(null);
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h2>2. Verificar idea de otro artista</h2>
        <p className="muted">Conecta tu wallet para verificar ideas.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>2. Verificar idea de otro artista</h2>
      <p className="muted">Atestigua que conoces una idea ya registrada (necesitas el Token ID que te hayan pasado).</p>

      <form onSubmit={handleVerify} noValidate>
        <div className="form-group">
          <label htmlFor="tokenIdInput">Token ID de la idea</label>
          <input
            type="number"
            id="tokenIdInput"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Ej: 0, 1, 2…"
            min="0"
            step="1"
            disabled={isProcessing}
            aria-describedby="tokenId-hint"
          />
          <p id="tokenId-hint" className="form-hint">Número entero que identifica la idea (lo obtienes al registrarla o te lo comparte el autor).</p>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={!tokenId.trim() || isProcessing}
            className="btn-primary btn-large"
          >
            {isProcessing ? '⏳ Procesando…' : '⭐ Verificar idea'}
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
          {result.verificationCount != null && (
            <p>Nuevo conteo de verificaciones: <strong>{result.verificationCount}</strong></p>
          )}
          {result.txHash && (
            <a href={`${EXPLORER_BASE_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="explorer-link">
              Ver en Explorer →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
