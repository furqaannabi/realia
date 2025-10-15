// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

interface IRealiaFactory {
  function hasOrder(address user, OrderType orderType) external view returns (bool);
  function useMintOrder(address user) external returns (bool);
  function getTopFiveAgents() external view returns (address[] memory);
  function payAgents(OrderType orderType, address[] memory agentsToPay, bool isSlash) external;
}

contract RealiaNFT is ERC721, Ownable, ERC721URIStorage, ERC721Burnable {
  uint256 public tokenId = 0;
  IRealiaFactory public immutable realiaFactory;
  
  constructor(address _realiaFactory) ERC721("Realia", "REALIA") Ownable(msg.sender) {
    realiaFactory = IRealiaFactory(_realiaFactory);
  }

  event Minted(address to, uint256 tokenId);

  function mint(address to, string memory uri) external onlyOwner {
    require(realiaFactory.hasOrder(to, OrderType.MINT), "No mint order found");
    tokenId++;
    realiaFactory.useMintOrder(to);
    _mint(to, tokenId);
    _setTokenURI(tokenId, uri);
    realiaFactory.payAgents(OrderType.MINT, realiaFactory.getTopFiveAgents(), false);
    emit Minted(to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(_tokenId);
  }
}
