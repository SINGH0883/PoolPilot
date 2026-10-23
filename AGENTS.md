# AGENTS.md — PoolPilot

> Project guidance for AI coding agents and human contributors.
> Treat this file as the working source of truth for implementation decisions unless the repository or project owner explicitly updates it.

## 1. Project identity

- **Project:** PoolPilot
- **Category:** On-chain finance and trading
- **Purpose:** A transparent, non-custodial token-swap prototype using a constant-product automated market maker (AMM).
- **Primary goal:** Demonstrate swaps, liquidity provision/removal, reserve-based pricing, slippage protection, and on-chain settlement on a local chain or EVM-compatible testnet.
- **Current maturity:** Hackathon prototype. Do not represent it as production-ready or audited.
- **Team:** Team 404
  - Yuvraj Kumar — database-related responsibilities
  - Yash Singh — UI/UX
  - Alwin Mathew — backend-related responsibilities

The project presentation specifies Solidity contracts, OpenZeppelin ERC-20 utilities including `SafeERC20`, Foundry, Anvil, a React frontend, and an EVM-compatible testnet. It does not define every implementation detail. Inspect the repository before choosing libraries, folder structures, deployment targets, or conventions.

## 2. Agent operating rules

Before making changes:

1. Inspect the repository structure, README, package manifests, Foundry configuration, existing contracts, tests, frontend, and environment examples.
2. Identify what is already implemented. Do not replace working architecture or rewrite files wholesale without a clear reason.
3. Follow the conventions already used in the codebase unless they conflict with the security rules in this document.
4. Check the available scripts and tool versions before running commands. Report commands that could not be run.
5. Make the smallest coherent change that meets the task.
6. Add or update tests for changed behavior.
7. Summarize files changed, behavior added, tests run, and known limitations.

Never claim a feature works, a test passed, or a contract was deployed unless you actually verified it.

### Decision-making and unknowns

- Treat this as a prototype unless the owner explicitly changes that scope.
- Do not invent business requirements, chain IDs, deployed contract addresses, RPC URLs, token addresses, fee rates, branding rules, or environment variables.
- If an important decision is unspecified, inspect the code and documentation first. Choose a conservative, easily reversible default only when the task can reasonably proceed; document the assumption.
- Ask the owner when an ambiguity changes financial behavior, security assumptions, external integrations, or irreversible actions.
- Keep optional future ideas separate from required MVP behavior.

## 3. Product scope

### Core MVP

1. Connect an EVM-compatible wallet.
2. Read and display the selected pool's token reserves.
3. Display an indicative exchange rate and estimated swap output.
4. Let a user approve a token allowance where required.
5. Swap token A for token B and token B for token A.
6. Require a user-supplied minimum output (`amountOutMin`) and revert when it cannot be met.
7. Add liquidity by depositing the configured token pair.
8. Remove liquidity and return the corresponding underlying tokens.
9. Track liquidity-provider shares and ensure accounting is proportional.
10. Emit useful events for swaps, liquidity additions/removals, and any required pool initialization.
11. Show transaction lifecycle states: wallet confirmation, pending, success, and failure.
12. Provide useful empty, loading, disconnected-wallet, wrong-network, insufficient-balance, and error states.
13. Test the core financial invariants and important failure paths.
14. Support local development using Anvil and deployment to a configured EVM-compatible testnet.

### Explicitly not required for the first prototype

Do not add these unless requested:

- Mainnet deployment or real-money launch.
- Cross-chain bridging.
- Order books or centralized matching.
- Automated trading bots.
- AI-driven trade execution or guaranteed price predictions.
- Governance, DAO voting, or complex permission systems.
- Multi-hop routing across many pools.
- Fiat on/off ramps.
- Mobile apps.
- Enterprise integrations or public production APIs.
- Claims that PoolPilot is audited, risk-free, or guaranteed to generate returns.

## 4. Architecture principles

### On-chain responsibilities

Smart contracts are the authority for:

- Pool token addresses and reserves/balances.
- Swap calculations and execution.
- Slippage enforcement.
- Liquidity accounting and LP share minting/burning.
- Token transfers.
- Fee calculation and distribution.
- Events describing state-changing operations.

The frontend may calculate estimates for responsiveness, but the contract must independently validate every state-changing action. Never rely on frontend validation for security.

### Frontend responsibilities

The React frontend should:

- Connect to the user's wallet using the project's existing wallet library.
- Read contract state from the selected network.
- Format token amounts without losing precision.
- Show estimates, minimum output, fee information, and relevant warnings before confirmation.
- Request approvals and transactions explicitly through the wallet.
- Display pending/success/failure status using transaction receipts where available.
- Refresh or invalidate stale pool data after a confirmed transaction.
- Never ask the user to provide a seed phrase or private key to the application.

### Backend and database

The presentation assigns Alwin backend responsibilities and Yuvraj database responsibilities, but the described core trading flow is on-chain and does not establish a need for a centralized backend or database.

