# PoolPilot 

> A transparent, non-custodial automated market maker (AMM) demonstrating constant-product token swaps, proportional liquidity provision, and on-chain settlement.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-v5.0-4E5EE4?logo=openzeppelin)](https://openzeppelin.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Overview & Prototype Status

**PoolPilot** is an open-source, non-custodial AMM prototype designed for transparent decentralized trading and liquidity provision on EVM-compatible networks.

### What PoolPilot Is:
- A functional constant-product AMM pool ($x \cdot y = k$) for arbitrary paired ERC-20 tokens.
- A fee-accruing protocol retaining $0.30\%$ ($30$ basis points) on every swap for LP token holders.
- A proportional liquidity accounting system issuing ERC-20 LP shares ($PLP$).
- An interactive Web3 frontend with real-time reserve reading, slippage protection, and transaction status modals.
- A testable codebase with automated unit, invariant, and frontend test suites.

### What PoolPilot Is Not:
- **Not audited:** This is a hackathon prototype for demonstration and testing. Do not use with real user funds on mainnet.
- **No off-chain matching:** Swaps settle atomically on-chain.
- **No multi-hop routing:** Operates on direct pairs.

---

## 2. Team 404 Responsibilities

- **Yuvraj Kumar** — Database and reserve accounting, price queries, and financial invariant verifications.
- **Yash Singh** — UI/UX, glassmorphism design system, interaction states, and accessibility.
- **Alwin Mathew** — Backend and on-chain integration, smart contract architecture, and RPC pipelines.

---

## 3. Mathematical & Economic Model

### Constant-Product Invariant
For reserves $x$ ($\text{token0}$) and $y$ ($\text{token1}$):
$$k = x \cdot y$$

### Fee Mechanics
- **Fee Rate:** $0.30\%$ ($30$ basis points out of $10,000$).
- All fees remain in the pool reserves, causing the invariant $k$ to grow monotonically over successive trades ($k_{\text{after}} > k_{\text{before}}$).

### Output Calculation (Exact Input)
$$\Delta x_{\text{withFee}} = \Delta x \cdot 9970$$
$$\Delta y = \left\lfloor \frac{\Delta x_{\text{withFee}} \cdot y}{(x \cdot 10000) + \Delta x_{\text{withFee}}} \right\rfloor$$
Integer division rounds down to guarantee the pool never overpays output tokens.

### Liquidity Provision & Inflation Attack Defense
- **First Depositor:** Mints $L = \lfloor \sqrt{\Delta x \cdot \Delta y} \rfloor - 1000$ shares. The initial $1,000$ shares are permanently locked to `0x000000000000000000000000000000000000dEaD` to prevent the first-depositor share inflation exploit.
- **Subsequent Depositors:** Must deposit tokens proportionally:
  $$shares = \min\left(\left\lfloor \frac{\Delta x \cdot L_{\text{total}}}{x} \right\rfloor, \left\lfloor \frac{\Delta y \cdot L_{\text{total}}}{y} \right\rfloor\right)$$
- **Liquidity Removal:** Proportional redemption:
  $$\Delta x = \left\lfloor \frac{shares \cdot x}{L_{\text{total}}} \right\rfloor, \quad \Delta y = \left\lfloor \frac{shares \cdot y}{L_{\text{total}}} \right\rfloor$$

---

## 4. Repository Structure

```text
poolpilot/
├── AGENTS.md                  # Project constitution & agent operating rules
├── README.md                  # Project documentation & quickstart
├── package.json               # Root monorepo workspace scripts
├── .gitignore                 # Build & secret exclusions
├── .env.example               # Environment template with placeholders
├── contracts/
│   ├── src/
│   │   ├── PoolPilotPool.sol  # Core constant-product AMM pool & LP ERC-20
│   │   ├── MockERC20.sol      # ERC-20 test tokens with public mint helper
│   │   └── interfaces/
│   │       └── IPoolPilotPool.sol
│   ├── test/
│   │   ├── PoolPilotPool.test.js # 21 comprehensive unit & invariant tests
│   │   └── PoolPilotPool.t.sol   # Foundry test suite
│   ├── script/
│   │   ├── deploy.js          # Deployment & liquidity seeding script
│   │   └── Deploy.s.sol       # Foundry deployment script
│   ├── foundry.toml           # Foundry profile configuration
│   ├── hardhat.config.js      # Hardhat configuration (Solc 0.8.24)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # SwapCard, LiquidityCard, PoolOverview, Header, Modals
│   │   ├── hooks/             # useWallet, usePoolData
│   │   ├── lib/               # BigInt token math, slippage min, error parser
│   │   ├── config/            # ABIs and deployed contract addresses
│   │   ├── App.jsx
│   │   └── index.css          # Glassmorphism dark mode design system
│   ├── test/
│   │   └── ethereum.test.js   # 14 frontend unit tests
│   ├── index.html
│   └── package.json
└── docs/
    ├── architecture.md        # System architecture & component flow
    ├── amm-math.md            # Exact mathematical derivations & equations
    ├── threat-model.md        # Security analysis & threat mitigations
    └── deployment.md          # Deployment & testnet instructions
```

---

## 5. Prerequisites & Pinned Tooling

- **Node.js:** `v20.x` or `v24.x` (tested on `v24.18.0`)
- **npm:** `v10.x` or `v11.x` (tested on `11.16.0`)
- **Solidity:** `0.8.24` (pinned in Hardhat & Foundry)
- **OpenZeppelin Contracts:** `v5.0` (`SafeERC20`, `ERC20`, `ReentrancyGuard`, `Math`)

---

## 6. How to Install, Test & Run

### 1. Install Dependencies
```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Run Automated Test Suites

#### Smart Contract Tests (21 passing tests)
```bash
cd contracts
npm test
```
*Covers initialization, zero-address checks, initial liquidity locking, proportional liquidity, bidirectional swaps, slippage reverts, fee calculations, invariant $k$ growth, and direct token balance sync.*

#### Frontend Unit Tests (14 passing tests)
```bash
cd frontend
npm test
```
*Covers BigInt formatting, input parsing, slippage minimum calculations, address truncating, and contract error decoding.*

### 3. Start Local Chain & Deploy Contracts
In terminal 1:
```bash
cd contracts
npm run node
```
*Or using Anvil:*
```bash
anvil --chain-id 31337 --port 8545
```

In terminal 2, deploy contracts and seed initial liquidity ($50,000$ USDC and $20$ WETH):
```bash
cd contracts
npm run deploy:local
```

### 4. Run the Web Application
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**.
- Connect your Web3 wallet (MetaMask) to `http://127.0.0.1:8545` (Chain ID `31337`).
- Use the **Faucet** button in the header to claim $1,000$ USDC and $1$ WETH instantly.
- Swap tokens, add liquidity, or withdraw LP shares with slippage protection.

---

## 7. Known Limitations & Security Disclosures

1. **Unsupported Token Types:**
   - Fee-on-transfer / reflection tokens
   - Rebasing tokens (require calling `sync()` after rebase events)
   - ERC-777 tokens with sender hooks
2. **Prototype Status:** PoolPilot is designed and built for educational and demonstration purposes. It has not undergone formal independent security audits. Never commit real funds or private keys.
