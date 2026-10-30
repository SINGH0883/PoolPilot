// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IPoolPilotPool} from "./interfaces/IPoolPilotPool.sol";

/**
 * @title PoolPilotPool
 * @notice Constant-product automated market maker (AMM) with proportional liquidity accounting,
 *         explicit 0.30% swap fees, minimum output slippage protection, and reentrancy safeguards.
 * @dev Implements x * y = k invariant with fee-aware integer arithmetic and minimum initial liquidity lock.
 */
contract PoolPilotPool is IPoolPilotPool, ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Fee denominator: 10,000 basis points = 100%
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @notice Fee rate: 30 basis points = 0.30%
    uint256 public constant FEE_NUMERATOR = 30;

    /// @notice Minimum liquidity locked on first deposit to prevent inflation attacks (Uniswap V2 model)
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    /// @notice Burn address for permanently locking initial minimum liquidity
    address public constant DEAD_ADDRESS = address(0x000000000000000000000000000000000000dEaD);

    /// @notice Canonical sorted tokens
    address public immutable override token0;
    address public immutable override token1;

    /// @notice Reserves tracked by the pool
    uint256 public override reserve0;
    uint256 public override reserve1;

    /**
     * @notice Construct a new PoolPilot AMM pool for two ERC20 tokens.
     * @param _tokenA Address of first token.
     * @param _tokenB Address of second token.
     */
    constructor(address _tokenA, address _tokenB) ERC20("PoolPilot LP Token", "PLP") {
        if (_tokenA == address(0) || _tokenB == address(0)) revert ZeroAddress();
        if (_tokenA == _tokenB) revert IdenticalAddresses();

        if (_tokenA < _tokenB) {
            token0 = _tokenA;
            token1 = _tokenB;
        } else {
            token0 = _tokenB;
            token1 = _tokenA;
        }
    }

    /**
     * @notice Returns current reserves of the pool.
     * @return _reserve0 Reserve of token0.
     * @return _reserve1 Reserve of token1.
     */
    function getReserves() external view override returns (uint256 _reserve0, uint256 _reserve1) {
        return (reserve0, reserve1);
    }

    /**
     * @notice Pure/view helper to calculate swap output for a given input.
     * @param tokenIn Address of input token (must be token0 or token1).
     * @param amountIn Amount of input token.
     * @return amountOut Amount of output token received after 0.30% fee.
     */
    function getAmountOut(address tokenIn, uint256 amountIn) public view override returns (uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();
        bool isToken0 = tokenIn == token0;
        if (!isToken0 && tokenIn != token1) revert InvalidToken();

        (uint256 resIn, uint256 resOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);
        if (resIn == 0 || resOut == 0) revert InsufficientLiquidity();

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * resOut;
        uint256 denominator = (resIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice View helper to quote optimal token deposits and expected LP shares when adding liquidity.
     * @param amount0Desired Desired amount of token0.
     * @param amount1Desired Desired amount of token1.
     * @return amount0 Required amount of token0.
     * @return amount1 Required amount of token1.
     * @return shares Expected LP shares to be minted.
     */
    function quoteAddLiquidity(uint256 amount0Desired, uint256 amount1Desired)
        external
        view
        returns (uint256 amount0, uint256 amount1, uint256 shares)
    {
        if (amount0Desired == 0 || amount1Desired == 0) revert ZeroAmount();
        uint256 _totalSupply = totalSupply();

        if (_totalSupply == 0) {
            amount0 = amount0Desired;
            amount1 = amount1Desired;
            uint256 initialShares = Math.sqrt(amount0 * amount1);
            if (initialShares > MINIMUM_LIQUIDITY) {
                shares = initialShares - MINIMUM_LIQUIDITY;
            }
        } else {
            uint256 amount1Optimal = (amount0Desired * reserve1) / reserve0;
            if (amount1Optimal <= amount1Desired) {
                amount0 = amount0Desired;
                amount1 = amount1Optimal;
            } else {
                uint256 amount0Optimal = (amount1Desired * reserve0) / reserve1;
                amount0 = amount0Optimal;
                amount1 = amount1Desired;
            }
            uint256 share0 = (amount0 * _totalSupply) / reserve0;
            uint256 share1 = (amount1 * _totalSupply) / reserve1;
            shares = Math.min(share0, share1);
        }
    }

    /**
     * @notice Adds liquidity to the pool.
     * @param amount0Desired Maximum amount of token0 caller is willing to deposit.
     * @param amount1Desired Maximum amount of token1 caller is willing to deposit.
     * @param amount0Min Minimum amount of token0 acceptable (slippage control).
     * @param amount1Min Minimum amount of token1 acceptable (slippage control).
     * @param to Recipient address for minted LP shares.
     * @param deadline Unix timestamp after which transaction reverts.
     * @return amount0 Actual token0 deposited.
     * @return amount1 Actual token1 deposited.
     * @return shares LP shares minted to recipient.
     */
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amount0, uint256 amount1, uint256 shares) {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (to == address(0)) revert ZeroAddress();
        if (amount0Desired == 0 || amount1Desired == 0) revert ZeroAmount();

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            amount0 = amount0Desired;
            amount1 = amount1Desired;
            if (amount0 < amount0Min) revert InsufficientToken0Amount(amount0, amount0Min);
            if (amount1 < amount1Min) revert InsufficientToken1Amount(amount1, amount1Min);

            uint256 initialShares = Math.sqrt(amount0 * amount1);
            if (initialShares <= MINIMUM_LIQUIDITY) revert InsufficientLiquidityMinted();

            shares = initialShares - MINIMUM_LIQUIDITY;
            _mint(DEAD_ADDRESS, MINIMUM_LIQUIDITY);
            _mint(to, shares);
        } else {
            uint256 amount1Optimal = (amount0Desired * reserve1) / reserve0;
            if (amount1Optimal <= amount1Desired) {
                if (amount1Optimal < amount1Min) revert InsufficientToken1Amount(amount1Optimal, amount1Min);
                amount0 = amount0Desired;
                amount1 = amount1Optimal;
            } else {
                uint256 amount0Optimal = (amount1Desired * reserve0) / reserve1;
                if (amount0Optimal < amount0Min) revert InsufficientToken0Amount(amount0Optimal, amount0Min);
                amount0 = amount0Optimal;
                amount1 = amount1Desired;
            }

            uint256 share0 = (amount0 * _totalSupply) / reserve0;
            uint256 share1 = (amount1 * _totalSupply) / reserve1;
            shares = Math.min(share0, share1);
            if (shares == 0) revert InsufficientLiquidityMinted();

            _mint(to, shares);
        }

        // Checks-Effects-Interactions: transfer tokens IN first, then update reserves
        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        reserve0 += amount0;
        reserve1 += amount1;

        emit Mint(msg.sender, to, amount0, amount1, shares);
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Removes liquidity and burns LP shares.
     * @param shares LP shares to burn.
     * @param amount0Min Minimum acceptable amount of token0 returned.
     * @param amount1Min Minimum acceptable amount of token1 returned.
     * @param to Recipient address for returned tokens.
     * @param deadline Unix timestamp after which transaction reverts.
     * @return amount0 Actual token0 returned.
     * @return amount1 Actual token1 returned.
     */
    function removeLiquidity(
        uint256 shares,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amount0, uint256 amount1) {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (to == address(0)) revert ZeroAddress();
        if (shares == 0) revert ZeroAmount();

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) revert InsufficientLiquidity();

        amount0 = (shares * reserve0) / _totalSupply;
        amount1 = (shares * reserve1) / _totalSupply;

        if (amount0 == 0 && amount1 == 0) revert InsufficientLiquidityBurned();
        if (amount0 < amount0Min) revert InsufficientToken0Amount(amount0, amount0Min);
        if (amount1 < amount1Min) revert InsufficientToken1Amount(amount1, amount1Min);

        _burn(msg.sender, shares);

        // Transfer tokens OUT first, then update reserves (CEI pattern)
        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);

        reserve0 -= amount0;
        reserve1 -= amount1;

        emit Burn(msg.sender, to, amount0, amount1, shares);
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Swaps tokenIn for the other pool token with slippage protection.
     * @param tokenIn Address of input token.
     * @param amountIn Amount of input token.
     * @param amountOutMin Minimum acceptable output amount (slippage protection).
     * @param to Recipient address for output tokens.
     * @param deadline Unix timestamp after which transaction reverts.
     * @return amountOut Output amount transferred to recipient.
     */
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256 amountOut) {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (to == address(0)) revert ZeroAddress();
        if (amountIn == 0) revert ZeroAmount();

        bool isToken0 = tokenIn == token0;
        if (!isToken0 && tokenIn != token1) revert InvalidToken();

        (uint256 resIn, uint256 resOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);
        if (resIn == 0 || resOut == 0) revert InsufficientLiquidity();

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * resOut;
        uint256 denominator = (resIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;

        if (amountOut == 0) revert InsufficientOutputAmount(0, amountOutMin);
        if (amountOut < amountOutMin) revert InsufficientOutputAmount(amountOut, amountOutMin);

        // Update reserves before transfer (Checks-Effects-Interactions)
        if (isToken0) {
            reserve0 = resIn + amountIn;
            reserve1 = resOut - amountOut;
        } else {
            reserve1 = resIn + amountIn;
            reserve0 = resOut - amountOut;
        }

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        address tokenOut = isToken0 ? token1 : token0;
        IERC20(tokenOut).safeTransfer(to, amountOut);

        emit Swap(msg.sender, to, tokenIn, amountIn, amountOut);
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Synchronizes pool reserves with actual token balances.
     */
    function sync() external override nonReentrant {
        reserve0 = IERC20(token0).balanceOf(address(this));
        reserve1 = IERC20(token1).balanceOf(address(this));
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Reject accidental ETH sends to the pool contract.
     */
    receive() external payable {
        revert("PoolPilotPool: ETH not accepted");
    }
}
