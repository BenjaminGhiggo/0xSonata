import { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, DEVNET_CONFIG } from '../utils/config';

export const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const hasWallet = typeof window !== 'undefined' && window.ethereum;

  const ensureDevnetNetwork = useCallback(async () => {
    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId"
      });

      if (currentChainId !== DEVNET_CONFIG.chainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: DEVNET_CONFIG.chainId }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [DEVNET_CONFIG]
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (err) {
      console.error("Error al cambiar de red:", err);
      throw new Error("No se pudo cambiar a la red zkSYS PoB Devnet");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    if (!hasWallet) {
      setError("Necesitas Pali Wallet instalada");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      const accountAddress = accounts[0];
      setAccount(accountAddress);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      const browserSigner = await browserProvider.getSigner();
      setSigner(browserSigner);

      await ensureDevnetNetwork();

      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));

      const contractInstance = CONTRACT_ADDRESS
        ? new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, browserSigner)
        : null;
      setContract(contractInstance);

    } catch (err) {
      console.error("Error al conectar wallet:", err);
      setError(err.message || "Error al conectar wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [hasWallet, ensureDevnetNetwork]);

  useEffect(() => {
    if (!hasWallet) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [hasWallet, disconnect]);

  const value = {
    account,
    chainId,
    provider,
    signer,
    contract,
    isConnecting,
    error,
    hasWallet,
    connect,
    disconnect,
    isConnected: !!account && !!contract
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
