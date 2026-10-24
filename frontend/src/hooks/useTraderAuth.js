import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const AVATAR_OPTIONS = [
  { id: "cyber-blue", label: "Cyber Blue", bg: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)", icon: "⚡" },
  { id: "neon-emerald", label: "Neon Emerald", bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)", icon: "💎" },
  { id: "cosmic-violet", label: "Cosmic Violet", bg: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", icon: "🔮" },
  { id: "solar-amber", label: "Solar Amber", bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", icon: "🚀" },
  { id: "ruby-pulse", label: "Ruby Pulse", bg: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)", icon: "🔥" },
];

export { AVATAR_OPTIONS };

export function useTraderAuth(account, signer, chainId = 31337) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Load saved profile when account changes
  useEffect(() => {
    if (!account) {
      setIsAuthenticated(false);
      setProfile(null);
      return;
    }

    try {
      const stored = localStorage.getItem(`poolpilot_trader_${account.toLowerCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.account?.toLowerCase() === account.toLowerCase() && parsed.sessionActive) {
          setProfile(parsed);
          setIsAuthenticated(true);
          return;
        }
      }
    } catch {
      // ignore storage error
    }

    setIsAuthenticated(false);
    setProfile(null);
  }, [account]);

  // Sign-In with Ethereum (EIP-4361 standard)
  const signInWithEthereum = useCallback(
    async (handle = null, avatarId = "cyber-blue") => {
      if (!account || !signer) {
        setAuthError("Please connect your wallet before signing in.");
        return false;
      }

      setIsSigning(true);
      setAuthError(null);

      try {
        const defaultHandle = handle?.trim() || `@pilot_${account.slice(2, 6).toLowerCase()}`;
        const nonce = Math.random().toString(36).substring(2, 10).toUpperCase();
        const issuedAt = new Date().toISOString();

        // EIP-4361 SIWE challenge statement
        const siweMessage = [
          "PoolPilot AMM Protocol wants you to sign in with your Ethereum account:",
          account,
          "",
          "Sign in to PoolPilot to authenticate your decentralized trading session, enable custom slippage, and manage your liquidity positions.",
          "",
          `URI: http://localhost:3000`,
          "Version: 1",
          `Chain ID: ${chainId || 31337}`,
          `Nonce: ${nonce}`,
          `Issued At: ${issuedAt}`,
        ].join("\n");

        // Request user cryptographic signature in wallet
        const signature = await signer.signMessage(siweMessage);

        // Verify cryptographic validity
        const recoveredAddress = ethers.verifyMessage(siweMessage, signature);
        if (recoveredAddress.toLowerCase() !== account.toLowerCase()) {
          throw new Error("Cryptographic signature verification failed: Address mismatch.");
        }

        const profileData = {
          account: account.toLowerCase(),
          handle: defaultHandle,
          avatarId: avatarId || "cyber-blue",
          bio: "Decentralized Liquidity Explorer & AMM Trader",
          tier: "Pro Trader",
          slippagePreference: 0.5,
          signedAt: issuedAt,
          signatureSnippet: signature.substring(0, 18) + "...",
          sessionActive: true,
        };

        // Persist session locally
        localStorage.setItem(`poolpilot_trader_${account.toLowerCase()}`, JSON.stringify(profileData));
        setProfile(profileData);
        setIsAuthenticated(true);
        setIsSigning(false);
        return true;
      } catch (err) {
        console.warn("SIWE Authentication failed:", err);
        const msg = err.code === 4001 || err.code === "ACTION_REJECTED"
          ? "Signature was rejected in your wallet."
          : err.message || "Failed to authenticate session.";
        setAuthError(msg);
        setIsSigning(false);
        return false;
      }
    },
    [account, signer, chainId]
  );

  // Update profile attributes (handle, avatar, preferences)
  const updateProfile = useCallback(
    (updates) => {
      if (!account || !profile) return;
      const updated = { ...profile, ...updates };
      setProfile(updated);
      try {
        localStorage.setItem(`poolpilot_trader_${account.toLowerCase()}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    },
    [account, profile]
  );

  // Sign out of active trader session
  const signOut = useCallback(() => {
    if (account) {
      try {
        localStorage.removeItem(`poolpilot_trader_${account.toLowerCase()}`);
      } catch {
        // ignore
      }
    }
    setIsAuthenticated(false);
    setProfile(null);
  }, [account]);

  return {
    isAuthenticated,
    isSigning,
    authError,
    profile,
    signInWithEthereum,
    updateProfile,
    signOut,
  };
}
