// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Realia is ERC721, Ownable, ERC721URIStorage, ERC721Burnable {
  uint256 constant MINT_PRICE = 1e6;
  uint256 constant VERIFY_PRICE = 5e4;
  uint256 constant MIN_AGENT_STAKING = 5e4;
  uint256 constant PROTOCOL_FEE_PERCENTAGE = 10;
  uint256 constant REQUIRED_VERIFICATIONS = 5;
  IERC20 public constant PYUSD = IERC20(0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1);
  uint256 public tokenId = 0;
  uint256 public verificationId = 0;

  enum OrderType {
    NONE,
    MINT,
    VERIFY
  }

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
    bool verified;
    uint256 tokenId;
    uint256 responseTime;
  }

  mapping(address => Agent) public agents;
  address[] public agentAddresses;
  mapping(uint256 => VerificationRequest) public verificationRequests;
  mapping(uint256 => VerificationResponse[]) public verificationResponses;
  mapping(address => Order[]) public orders;
  constructor() ERC721("Realia", "REALIA") Ownable(msg.sender) {}

  event Minted(address to, uint256 tokenId);
  event Verified(address to, uint256 tokenId);
  event OrderCreated(address to, OrderType orderType, uint256 amount);
  event VerificationRequested(address user, uint256 requestId);
  event VerificationResponseByAgent(address agent, uint256 requestId, bool verified);
  event Slashed(address agent);
  event ProcessedVerification(uint256 requestId);
  event AgentRegistered(address agent);
  event AgentUnregistered(address agent);
  event AgentsPaid(uint256 amount, uint256 amountPerAgent);
  event OrderCancelled(address to, OrderType orderType, uint256 amount);
  function mint(address to, string memory uri) external onlyOwner {
    require(hasOrder(to, OrderType.MINT), "No mint order found");
    tokenId++;
    _useOrder(OrderType.MINT);
    _mint(to, tokenId);
    _setTokenURI(tokenId, uri);
    _payAgents(OrderType.MINT, getTopFiveAgents(), false);
    emit Minted(to, tokenId);
  }

  function _payAgents(OrderType orderType, address[] memory agentsToPay, bool isSlash) internal {
    uint256 amountBeforeFee;
    if (isSlash) {
      amountBeforeFee = MIN_AGENT_STAKING;
    } else {
      amountBeforeFee = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    }
    uint256 amountAfterFee = amountBeforeFee * (100 - PROTOCOL_FEE_PERCENTAGE) / 100;
    uint256 agentsToPayCount = 0;
    for (uint256 i = 0; i < agentsToPay.length; i++) {
      if (agents[agentsToPay[i]].isStaked) {
        agentsToPayCount++;
      }
    }
    
    if (agentsToPayCount == 0) {
      PYUSD.transfer(owner(), amountAfterFee);
      emit AgentsPaid(amountAfterFee, 0);
      return;
    }
    
    uint256 amountPerAgent = amountAfterFee / agentsToPayCount;
    for (uint256 i = 0; i < agentsToPay.length; i++) {
      if (agents[agentsToPay[i]].isStaked) {
        PYUSD.transfer(agentsToPay[i], amountPerAgent);
      }
    }
    emit AgentsPaid(amountAfterFee, amountPerAgent);
  }

  function getTopFiveAgents() public view returns (address[] memory) {
    uint256 count = agentAddresses.length < 5 ? agentAddresses.length : 5;
    address[] memory topFiveAgents = new address[](count);
    uint256[] memory topCounts = new uint256[](count);
    
    for (uint256 i = 0; i < agentAddresses.length; i++) {
      if (!agents[agentAddresses[i]].isStaked) continue;
      
      uint256 agentCount = agents[agentAddresses[i]].verifiedCount;
      
      for (uint256 j = 0; j < count; j++) {
        if (topFiveAgents[j] == address(0) || agentCount > topCounts[j]) {
          for (uint256 k = count - 1; k > j; k--) {
            topFiveAgents[k] = topFiveAgents[k - 1];
            topCounts[k] = topCounts[k - 1];
          }
          topFiveAgents[j] = agentAddresses[i];
          topCounts[j] = agentCount;
          break;
        }
      }
    }
    return topFiveAgents;
  }

  function createOrder(OrderType orderType) external {
    require(!hasOrder(msg.sender, orderType), "User already has an order");
    require(orderType != OrderType.NONE, "Invalid order type");
    uint256 amount = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    PYUSD.transferFrom(msg.sender, address(this), amount);
    orders[msg.sender].push(Order(orderType, amount, false, false));
    emit OrderCreated(msg.sender, orderType, amount);
  }

  function cancelOrder(OrderType orderType) external {
    require(hasOrder(msg.sender, orderType), "User does not have an order");
    require(orderType != OrderType.NONE, "Invalid order type");
    uint256 amount = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    PYUSD.transfer(msg.sender, amount);
    for (uint256 i = 0; i < orders[msg.sender].length; i++) {
      if (orders[msg.sender][i].orderType == orderType) {
        orders[msg.sender][i].cancelled = true;
        break;
      }
    }
    emit OrderCancelled(msg.sender, orderType, amount);
  }

  function _useOrder(OrderType orderType) internal returns (bool) {
    for (uint256 i = 0; i < orders[msg.sender].length; i++) {
      Order memory order = orders[msg.sender][i];
      if (order.orderType == orderType && order.used == false && order.cancelled == false) {
        orders[msg.sender][i].used = true;
        PYUSD.transfer(owner(), order.amount * PROTOCOL_FEE_PERCENTAGE / 100);
        return true;
      }
    }
    return false;
  }

  function hasOrder(address user, OrderType orderType) public view returns (bool) { 
    require(orderType != OrderType.NONE, "Invalid order type");
    for (uint256 i = 0; i < orders[user].length; i++) {
      Order memory order = orders[user][i];
      if (order.orderType == orderType && order.used == false && order.cancelled == false) {
        return true;
      }
    }
    return false;
  }

  function registerAgent(string calldata agentAddress) external {
    PYUSD.transferFrom(msg.sender, address(this), MIN_AGENT_STAKING);
    agents[msg.sender] = Agent(agentAddress, msg.sender, 0, true);
    agentAddresses.push(msg.sender);
    emit AgentRegistered(msg.sender);
  }

  function unregisterAgent() external {
    PYUSD.transfer(msg.sender, MIN_AGENT_STAKING);
    delete agents[msg.sender];
    for (uint256 i = 0; i < agentAddresses.length; i++) {
      if (agentAddresses[i] == msg.sender) {
        agentAddresses[i] = agentAddresses[agentAddresses.length - 1];
        agentAddresses.pop();
        break;
      }
    }
    emit AgentUnregistered(msg.sender);
  }

  function _slashAgent(address agent) internal {
    PYUSD.transfer(owner(), MIN_AGENT_STAKING * PROTOCOL_FEE_PERCENTAGE / 100);
    _payAgents(OrderType.VERIFY, getTopFiveAgents(), true);
    delete agents[agent];
    for (uint256 i = 0; i < agentAddresses.length; i++) {
           if (agentAddresses[i] == agent) {
        agentAddresses[i] = agentAddresses[agentAddresses.length - 1];
        agentAddresses.pop();
        break;
      }
    }
    emit Slashed(agent);
  }

  function requestVerification(address user, string memory uri) external onlyOwner {
    require(hasOrder(user, OrderType.VERIFY), "No verify order found");
    _useOrder(OrderType.VERIFY);
    verificationId++;
    verificationRequests[verificationId] = VerificationRequest(user, uri, false, block.timestamp);
    emit VerificationRequested(user, verificationId);
  }

  function responseVerification(uint256 requestId, bool verified, uint256 propertyTokenId) external {
    require(agents[msg.sender].isStaked, "Agent is not staked");
    require(verificationRequests[requestId].processed == false, "Request is already processed");
    verificationResponses[requestId].push(VerificationResponse(msg.sender, verified, propertyTokenId, block.timestamp));
    emit VerificationResponseByAgent(msg.sender, requestId, verified);
    if (verificationResponses[requestId].length >= REQUIRED_VERIFICATIONS) {
      _processVerification(requestId);
    }
  }


  function _processVerification(uint256 requestId) internal {
    require(verificationRequests[requestId].processed == false, "Request is already processed");
    
    VerificationResponse[] memory responses = verificationResponses[requestId];
    uint256 verifiedCount = 0;
    
    uint256[] memory uniqueTokenIds = new uint256[](responses.length);
    uint256[] memory voteCounts = new uint256[](responses.length);
    address[] memory agentsToPay = new address[](responses.length);
    uint256 uniqueCount = 0;
    uint256 agentsToPayCount = 0;
    
    for (uint256 i = 0; i < responses.length; i++) {
      if (responses[i].verified) {
        verifiedCount++;
        
        bool found = false;
        for (uint256 j = 0; j < uniqueCount; j++) {
          if (uniqueTokenIds[j] == responses[i].tokenId) {
            voteCounts[j]++;
            found = true;
            break;
          }
        }
        if (!found) {
          uniqueTokenIds[uniqueCount] = responses[i].tokenId;
          voteCounts[uniqueCount] = 1;
          uniqueCount++;
        }
      }
    }
    
    bool isVerified = verifiedCount > (REQUIRED_VERIFICATIONS / 2);
    
    if (isVerified) {
      uint256 mostVotedTokenId = 0;
      uint256 maxVotes = 0;
      
      for (uint256 i = 0; i < uniqueCount; i++) {
        if (voteCounts[i] > maxVotes) {
          maxVotes = voteCounts[i];
          mostVotedTokenId = uniqueTokenIds[i];
        }
      }
      
      emit Verified(verificationRequests[requestId].user, mostVotedTokenId);
      
      for (uint256 i = 0; i < responses.length; i++) {
        if (!responses[i].verified || responses[i].tokenId != mostVotedTokenId) {
          _slashAgent(responses[i].agent);
        } else {
          agents[responses[i].agent].verifiedCount++;
          agentsToPay[agentsToPayCount] = responses[i].agent;
          agentsToPayCount++;
        }
      }
    } else {
      for (uint256 i = 0; i < responses.length; i++) {
        if (responses[i].verified) {
          _slashAgent(responses[i].agent);
        } else {
          agents[responses[i].agent].verifiedCount++;
          agentsToPay[agentsToPayCount] = responses[i].agent;
          agentsToPayCount++;
        }
      }
    }
    
    verificationRequests[requestId].processed = true;
    _payAgents(OrderType.VERIFY, agentsToPay, false);
    emit ProcessedVerification(requestId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(_tokenId);
  }

  /**
   * @dev Sync function for agents to get NFT count and NFT data
   * @return totalCount The total number of NFTs minted
   * @return nftIds Array of all NFT token IDs
   * @return nftUris Array of all NFT URIs corresponding to the token IDs
   */
  function syncAgent() external view returns (uint256 totalCount, uint256[] memory nftIds, string[] memory nftUris) {
    totalCount = tokenId;
    nftIds = new uint256[](totalCount);
    nftUris = new string[](totalCount);
    
    for (uint256 i = 1; i <= totalCount; i++) {
      nftIds[i - 1] = i;
      nftUris[i - 1] = tokenURI(i);
    }
    
    return (totalCount, nftIds, nftUris);
  }
}
