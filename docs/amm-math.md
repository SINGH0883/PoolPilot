# PoolPilot AMM Mathematical Specifications

This document defines the mathematical foundations, rounding behavior, invariant properties, fee mechanics, and liquidity accounting implemented in `PoolPilotPool.sol`.

---

## 1. Constant-Product Formula

PoolPilot maintains a standard two-token constant-product automated market maker (AMM).
For a pair of tokens $(T_0, T_1)$ with pool reserves $x = \text{reserve0}$ and $y = \text{reserve1}$, the idealized invariant is:

$$k = x \cdot y$$

Due to swap fees retained in the pool and integer division rounding down, the actual on-chain invariant strictly satisfies:

$$k_{\text{after}} \ge k_{\text{before}}$$

---

## 2. Swap Mechanics & Fee Accounting

### 2.1 Fee Configuration
- **Fee Denominator:** $10,000$ basis points ($100\%$)
- **Fee Rate:** $30$ basis points ($0.30\%$)
- **Retained Fees:** The entire $0.30\%$ fee remains inside the pool reserves, directly accruing value to existing liquidity providers ($PLP$ share holders). No protocol skim or admin take is charged.

### 2.2 Exact-Input Calculation
When a user swaps $\Delta x$ amount of input token:

1. The effective input after the $0.30\%$ fee is:
   $$\Delta x_{\text{withFee}} = \Delta x \cdot (10000 - 30) = \Delta x \cdot 9970$$

2. The output token received $\Delta y$ is:
   $$\Delta y = \left\lfloor \frac{\Delta x_{\text{withFee}} \cdot y}{(x \cdot 10000) + \Delta x_{\text{withFee}}} \right\rfloor$$

### 2.3 Rounding Direction
Solidity integer division automatically truncates towards zero (rounds down).
- **Security Rationale:** Rounding down the output amount $\Delta y$ ensures the contract **never overpays** the trader, protecting pool solvency.
- Minimum output enforcement: If $\Delta y < \text{amountOutMin}$, the contract reverts with `InsufficientOutputAmount(\Delta y, \text{amountOutMin})`.

---

## 3. Liquidity Accounting & LP Share Issuance

PoolPilot issues an ERC-20 token ($PLP$) representing proportional ownership of pool reserves.

### 3.1 Initial Liquidity Provision ($L = 0$)
To prevent the classic AMM **first-depositor inflation attack** (where an attacker donates tokens and burns tiny share supplies to manipulate share price and round subsequent deposits to zero):

1. The initial LP share amount is calculated using the geometric mean:
   $$L_{\text{initial}} = \left\lfloor \sqrt{\Delta x \cdot \Delta y} \right\rfloor$$

2. A minimum liquidity threshold $MINIMUM\_LIQUIDITY = 1,000$ shares is permanently locked to the burn address `0x000000000000000000000000000000000000dEaD`:
   $$L_{\text{user}} = L_{\text{initial}} - 1000$$

3. If $L_{\text{initial}} \le 1000$, the deposit reverts with `InsufficientLiquidityMinted()`.

### 3.2 Subsequent Liquidity Deposits ($L > 0$)
Subsequent depositors must contribute tokens in exact proportion to the current reserve ratio:

1. The optimal counterpart amount is calculated:
   $$\Delta y_{\text{optimal}} = \left\lfloor \frac{\Delta x_{\text{desired}} \cdot y}{x} \right\rfloor$$
   If $\Delta y_{\text{optimal}} \le \Delta y_{\text{desired}}$, the depositor contributes $(\Delta x_{\text{desired}}, \Delta y_{\text{optimal}})$.
   Otherwise, the depositor contributes $(\Delta x_{\text{optimal}}, \Delta y_{\text{desired}})$ where $\Delta x_{\text{optimal}} = \lfloor \frac{\Delta y_{\text{desired}} \cdot x}{y} \rfloor$.

2. Depositors receive LP shares proportional to the minimum of their contributed ratios:
   $$shares = \min\left( \left\lfloor \frac{\Delta x \cdot L_{\text{total}}}{x} \right\rfloor, \left\lfloor \frac{\Delta y \cdot L_{\text{total}}}{y} \right\rfloor \right)$$

### 3.3 Liquidity Removal & Proportional Redemption
When an LP burns $S$ shares:
$$\Delta x = \left\lfloor \frac{S \cdot x}{L_{\text{total}}} \right\rfloor$$
$$\Delta y = \left\lfloor \frac{S \cdot y}{L_{\text{total}}} \right\rfloor$$

Slippage checks ensure $\Delta x \ge \text{amount0Min}$ and $\Delta y \ge \text{amount1Min}$.

---

## 4. Slippage & Price Impact

### 4.1 Price Impact
When executing large swaps relative to reserves:
$$\text{Price Impact} \approx \frac{\Delta x}{x + \Delta x}$$
The frontend highlights price impact in real time, alerting users when impact exceeds $5\%$.

### 4.2 Slippage Protection
Every state-changing swap requires the caller to provide an explicit `amountOutMin`. If market conditions or sandwich activity causes the executed quote to fall below `amountOutMin`, the EVM atomically reverts the transaction and rolls back token transfers.
