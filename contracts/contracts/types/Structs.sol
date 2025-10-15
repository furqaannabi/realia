// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OrderType, VerificationResult} from "./Types.sol";

struct Order {
  OrderType orderType;
  uint256 amount;
  bool used;
  bool cancelled;
}

struct Agent {
  string agentAddress;
  address evmAddress;
  uint256 verifiedCount;
  bool isStaked;
}

struct VerificationRequest {
  address user;
  string uri;
  bool processed;
  uint256 requestTime;
}

struct VerificationResponse {
  address agent;
  VerificationResult result;
  uint256 tokenId;
  uint256 responseTime;
}