- Do not create a server or database merely to duplicate data already available from contracts.
- Add an off-chain service only when there is a defined requirement, such as cached analytics, indexing, or user preferences.
- If an indexer/database is added, on-chain state remains authoritative for balances, swaps, reserves, and liquidity.
- Never store seed phrases, private keys, or wallet signing secrets.
- Document any centralized dependency and its failure mode.

## 5. Smart-contract and financial safety rules

This section is mandatory.

### General Solidity rules

- Use a supported Solidity version consistent with the repository and pin it in project configuration.
- Use OpenZeppelin utilities where appropriate, including `SafeERC20` for ERC-20 transfers.
- Prefer clear, small, auditable functions over clever abstractions.
- Apply checks-effects-interactions where applicable and use a reentrancy guard when justified by the contract design.
- Validate zero addresses, invalid amounts, unsupported tokens, and invalid pool states.
- Avoid unbounded loops in state-changing functions.
- Emit events for state changes needed by clients and indexers.
- Keep access control minimal and explicit. Do not add privileged controls without documenting why they exist.
- Avoid `tx.origin` for authorization.
- Do not use floating-point arithmetic in Solidity.
- Do not assume all ERC-20 tokens behave identically. Document unsupported token behaviors such as fee-on-transfer, rebasing, or non-standard return values.
- Do not introduce upgradeability unless explicitly required and carefully justified.
- Never silently change an existing deployed contract's storage or ABI expectations.

### AMM math

For a standard two-token constant-product pool, let:

- `x` = reserve of input token
- `y` = reserve of output token
- `dx` = input amount after applying the documented fee convention
- `dy` = output amount

A common fee-aware exact-input formula is:

`amountInWithFee = amountIn * (FEE_DENOMINATOR - fee)`
`amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee)`

This formula is illustrative, not a mandate to silently select a fee. The fee rate, denominator, rounding rules, and whether fees remain in reserves must be explicitly configured and consistently implemented in contract, frontend, tests, and documentation.

- Use integer arithmetic with explicit rounding behavior.
- For output calculations, round down so the contract does not overpay output.
- Check for zero reserves and zero amounts before dividing.
- Guard against arithmetic overflow using Solidity's checked arithmetic and sensible input bounds.
- Keep reserve/accounting logic consistent with actual token balances.
- Document that `x * y = k` is an idealized invariant; fees and integer rounding affect how it evolves.
- The UI's quote is an estimate and may change before transaction inclusion.

### Slippage and deadlines

- Every swap must accept a minimum output amount and revert if actual output is below it.
- The UI must explain slippage and show the user's minimum acceptable output.
- Do not silently weaken or bypass `amountOutMin`.
- If a deadline parameter is implemented, validate it on-chain.
- Do not treat a frontend-only slippage check as protection.

### Liquidity accounting

- Clearly define initial LP share issuance, subsequent deposits, withdrawals, and rounding behavior.
- For a simple proportional pool, subsequent deposits should not let a provider mint more shares than their contribution warrants.
- Prevent zero-value deposits and withdrawals.
- Prevent burning more LP shares than the caller owns.
- Ensure withdrawals cannot transfer more tokens than the provider's proportional claim.
- Define behavior for the first liquidity provider and avoid unsafe initial-share calculations.
- Explain impermanent loss and pool risks in user-facing educational copy.
- Do not promise returns or imply fee income is guaranteed.

### Token approvals

- Request only the allowance needed for the action when feasible.
- Show which token and spender are being approved.
- Never request unlimited approval by default unless the product owner explicitly approves the trade-off and the UI clearly explains it.
- Handle rejected approvals and failed transactions gracefully.
- Do not assume an approval transaction has succeeded until its receipt/state confirms it.

### Reentrancy, transfers, and unusual tokens

- Consider reentrancy risks around external token calls.
- Use safe token-transfer utilities.
- If the implementation supports only standard ERC-20 tokens, state that limitation.
- Do not claim universal ERC-20 compatibility without tests.
- Do not add fee-on-transfer or rebasing-token support without designing and testing the accounting model for it.

### Security disclosure

- The prototype is for demonstration and testing, not financial advice.
- Never describe it as risk-free or audited unless an independent audit has actually been completed and the scope is documented.
- Do not deploy to mainnet or handle real user funds without explicit authorization, comprehensive testing, and an independent security review.

## 6. Suggested repository layout

First follow the existing repository if one exists. If starting from scratch, a monorepo could use:

```text
poolpilot/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── contracts/
│   ├── src/
│   │   ├── PoolPilotPool.sol
│   │   └── interfaces/
│   ├── test/
│   ├── script/
│   ├── lib/
│   └── foundry.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── types/
│   ├── public/
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── amm-math.md
│   ├── threat-model.md
│   └── deployment.md
└── scripts/
```

This is a suggestion, not a requirement. Avoid unnecessary packages and folders.

## 7. Frontend implementation guidelines

