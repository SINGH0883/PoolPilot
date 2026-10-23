import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { SUPPORTED_NETWORKS } from "../lib/ethereum";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize read-only provider (fallback to window.ethereum or local hardhat node)
  useEffect(() => {
    async function initProvider() {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        try {
          const network = await browserProvider.getNetwork();
          setChainId(Number(network.chainId));

          // Check if already connected
          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setSigner(await browserProvider.getSigner());
          }
        } catch (err) {
          console.warn("Failed to read initial network state:", err);
        }

        // Listen for wallet events
        const handleAccountsChanged = async (accounts) => {
          if (accounts.length === 0) {
            setAccount(null);
            setSigner(null);
          } else {
            setAccount(accounts[0]);
            const s = await browserProvider.getSigner();
            setSigner(s);
          }
        };

        const handleChainChanged = (newChainId) => {
          setChainId(Number(BigInt(newChainId)));
          window.location.reload();
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
          if (window.ethereum.removeListener) {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
          }
        };
      } else {
        // Fallback to local RPC for read-only view
        try {
          const jsonRpcProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
          setProvider(jsonRpcProvider);
          const network = await jsonRpcProvider.getNetwork();
          setChainId(Number(network.chainId));
        } catch {
          // Local node not running
        }
      }
    }

    initProvider();
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("No Web3 wallet detected. Please install MetaMask or another EVM wallet.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const s = await browserProvider.getSigner();
        setSigner(s);
        const network = await browserProvider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (err) {
      if (err.code === 4001) {
        setError("Connection request was rejected in wallet.");
      } else {
        setError(err.message || "Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
  }, []);

  const isNetworkSupported = chainId ? !!SUPPORTED_NETWORKS[chainId] : false;

  return {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error,
    isNetworkSupported,
    connectWallet,
    disconnectWallet,
  };
}
