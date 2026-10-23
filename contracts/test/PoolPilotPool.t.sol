// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface Vm {
    function warp(uint256) external;
    function prank(address) external;
    function expectRevert() external;
}

import {PoolPilotPool} from "../src/PoolPilotPool.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {IPoolPilotPool} from "../src/interfaces/IPoolPilotPool.sol";

contract PoolPilotPoolTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    PoolPilotPool public pool;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    address public token0;
    address public token1;

    address public alice = address(0x1111);
    address public bob = address(0x2222);

    uint256 constant INITIAL_MINT = 1_000_000 * 1e18;

    function setUp() public {
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);

        pool = new PoolPilotPool(address(tokenA), address(tokenB));
        token0 = pool.token0();
        token1 = pool.token1();

        tokenA.mint(alice, INITIAL_MINT);
        tokenB.mint(alice, INITIAL_MINT);
        tokenA.mint(bob, INITIAL_MINT);
        tokenB.mint(bob, INITIAL_MINT);

        vm.prank(alice);
        tokenA.approve(address(pool), type(uint256).max);
        vm.prank(alice);
        tokenB.approve(address(pool), type(uint256).max);

        vm.prank(bob);
        tokenA.approve(address(pool), type(uint256).max);
        vm.prank(bob);
        tokenB.approve(address(pool), type(uint256).max);
    }

    function test_InitialLiquidityMint() public {
        vm.prank(alice);
        (uint256 a0, uint256 a1, uint256 shares) = pool.addLiquidity(
            100 * 1e18,
            400 * 1e18,
            0,
            0,
            alice,
            block.timestamp + 1000
        );

        assert(a0 == 100 * 1e18);
        assert(a1 == 400 * 1e18);
        // sqrt(100e18 * 400e18) = 200e18 - 1000 minimum liquidity
        assert(shares == 200 * 1e18 - 1000);
        assert(pool.balanceOf(alice) == shares);
        assert(pool.balanceOf(pool.DEAD_ADDRESS()) == 1000);
    }

    function test_SwapOutputAndFee() public {
        vm.prank(alice);
        pool.addLiquidity(
            10_000 * 1e18,
            20_000 * 1e18,
            0,
            0,
            alice,
            block.timestamp + 1000
        );

        uint256 amountIn = 100 * 1e18;
        uint256 expectedOut = pool.getAmountOut(token0, amountIn);

        vm.prank(bob);
        uint256 actualOut = pool.swap(
            token0,
            amountIn,
            expectedOut,
            bob,
            block.timestamp + 1000
        );

        assert(actualOut == expectedOut);
        (uint256 r0, uint256 r1) = pool.getReserves();
        assert(r0 == 10_000 * 1e18 + amountIn);
        assert(r1 == 20_000 * 1e18 - actualOut);
    }
}
