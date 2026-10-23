# PoolPilot Threat Model & Security Analysis

This document details the security model, trust assumptions, analyzed threat vectors, and mitigations implemented in **PoolPilot**.

---

## 1. Scope & Trust Model

### Assets
1. **Pool Reserves**: Underlying ERC-20 token balances held in `PoolPilotPool.sol`.
2. **LP Shares ($PLP$)**: ERC-20 tokens representing claims to underlying pool reserves.
3. **User Funds**: Tokens in user wallets requiring approval before transfer.

### Trust Assumptions
- **Tokens**: Standard compliant ERC-20 tokens (e.g. USDC, WETH). Unsupported tokens (fee-on-transfer, rebasing, ERC-777 with send-hooks) are documented and excluded.
- **EVM Chain**: Correct execution of EVM opcodes and block timestamp increments.
- **RPC Providers**: Assumed to honestly relay transactions; user wallet validates signatures.

---

## 2. Threat Vectors & Mitigations

| Threat Vector | Severity | Impact | Mitigation in PoolPilot |
| :--- | :--- | :--- | :--- |
| **First-Depositor Inflation Attack** | High | Attacker deposits 1 wei, inflates share price, and steals subsequent deposits due to rounding down to zero. | **$MINIMUM\_LIQUIDITY = 1,000$ shares** are permanently minted to the dead address `0x...dEaD` on first deposit. Subsequent shares are impossible to manipulate trivially. |
| **Sandwich Attacks & MEV** | Medium | Front-runners manipulate pool price before a user's transaction and back-run after. | Every swap strictly requires a caller-supplied **`amountOutMin`**. The contract reverts atomically if received tokens fall below this limit. Deadlines prevent inclusion of stale transactions. |
| **Reentrancy Attacks** | High | External calls to malicious token contracts re-entering swap or burn functions. | **ReentrancyGuard** (`nonReentrant` modifier) applied to all state-changing entry points. Strict **Checks-Effects-Interactions (CEI)** pattern updates storage reserves prior to token transfers. |
| **Non-Standard ERC-20 Return Values** | Medium | Tokens like USDT that omit return booleans in `transfer()` and `transferFrom()`. | All transfers utilize OpenZeppelin's **`SafeERC20`**, which decodes low-level bytes and validates boolean returns or empty byte arrays. |
| **Arithmetic Overflow / Underflow** | High | Manipulating integer limits to wrap values. | **Solidity 0.8.24** built-in checked arithmetic panics on overflow. Input bounds and division-by-zero checks are explicitly enforced. |
| **Rounding Depletion** | Medium | Repeated micro-trades siphoning reserve dust through rounding errors. | Integer division **rounds down** on all output token calculations, favoring pool retention over trade payout. |
| **Zero Address / Duplicate Pool Pair** | Low | Accidental lockup of tokens or fragmented liquidity. | Constructor enforces `_tokenA != address(0)`, `_tokenB != address(0)`, `_tokenA != _tokenB`, and canonically sorts `token0 < token1`. |

---

## 3. Explicit Limitations & Unsupported Tokens

1. **Fee-on-Transfer Tokens**: Pools do not deduct external transfer fees. Tokens with automatic burns or reflection fees are unsupported.
2. **Rebasing Tokens**: Tokens with dynamically shifting balances (e.g. stETH or AMPL) will cause pool reserve mismatches unless `sync()` is called after every rebase.
3. **Multi-Hop Swaps**: PoolPilot prototype implements direct single-pool trading; multi-hop routing is out of MVP scope.
