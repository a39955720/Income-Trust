// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Script} from "forge-std/Script.sol";
import {IncomeTrust} from "../src/IncomeTrust.sol";

contract DeployIncomeTrust is Script {
    uint256 public DEFAULT_ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external returns (IncomeTrust) {
        if (block.chainid == 97) {
            vm.startBroadcast();
            IncomeTrust incomeTrust = new IncomeTrust();
            vm.stopBroadcast();
            return incomeTrust;
        } else {
            vm.startBroadcast(DEFAULT_ANVIL_PRIVATE_KEY);
            IncomeTrust incomeTrust = new IncomeTrust();
            vm.stopBroadcast();
            return incomeTrust;
        }
    }
}
