/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const checkConnection = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('web3_account', accounts[0]);
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        setChainId(chainIdHex);
      }
    } catch (err) {
      console.error('[Web3Provider] Error checking connection:', err);
    }
  };

  // Load saved connection state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedAccount = localStorage.getItem('web3_account');
    if (savedAccount && (window as any).ethereum) {
      checkConnection();
    }
  }, []);

  // Listen for wallet events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('web3_account', accounts[0]);
        toast.success(`Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      } else {
        setAccount(null);
        setChainId(null);
        localStorage.removeItem('web3_account');
        toast.success('Wallet disconnected');
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      toast.error('MetaMask or another Web3 wallet extension was not found. Please install a wallet.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('web3_account', accounts[0]);
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        setChainId(chainIdHex);
        toast.success('Wallet successfully connected');
      }
    } catch (err: any) {
      if (err.code === 4001) {
        toast.error('Wallet connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
      console.error('[Web3Provider] Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    localStorage.removeItem('web3_account');
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
