// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

import {PoolPilotPool} from "../src/PoolPilotPool.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract DeployScript {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external {
        vm.startBroadcast();

        MockERC20 usdc = new MockERC20("USD Coin (Mock)", "USDC", 18);
        MockERC20 weth = new MockERC20("Wrapped Ether (Mock)", "WETH", 18);

        PoolPilotPool pool = new PoolPilotPool(address(usdc), address(weth));

        vm.stopBroadcast();
    }
}
