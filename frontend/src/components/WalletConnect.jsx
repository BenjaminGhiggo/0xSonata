import { useWallet } from '../hooks/useWallet';

/**
 * Estado visible del sistema (Heurística 1): siempre deja claro si está conectando,
 * conectado, en la red correcta o no.
 */
export function WalletConnect() {
  const { account, chainId, isConnecting, error, hasWallet, connect, disconnect, isConnected } = useWallet();

  if (!hasWallet) {
    return (
      <div className="wallet-card wallet-card--error" role="alert">
        <p>Necesitas tener instalada Pali Wallet para usar 0xSonata.</p>
        <a href="https://paliwallet.com/" target="_blank" rel="noopener noreferrer">
          Instalar Pali Wallet
        </a>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="wallet-card">
        <p className="wallet-card__status">Estado: no conectado</p>
        <button onClick={connect} disabled={isConnecting} className="btn-primary" aria-busy={isConnecting}>
          {isConnecting ? 'Conectando…' : 'Conectar wallet'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }

  const onCorrectNetwork = chainId === 57042;

  return (
    <div className={`wallet-card wallet-card--connected ${!onCorrectNetwork ? 'wallet-card--wrong-network' : ''}`}>
      <div className="wallet-info">
        <p className="wallet-card__status" aria-live="polite">
          Estado: conectado {onCorrectNetwork ? '· Red correcta (zkSYS PoB Devnet)' : ''}
        </p>
        <div>
          <strong>Cuenta:</strong>{' '}
          <span className="address">{account?.slice(0, 6)}…{account?.slice(-4)}</span>
        </div>
        <div>
          <strong>Red:</strong>{' '}
          <span className="network">
            {onCorrectNetwork ? 'zkSYS PoB Devnet (57042)' : `Otra red (ID: ${chainId}). Cambia a zkSYS PoB Devnet.`}
          </span>
        </div>
      </div>
      <button type="button" onClick={disconnect} className="btn-secondary" aria-label="Desconectar wallet">
        Desconectar
      </button>
    </div>
  );
}
