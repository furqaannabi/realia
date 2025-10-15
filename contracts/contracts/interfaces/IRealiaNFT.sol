// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRealiaNFT {
  function tokenId() external view returns (uint256);
  function tokenURI(uint256 tokenId) external view returns (string memory);
}

