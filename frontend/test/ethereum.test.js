import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  formatTokenAmount,
  parseTokenAmount,
  calculateSlippageMin,
  shortenAddress,
  parseContractError,
} from "../src/lib/ethereum.js";

describe("Frontend Ethereum Utilities Tests", () => {
  describe("formatTokenAmount", () => {
    test("formats 18 decimal amounts correctly", () => {
      const oneEth = ethers.parseEther("1.0");
      assert.equal(formatTokenAmount(oneEth, 18), "1.0");

      const fractionalEth = ethers.parseEther("123.456789");
      assert.equal(formatTokenAmount(fractionalEth, 18, 4), "123.4567");
    });

    test("handles zero and null inputs", () => {
      assert.equal(formatTokenAmount(0n, 18), "0.0");
      assert.equal(formatTokenAmount(null, 18), "0.0");
      assert.equal(formatTokenAmount(undefined, 18), "0.0");
    });

    test("formats 6 decimal tokens (e.g. USDC)", () => {
      const usdc = ethers.parseUnits("50000.5", 6);
      assert.equal(formatTokenAmount(usdc, 6, 2), "50000.5");
    });
  });

  describe("parseTokenAmount", () => {
    test("parses valid token string to bigint", () => {
      const parsed = parseTokenAmount("10.5", 18);
      assert.equal(parsed, ethers.parseEther("10.5"));
    });

    test("returns 0n for invalid or negative inputs", () => {
      assert.equal(parseTokenAmount("", 18), 0n);
      assert.equal(parseTokenAmount("-5", 18), 0n);
      assert.equal(parseTokenAmount("abc", 18), 0n);
    });

    test("truncates excessive decimal places without throwing", () => {
      // 20 decimal places provided for an 18-decimal token
      const parsed = parseTokenAmount("1.12345678901234567899", 18);
      assert.equal(parsed, ethers.parseUnits("1.123456789012345678", 18));
    });
  });

  describe("calculateSlippageMin", () => {
    test("calculates 0.5% slippage correctly", () => {
      const amountOut = 10000n;
      // 0.5% -> 50 basis points -> multiplier 9950 -> min 9950
      const minOut = calculateSlippageMin(amountOut, 0.5);
      assert.equal(minOut, 9950n);
    });

    test("calculates 1.0% slippage correctly", () => {
      const amountOut = 1000000n;
      // 1.0% -> 100 bps -> multiplier 9900 -> 990,000
      const minOut = calculateSlippageMin(amountOut, 1.0);
      assert.equal(minOut, 990000n);
    });

    test("returns 0n when amountOut is 0 or negative", () => {
      assert.equal(calculateSlippageMin(0n, 0.5), 0n);
    });
  });

  describe("shortenAddress", () => {
    test("truncates ethereum address properly", () => {
      const addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      assert.equal(shortenAddress(addr), "0xf39F...2266");
    });

    test("returns empty string for null", () => {
      assert.equal(shortenAddress(null), "");
    });
  });

  describe("parseContractError", () => {
    test("identifies user rejection", () => {
      const err = { code: 4001, message: "User denied transaction" };
      assert.equal(parseContractError(err), "Transaction signature rejected in wallet.");
    });

    test("identifies InsufficientOutputAmount slippage error", () => {
      const err = { data: "0x1234InsufficientOutputAmount5678" };
      assert.equal(parseContractError(err), "Slippage error: Output amount lower than minimum specified.");
    });

    test("identifies DeadlineExpired error", () => {
      const err = { data: "0xDeadlineExpired" };
      assert.equal(parseContractError(err), "Transaction deadline expired before confirmation.");
    });
  });
});
