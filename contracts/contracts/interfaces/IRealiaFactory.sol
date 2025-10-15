// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OrderType} from "../types/Types.sol";

interface IRealiaFactory {
  function hasOrder(address user, OrderType orderType) external view returns (bool);
  function useMintOrder(address user) external returns (bool);
  function getTopFiveAgents() external view returns (address[] memory);
  function payAgentsForMint(address[] memory agentsToPay) external;
}

