# PoolPilot Deployment & Local Development Guide

This guide covers spinning up a local test chain, compiling smart contracts, running tests, deploying contracts, and launching the interactive frontend.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or `v24.x` (verified with `v24.18.0`)
- **npm**: `v10.x` or `v11.x` (verified with `11.16.0`)
- **Foundry / Hardhat**: Contract tooling
- **Web3 Wallet**: MetaMask, Rabby, or Coinbase Wallet

---

## 2. Quickstart (Local Development)

### Step 1: Start Local EVM Node
In a dedicated terminal window:
```bash
# Using Hardhat Node (Port 8545, Chain ID 31337)
cd contracts
npx hardhat node
```
*Or using Anvil:*
```bash
anvil --chain-id 31337 --port 8545
```

### Step 2: Deploy Contracts & Seed Initial Liquidity
In a second terminal window:
```bash
cd contracts
npx hardhat run script/deploy.js --network localhost
```
*This command will:*
1. Deploy `MockUSDC` and `MockWETH`.
2. Deploy `PoolPilotPool`.
3. Mint test tokens to deployer account.
4. Seed initial liquidity ($50,000$ USDC and $20$ WETH, setting initial price to $2,500$ USDC/ETH).
5. Automatically write deployed addresses to `frontend/src/config/contracts.json`.

### Step 3: Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Running Automated Tests

### Smart Contract Test Suite
```bash
cd contracts
npx hardhat test
```
*Executes all 21 unit and invariant tests covering:*
- Canonical token sorting
- Zero-address & duplicate validation
- Initial liquidity minting & 1000 share minimum burn
- Proportional deposits & slippage bounds
- Token swaps in both directions with exact $0.30\%$ fee
- $k_{\text{after}} > k_{\text{before}}$ invariant growth
- Reentrancy & balance synchronization (`sync()`)

### Frontend Unit Tests
```bash
cd frontend
npm test
```
*Validates token formatting, slippage calculations, error string decoders, and address shorteners.*

---

## 4. Testnet Deployment (e.g. Sepolia)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your testnet RPC URL and private key:
   ```env
   SEPOLIA_RPC_URL="https://rpc.sepolia.org"
   DEPLOYER_PRIVATE_KEY="0x..."
   ```
3. Deploy to Sepolia:
   ```bash
   cd contracts
   npx hardhat run script/deploy.js --network sepolia
   ```