- Use the framework and package manager already present in the repository.
- Keep contract interaction code in a dedicated module or hooks rather than scattering raw calls across UI components.
- Keep token metadata and contract addresses in explicit, network-specific configuration.
- Validate chain ID before submitting transactions.
- Never assume an address is valid on every network.
- Use `bigint` or the library's exact integer type for token quantities; do not use JavaScript `Number` for raw token units.
- Respect token decimals when converting between display units and base units.
- Make loading and transaction states explicit and accessible.
- Disable duplicate submissions while the same action is pending, without hiding the underlying transaction status.
- Display the selected network, token pair, price estimate, fees, minimum received, and transaction link where a valid explorer URL is configured.
- Do not fabricate explorer links, balances, price data, transaction hashes, or success messages.
- Handle wallet disconnection, rejected signatures, wrong network, RPC failure, reverted calls, and stale reads.
- Keep UI components reusable and avoid coupling visual components directly to low-level RPC calls.
- Do not introduce a design system or styling library that conflicts with the existing app without a clear reason.

## 8. Testing requirements

### Smart-contract unit tests

At minimum, cover:

- Pool initialization and invalid initialization.
- Initial liquidity provision.
- Additional proportional liquidity provision.
- Liquidity removal and LP share accounting.
- Swaps in both token directions.
- Correct output calculation with the selected fee.
- Minimum-output/slippage failure.
- Zero input, zero output, and empty-reserve conditions.
- Insufficient token allowance and insufficient balance.
- Invalid token addresses and unsupported token cases.
- Unauthorized access if any privileged function exists.
- Repeated actions and boundary values.
- Reentrancy-related behavior where applicable.
- Correct emitted events.
- Invariant/property tests for reserve and LP-accounting behavior.

### Frontend tests

Cover, where the existing test framework permits:

- Disconnected wallet.
- Correct and incorrect network.
- Loading and empty pool state.
- Invalid amount and insufficient balance.
- Quote and token-decimal formatting.
- Approval pending/success/failure.
- Swap pending/success/revert.
- Slippage warning and minimum output.
- Liquidity add/remove flows.
- RPC or contract read failures.

### Before marking work complete

Run the most relevant available checks, for example:

- `forge fmt --check`
- `forge test`
- The repository's configured frontend lint, typecheck, and test scripts
- A production frontend build

Use the actual scripts and package manager in the repository; do not assume these exact commands are available. Report any skipped checks and why.

## 9. Local development and deployment

- Use Anvil for local EVM development as described in the project plan.
- Keep RPC endpoints and deployment secrets out of source control.
- Provide a safe `.env.example` with placeholders only; never commit real secrets.
- Prefer test accounts and test tokens on a local chain or testnet.
- Make deployment scripts deterministic where feasible and verify deployed addresses and chain IDs.
- Record deployment addresses, compiler version, chain ID, and relevant transaction hashes in deployment documentation.
- Do not assume an address from one network is valid on another.
- Never deploy, verify, transfer funds, or make irreversible external changes without explicit user authorization.
- Do not include real private keys in commands, logs, examples, or generated files.

## 10. Documentation requirements

Keep the README useful for a new contributor. Include:

- What PoolPilot is and is not.
- Architecture and data flow.
- Prerequisites and pinned tool versions.
- How to install dependencies.
- How to start Anvil.
- How to compile and test contracts.
- How to run the frontend.
- How to deploy to a local chain/testnet.
- How to configure network and contract addresses.
- Known limitations and unsupported token types.
- Security warning and prototype status.

Document the AMM fee model, rounding, LP share model, supported tokens, and slippage behavior. Keep docs aligned with actual code; do not describe planned functionality as implemented.

## 11. Code quality and collaboration

- Prefer descriptive names and small functions.
- Keep formatting consistent with existing project tooling.
- Avoid unrelated refactors while implementing a feature.
- Avoid adding dependencies when existing tools suffice.
- Do not commit generated build artifacts, secrets, local chain state, or dependency folders unless the repository intentionally tracks them.
- Do not swallow errors silently.
- Make error messages actionable but do not expose secrets.
- Update tests and documentation with behavior changes.
- Keep changes reviewable and explain non-obvious financial or security choices.

## 12. Definition of done

A task is complete only when applicable conditions are met:

- The requested behavior is implemented.
- Financial invariants and access rules are enforced on-chain where relevant.
- Relevant automated tests have been added or updated.
- Available formatting, linting, typechecking, tests, and builds have been run.
- Documentation reflects the actual behavior.
- No secrets or private keys were added.
- Known limitations and unrun checks are clearly reported.
- No unsupported claims of deployment, security audit, or production readiness are made.

## 13. Product context from the hackathon presentation

The presentation identifies the problem as on-chain finance and trading, with centralized exchanges and off-chain services creating reliance on intermediaries. PoolPilot's proposed response is a smart-contract liquidity pool with constant-product pricing, atomic settlement, permissionless liquidity provision, and transparent on-chain transactions.

The presentation's stated future possibilities include AI-powered market analytics, Android/iOS apps, enterprise/API integrations, and broader network/token/language support. These are future scope, not MVP commitments.

The presentation cites market-level DEX trends as context, but those figures do not establish PoolPilot's likely market share, revenue, or product-market fit.

## 14. Final instruction to agents

Build PoolPilot as a small, understandable, testable AMM demonstration. Prioritize correctness, clear user consent, transparent transaction behavior, and smart-contract safety over feature count or visual complexity. Inspect before editing, test what you change, and state uncertainty honestly.
