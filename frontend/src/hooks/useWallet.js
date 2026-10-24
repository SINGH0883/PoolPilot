import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { SUPPORTED_NETWORKS } from "../lib/ethereum";

const getInjectedProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) return null;
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers.find((p) => p.isMetaMask) || window.ethereum.providers[0];
  }
  return window.ethereum;
};

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Initialize read-only provider or restore connection
  useEffect(() => {
    async function initProvider() {
      const isUserDisconnected = localStorage.getItem("poolpilot_user_disconnected") === "true";
      const savedType = localStorage.getItem("poolpilot_wallet_type");
      const eth = getInjectedProvider();

      // 1. If previously connected via local test wallet and not explicitly disconnected
      if (!isUserDisconnected && savedType === "local") {
        try {
          const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
          const localWallet = new ethers.Wallet(
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            localProvider
          );
          setProvider(localProvider);
          setAccount(localWallet.address);
          setSigner(localWallet);
          setChainId(31337);
          return;
        } catch {
          // ignore fallback
        }
      }

      // 2. If MetaMask or injected wallet is available
      if (eth) {
        const browserProvider = new ethers.BrowserProvider(eth);
        setProvider(browserProvider);

        try {
          const network = await browserProvider.getNetwork();
          setChainId(Number(network.chainId));

          // Check if already authorized only if user did not explicitly disconnect
          if (!isUserDisconnected && savedType === "metamask") {
            const accounts = await browserProvider.listAccounts();
            if (accounts.length > 0) {
              const accAddress = typeof accounts[0] === "string" ? accounts[0] : accounts[0].address;
              setAccount(accAddress);
              setSigner(await browserProvider.getSigner(accAddress));
            }
          }
        } catch (err) {
          console.warn("Failed to read initial network state:", err);
        }

        // Listen for wallet events
        const handleAccountsChanged = async (accounts) => {
          if (!accounts || accounts.length === 0 || localStorage.getItem("poolpilot_user_disconnected") === "true") {
            setAccount(null);
            setSigner(null);
            localStorage.removeItem("poolpilot_wallet_type");
          } else {
            setAccount(accounts[0]);
            try {
              const s = await browserProvider.getSigner(accounts[0]);
              setSigner(s);
            } catch {
              // ignore
            }
          }
        };

        const handleChainChanged = (newChainId) => {
          setChainId(Number(BigInt(newChainId)));
          window.location.reload();
        };

        if (eth.on) {
          eth.on("accountsChanged", handleAccountsChanged);
          eth.on("chainChanged", handleChainChanged);
        }

        return () => {
          if (eth.removeListener) {
            eth.removeListener("accountsChanged", handleAccountsChanged);
            eth.removeListener("chainChanged", handleChainChanged);
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
          // Local node not running, that's okay
        }
      }
    }

    initProvider();
  }, []);

  // Connect via MetaMask / Injected Browser Extension
  const connectMetaMask = useCallback(async () => {
    const eth = getInjectedProvider();
    if (!eth) {
      setError("No Web3 wallet extension detected. Please install MetaMask from metamask.io or use the Local Dev Wallet.");
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found in your wallet.");
      }

      const browserProvider = new ethers.BrowserProvider(eth);
      setProvider(browserProvider);
      setAccount(accounts[0]);

      const s = await browserProvider.getSigner(accounts[0]);
      setSigner(s);

      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));

      localStorage.removeItem("poolpilot_user_disconnected");
      localStorage.setItem("poolpilot_wallet_type", "metamask");
      setIsWalletModalOpen(false);
      return true;
    } catch (err) {
      console.error("MetaMask connect error:", err);
      if (err.code === 4001) {
        setError("Connection request rejected in wallet.");
      } else if (err.code === -32002) {
        setError("Connection request is already pending in MetaMask. Please open your extension popup in the browser toolbar.");
      } else {
        setError(err.message || "Failed to connect to MetaMask.");
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect via Local Anvil Dev Wallet (instant 1-click test wallet)
  const connectLocalDevWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const localWallet = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        localProvider
      );
      setProvider(localProvider);
      setAccount(localWallet.address);
      setSigner(localWallet);
      setChainId(31337);
      localStorage.removeItem("poolpilot_user_disconnected");
      localStorage.setItem("poolpilot_wallet_type", "local");
      setIsWalletModalOpen(false);
      return true;
    } catch (err) {
      console.error("Local dev wallet connection error:", err);
      setError("Failed to connect to Local Anvil node at http://127.0.0.1:8545. Please check if your Anvil node is active.");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // General connect action: opens the modal so user can choose or connects directly if already chosen
  const connectWallet = useCallback(() => {
    setIsWalletModalOpen(true);
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    localStorage.removeItem("poolpilot_wallet_type");
    localStorage.setItem("poolpilot_user_disconnected", "true");
  }, []);

  // Switch network helper
  const switchNetwork = useCallback(async (targetChainId = 31337) => {
    const eth = getInjectedProvider();
    if (!eth) return;
    const hexChainId = "0x" + targetChainId.toString(16);
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: "Localhost 8545 (Anvil)",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        setError(err.message || "Failed to switch network in wallet.");
      }
    }
  }, []);

  const isNetworkSupported = chainId ? !!SUPPORTED_NETWORKS[chainId] : false;

  return {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error,
    clearError: () => setError(null),
    isNetworkSupported,
    connectWallet,
    connectMetaMask,
    connectLocalDevWallet,
    disconnectWallet,
    switchNetwork,
    isWalletModalOpen,
    setIsWalletModalOpen,
  };
}
