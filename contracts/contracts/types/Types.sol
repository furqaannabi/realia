// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

enum OrderType {
  NONE,
  MINT,
  VERIFY
}

enum VerificationResult {
  NONE,
  VERIFIED,
  MODIFIED,
  NOT_VERIFIED
}

