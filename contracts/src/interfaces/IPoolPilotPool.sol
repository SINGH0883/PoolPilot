// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IPoolPilotPool
 * @notice Interface for the PoolPilot constant-product automated market maker (AMM).
 */
interface IPoolPilotPool is IERC20 {
    // --- Events ---
    event Mint(address indexed sender, address indexed to, uint256 amount0, uint256 amount1, uint256 shares);
    event Burn(address indexed sender, address indexed to, uint256 amount0, uint256 amount1, uint256 shares);
    event Swap(address indexed sender, address indexed recipient, address indexed tokenIn, uint256 amountIn, uint256 amountOut);
    event Sync(uint256 reserve0, uint256 reserve1);

    // --- Custom Errors ---
    error IdenticalAddresses();
    error ZeroAddress();
    error InvalidToken();
    error ZeroAmount();
    error InsufficientLiquidity();
    error InsufficientLiquidityMinted();
    error InsufficientLiquidityBurned();
    error InsufficientOutputAmount(uint256 amountOut, uint256 amountOutMin);
    error InsufficientToken0Amount(uint256 amount0, uint256 amount0Min);
    error InsufficientToken1Amount(uint256 amount1, uint256 amount1Min);
    error DeadlineExpired();
    error InvalidReserves();

    // --- State View Functions ---
    function token0() external view returns (address);
    function token1() external view returns (address);
    function reserve0() external view returns (uint256);
    function reserve1() external view returns (uint256);
    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1);
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);

    // --- State-Changing Functions ---
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) external returns (uint256 amount0, uint256 amount1, uint256 shares);

    function removeLiquidity(
        uint256 shares,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) external returns (uint256 amount0, uint256 amount1);

    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);

    function sync() external;
}
