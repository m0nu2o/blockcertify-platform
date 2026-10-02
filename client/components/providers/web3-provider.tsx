"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Web3ContextType {
  account: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  isConnecting: false,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const getSafeItem = (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const setSafeItem = (key: string, val: string) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, val);
    } catch {
      // ignore
    }
  };

  const removeSafeItem = (key: string) => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const checkConnection = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.request !== 'function') return;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setSafeItem('web3_account', accounts[0]);
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        setChainId(chainIdHex);
      }
    } catch (err) {
      console.warn('[Web3Provider] Check connection warning:', err);
    }
  };

  // Load saved connection state on mount
  useEffect(() => {
    try {
      const savedAccount = getSafeItem('web3_account');
      if (savedAccount && (window as any).ethereum) {
        void checkConnection();
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for wallet events
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.on !== 'function') return;

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setSafeItem('web3_account', accounts[0]);
          toast.success(`Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        } else {
          setAccount(null);
          setChainId(null);
          removeSafeItem('web3_account');
          toast.success('Wallet disconnected');
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        try {
          if (typeof ethereum.removeListener === 'function') {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
          } else if (typeof ethereum.off === 'function') {
            ethereum.off('accountsChanged', handleAccountsChanged);
            ethereum.off('chainChanged', handleChainChanged);
          }
        } catch {
          // ignore cleanup errors
        }
      };
    } catch {
      // ignore event listener errors
    }
  }, []);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || typeof ethereum.request !== 'function') {
      toast.error('MetaMask or another Web3 wallet extension was not found. Please install a wallet.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setSafeItem('web3_account', accounts[0]);
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        setChainId(chainIdHex);
        toast.success('Wallet successfully connected');
      }
    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error('Wallet connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
      console.warn('[Web3Provider] Connect wallet error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    removeSafeItem('web3_account');
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isConnected: !!account,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
