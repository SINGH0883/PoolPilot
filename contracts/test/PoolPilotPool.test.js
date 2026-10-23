const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PoolPilot AMM Core Unit & Invariant Tests", function () {
  let owner, alice, bob, charlie;
  let tokenA, tokenB, token0, token1, pool;
  let isTokenA0;

  const INITIAL_MINT = ethers.parseEther("1000000"); // 1M tokens each
  const ONE_DAY = 24 * 60 * 60;

  async function getTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    // Deploy two mock tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    tokenA = await MockToken.deploy("Token Alpha", "TKA", 18);
    tokenB = await MockToken.deploy("Token Beta", "TKB", 18);

    // Deploy Pool
    const PoolFactory = await ethers.getContractFactory("PoolPilotPool");
    pool = await PoolFactory.deploy(await tokenA.getAddress(), await tokenB.getAddress());

    const poolToken0 = await pool.token0();
    const poolToken1 = await pool.token1();

    const tokenAAddr = await tokenA.getAddress();
    isTokenA0 = tokenAAddr.toLowerCase() === poolToken0.toLowerCase();
    token0 = isTokenA0 ? tokenA : tokenB;
    token1 = isTokenA0 ? tokenB : tokenA;

    // Distribute tokens to alice and bob
    await token0.mint(alice.address, INITIAL_MINT);
    await token1.mint(alice.address, INITIAL_MINT);
    await token0.mint(bob.address, INITIAL_MINT);
    await token1.mint(bob.address, INITIAL_MINT);

    // Approvals to pool
    await token0.connect(alice).approve(await pool.getAddress(), ethers.MaxUint256);
    await token1.connect(alice).approve(await pool.getAddress(), ethers.MaxUint256);
    await token0.connect(bob).approve(await pool.getAddress(), ethers.MaxUint256);
    await token1.connect(bob).approve(await pool.getAddress(), ethers.MaxUint256);
  });

  describe("1. Pool Initialization & Construction", function () {
    it("Should correctly sort token0 < token1 canonically", async function () {
      const t0 = await pool.token0();
      const t1 = await pool.token1();
      expect(BigInt(t0)).to.be.lessThan(BigInt(t1));
    });

    it("Should revert if either token address is address(0)", async function () {
      const PoolFactory = await ethers.getContractFactory("PoolPilotPool");
      await expect(
        PoolFactory.deploy(ethers.ZeroAddress, await tokenB.getAddress())
      ).to.be.revertedWithCustomError(pool, "ZeroAddress");

      await expect(
        PoolFactory.deploy(await tokenA.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(pool, "ZeroAddress");
    });

    it("Should revert if token addresses are identical", async function () {
      const PoolFactory = await ethers.getContractFactory("PoolPilotPool");
      await expect(
        PoolFactory.deploy(await tokenA.getAddress(), await tokenA.getAddress())
      ).to.be.revertedWithCustomError(pool, "IdenticalAddresses");
    });

    it("Should initialize with 0 reserves and 0 total LP supply", async function () {
      const [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(0n);
      expect(r1).to.equal(0n);
      expect(await pool.totalSupply()).to.equal(0n);
    });
  });

  describe("2. Initial Liquidity Provision", function () {
    it("Should revert when deadline has expired", async function () {
      const ts = await getTimestamp();
      await expect(
        pool.connect(alice).addLiquidity(
          ethers.parseEther("100"),
          ethers.parseEther("100"),
          0,
          0,
          alice.address,
          ts - 10
        )
      ).to.be.revertedWithCustomError(pool, "DeadlineExpired");
    });

    it("Should revert when amount0Desired or amount1Desired is 0", async function () {
      const ts = await getTimestamp();
      await expect(
        pool.connect(alice).addLiquidity(
          0,
          ethers.parseEther("100"),
          0,
          0,
          alice.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "ZeroAmount");

      await expect(
        pool.connect(alice).addLiquidity(
          ethers.parseEther("100"),
          0,
          0,
          0,
          alice.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "ZeroAmount");
    });

    it("Should revert if initial liquidity is too small (<= MINIMUM_LIQUIDITY)", async function () {
      const ts = await getTimestamp();
      await expect(
        pool.connect(alice).addLiquidity(
          1000n,
          1000n,
          0,
          0,
          alice.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "InsufficientLiquidityMinted");
    });

    it("Should lock MINIMUM_LIQUIDITY (1000 shares) and mint sqrt(a0*a1) - 1000 to user", async function () {
      const amount0 = ethers.parseEther("100"); // 100 * 1e18
      const amount1 = ethers.parseEther("400"); // 400 * 1e18
      const ts = await getTimestamp();

      // expected initial shares = sqrt(100e18 * 400e18) = 200e18
      const expectedTotal = ethers.parseEther("200");
      const expectedUser = expectedTotal - 1000n;

      const tx = await pool.connect(alice).addLiquidity(
        amount0,
        amount1,
        amount0,
        amount1,
        alice.address,
        ts + ONE_DAY
      );

      await expect(tx)
        .to.emit(pool, "Mint")
        .withArgs(alice.address, alice.address, amount0, amount1, expectedUser);

      expect(await pool.balanceOf(alice.address)).to.equal(expectedUser);
      expect(await pool.balanceOf("0x000000000000000000000000000000000000dEaD")).to.equal(1000n);
      expect(await pool.totalSupply()).to.equal(expectedTotal);

      const [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(amount0);
      expect(r1).to.equal(amount1);
    });
  });

  describe("3. Subsequent Proportional Liquidity Provision", function () {
    beforeEach(async function () {
      const ts = await getTimestamp();
      // Alice initializes pool with 1000 token0 and 2000 token1 (ratio 1 : 2)
      await pool.connect(alice).addLiquidity(
        ethers.parseEther("1000"),
        ethers.parseEther("2000"),
        0,
        0,
        alice.address,
        ts + ONE_DAY
      );
    });

    it("Should correctly balance proportional deposits", async function () {
      const ts = await getTimestamp();
      // Bob deposits 500 token0 and 1500 token1. Since ratio is 1:2, optimal token1 is 1000.
      const tx = await pool.connect(bob).addLiquidity(
        ethers.parseEther("500"),
        ethers.parseEther("1500"),
        ethers.parseEther("500"),
        ethers.parseEther("1000"),
        bob.address,
        ts + ONE_DAY
      );

      // Verify reserves: 1000 + 500 = 1500 token0, 2000 + 1000 = 3000 token1
      const [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(ethers.parseEther("1500"));
      expect(r1).to.equal(ethers.parseEther("3000"));

      // Bob should have deposited exactly 500 and 1000
      await expect(tx)
        .to.emit(pool, "Mint")
        .withArgs(bob.address, bob.address, ethers.parseEther("500"), ethers.parseEther("1000"), (shares) => shares > 0n);
    });

    it("Should revert if slippage tolerance amountMin is not met", async function () {
      const ts = await getTimestamp();
      // Optimal token1 is 1000, but bob demands at least 1200
      await expect(
        pool.connect(bob).addLiquidity(
          ethers.parseEther("500"),
          ethers.parseEther("1500"),
          ethers.parseEther("500"),
          ethers.parseEther("1200"),
          bob.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "InsufficientToken1Amount");
    });
  });

  describe("4. Liquidity Removal & Accounting", function () {
    beforeEach(async function () {
      const ts = await getTimestamp();
      await pool.connect(alice).addLiquidity(
        ethers.parseEther("1000"),
        ethers.parseEther("2000"),
        0,
        0,
        alice.address,
        ts + ONE_DAY
      );
    });

    it("Should proportionally return underlying tokens and burn shares", async function () {
      const aliceShares = await pool.balanceOf(alice.address);
      const halfShares = aliceShares / 2n;

      const preBalance0 = await token0.balanceOf(alice.address);
      const preBalance1 = await token1.balanceOf(alice.address);
      const ts = await getTimestamp();

      const tx = await pool.connect(alice).removeLiquidity(
        halfShares,
        0,
        0,
        alice.address,
        ts + ONE_DAY
      );

      await expect(tx).to.emit(pool, "Burn");

      const postBalance0 = await token0.balanceOf(alice.address);
      const postBalance1 = await token1.balanceOf(alice.address);

      // Alice should receive ~500 token0 and ~1000 token1 (minus 1000 dead share proportion)
      expect(postBalance0 - preBalance0).to.be.closeTo(ethers.parseEther("500"), ethers.parseEther("0.001"));
      expect(postBalance1 - preBalance1).to.be.closeTo(ethers.parseEther("1000"), ethers.parseEther("0.001"));
    });

    it("Should revert removeLiquidity if returned tokens are less than min amounts", async function () {
      const aliceShares = await pool.balanceOf(alice.address);
      const ts = await getTimestamp();

      await expect(
        pool.connect(alice).removeLiquidity(
          aliceShares / 2n,
          ethers.parseEther("600"), // wants 600, only entitled to ~500
          0,
          alice.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "InsufficientToken0Amount");
    });

    it("Should revert removeLiquidity when caller has insufficient shares", async function () {
      const ts = await getTimestamp();
      await expect(
        pool.connect(bob).removeLiquidity(
          ethers.parseEther("100"),
          0,
          0,
          bob.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "ERC20InsufficientBalance");
    });
  });

  describe("5. Token Swaps & AMM Constant-Product Math", function () {
    const RESERVE0 = ethers.parseEther("10000"); // 10,000 token0
    const RESERVE1 = ethers.parseEther("20000"); // 20,000 token1

    beforeEach(async function () {
      const ts = await getTimestamp();
      await pool.connect(alice).addLiquidity(
        RESERVE0,
        RESERVE1,
        0,
        0,
        alice.address,
        ts + ONE_DAY
      );
    });

    it("Should calculate expected output with 0.30% fee correctly via getAmountOut", async function () {
      const amountIn = ethers.parseEther("100");
      // formula: amountInWithFee = 100 * 9970 = 997,000
      // numerator = 997,000 * 20,000 = 19,940,000,000
      // denominator = (10,000 * 10,000) + 997,000 = 100,000,000 + 997,000 = 100,997,000
      // amountOut = 19,940,000,000 / 100,997,000 = ~197.431597 token1
      const expectedOut = (amountIn * 9970n * RESERVE1) / ((RESERVE0 * 10000n) + (amountIn * 9970n));

      const quotedOut = await pool.getAmountOut(await token0.getAddress(), amountIn);
      expect(quotedOut).to.equal(expectedOut);
    });

    it("Should execute swap token0 -> token1 and transfer output to recipient", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedOut = await pool.getAmountOut(await token0.getAddress(), amountIn);

      const bobPreT1 = await token1.balanceOf(bob.address);
      const ts = await getTimestamp();

      const tx = await pool.connect(bob).swap(
        await token0.getAddress(),
        amountIn,
        expectedOut,
        bob.address,
        ts + ONE_DAY
      );

      await expect(tx)
        .to.emit(pool, "Swap")
        .withArgs(bob.address, bob.address, await token0.getAddress(), amountIn, expectedOut);

      const bobPostT1 = await token1.balanceOf(bob.address);
      expect(bobPostT1 - bobPreT1).to.equal(expectedOut);

      const [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(RESERVE0 + amountIn);
      expect(r1).to.equal(RESERVE1 - expectedOut);
    });

    it("Should execute swap token1 -> token0 in reverse direction", async function () {
      const amountIn = ethers.parseEther("200");
      const expectedOut = await pool.getAmountOut(await token1.getAddress(), amountIn);

      const bobPreT0 = await token0.balanceOf(bob.address);
      const ts = await getTimestamp();

      await pool.connect(bob).swap(
        await token1.getAddress(),
        amountIn,
        expectedOut,
        bob.address,
        ts + ONE_DAY
      );

      const bobPostT0 = await token0.balanceOf(bob.address);
      expect(bobPostT0 - bobPreT0).to.equal(expectedOut);

      const [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(RESERVE0 - expectedOut);
      expect(r1).to.equal(RESERVE1 + amountIn);
    });

    it("Should revert if output amount is less than amountOutMin (slippage protection)", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedOut = await pool.getAmountOut(await token0.getAddress(), amountIn);
      const ts = await getTimestamp();

      // Bob specifies minimum 1 wei higher than actual output
      await expect(
        pool.connect(bob).swap(
          await token0.getAddress(),
          amountIn,
          expectedOut + 1n,
          bob.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "InsufficientOutputAmount");
    });

    it("Should revert on expired deadline", async function () {
      const amountIn = ethers.parseEther("100");
      const ts = await getTimestamp();

      await expect(
        pool.connect(bob).swap(
          await token0.getAddress(),
          amountIn,
          0,
          bob.address,
          ts - 1
        )
      ).to.be.revertedWithCustomError(pool, "DeadlineExpired");
    });

    it("Should revert on invalid tokenIn", async function () {
      const ts = await getTimestamp();
      await expect(
        pool.connect(bob).swap(
          alice.address,
          ethers.parseEther("10"),
          0,
          bob.address,
          ts + ONE_DAY
        )
      ).to.be.revertedWithCustomError(pool, "InvalidToken");
    });
  });

  describe("6. Invariant & Safety Properties", function () {
    it("Invariant: k increases over consecutive swaps due to 0.30% retained fee", async function () {
      const ts = await getTimestamp();
      await pool.connect(alice).addLiquidity(
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        0,
        0,
        alice.address,
        ts + ONE_DAY
      );

      let [r0, r1] = await pool.getReserves();
      const initialK = r0 * r1;

      // Perform 5 consecutive swaps back and forth
      for (let i = 0; i < 5; i++) {
        const swapIn = ethers.parseEther("50");
        const out = await pool.getAmountOut(await token0.getAddress(), swapIn);
        const currentTs = await getTimestamp();
        await pool.connect(bob).swap(await token0.getAddress(), swapIn, out, bob.address, currentTs + ONE_DAY);

        const revIn = ethers.parseEther("50");
        const revOut = await pool.getAmountOut(await token1.getAddress(), revIn);
        const currentTs2 = await getTimestamp();
        await pool.connect(bob).swap(await token1.getAddress(), revIn, revOut, bob.address, currentTs2 + ONE_DAY);
      }

      [r0, r1] = await pool.getReserves();
      const finalK = r0 * r1;

      // Due to 0.3% fee retained in the pool, k must strictly grow
      expect(finalK).to.be.greaterThan(initialK);
    });

    it("Sync: forces reserves to match actual token balances if tokens are transferred directly", async function () {
      const ts = await getTimestamp();
      await pool.connect(alice).addLiquidity(
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        alice.address,
        ts + ONE_DAY
      );

      // Direct transfer to pool contract (bypassing addLiquidity)
      await token0.connect(bob).transfer(await pool.getAddress(), ethers.parseEther("100"));

      let [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(ethers.parseEther("1000")); // reserves unchanged before sync

      await pool.sync();

      [r0, r1] = await pool.getReserves();
      expect(r0).to.equal(ethers.parseEther("1100")); // synchronized!
    });
  });
});
