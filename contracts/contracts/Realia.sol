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
    MINT,
    VERIFY
  }

  struct Order {
    OrderType orderType;
    uint256 amount;
    bool used;
  }

  struct Agent {
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

  function mint(address to, string memory uri) external onlyOwner {
    require(hasOrder(OrderType.MINT), "No mint order found");
    tokenId++;
    _useOrder(OrderType.MINT);
    _mint(to, tokenId);
    _setTokenURI(tokenId, uri);
    _payAgents(OrderType.MINT);
    emit Minted(to, tokenId);
  }

  function _payAgents(OrderType orderType) internal {
    uint256 amountBeforeFee = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    uint256 amountAfterFee = amountBeforeFee * (100 - PROTOCOL_FEE_PERCENTAGE) / 100;
    uint256 amountPerAgent = amountAfterFee / agentAddresses.length;
    for (uint256 i = 0; i < agentAddresses.length; i++) {
      PYUSD.transfer(agentAddresses[i], amountPerAgent);
    }
    emit AgentsPaid(amountAfterFee, amountPerAgent);
  }

  function createOrder(OrderType orderType) external {
    uint256 amount = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    PYUSD.transferFrom(msg.sender, address(this), amount);
    PYUSD.transfer(owner(), amount * PROTOCOL_FEE_PERCENTAGE / 100);
    orders[msg.sender].push(Order(orderType, amount, false));
    emit OrderCreated(msg.sender, orderType, amount);
  }

  function _useOrder(OrderType orderType) internal returns (bool) {
    uint256 amount = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    for (uint256 i = 0; i < orders[msg.sender].length; i++) {
      if (orders[msg.sender][i].orderType == orderType && orders[msg.sender][i].amount == amount && orders[msg.sender][i].used == false) {
        orders[msg.sender][i].used = true;
        return true;
      }
    }
    return false;
  }

  function hasOrder(OrderType orderType) public view returns (bool) {
    uint256 amount = orderType == OrderType.MINT ? MINT_PRICE : VERIFY_PRICE;
    for (uint256 i = 0; i < orders[msg.sender].length; i++) {
      if (orders[msg.sender][i].orderType == orderType && orders[msg.sender][i].amount == amount && orders[msg.sender][i].used == false) {
        return true;
      }
    }
    return false;
  }

  function registerAgent() external {
    PYUSD.transferFrom(msg.sender, address(this), MIN_AGENT_STAKING);
    agents[msg.sender] = Agent(0, true);
    agentAddresses.push(msg.sender);
    emit AgentRegistered(msg.sender);
  }

  function unregisterAgent() external {
    PYUSD.transfer(msg.sender, MIN_AGENT_STAKING);
    agents[msg.sender] = Agent(0, false);
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
    agents[agent] = Agent(0, false);
    for (uint256 i = 0; i < agentAddresses.length; i++) {
      if (agentAddresses[i] == agent) {
        agentAddresses[i] = agentAddresses[agentAddresses.length - 1];
        agentAddresses.pop();
        break;
      }
    }
    emit Slashed(agent);
  }

  function requestVerification(string memory uri) external {
    require(hasOrder(OrderType.VERIFY), "No verify order found");
    _useOrder(OrderType.VERIFY);
    verificationId++;
    verificationRequests[verificationId] = VerificationRequest(msg.sender, uri, false, block.timestamp);
    emit VerificationRequested(msg.sender, verificationId);
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
    uint256 uniqueCount = 0;
    
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
          PYUSD.transfer(responses[i].agent, VERIFY_PRICE / REQUIRED_VERIFICATIONS);
        }
      }
    } else {
      for (uint256 i = 0; i < responses.length; i++) {
        if (responses[i].verified) {
          _slashAgent(responses[i].agent);
        } else {
          agents[responses[i].agent].verifiedCount++;
          PYUSD.transfer(responses[i].agent, VERIFY_PRICE / REQUIRED_VERIFICATIONS);
        }
      }
    }
    
    verificationRequests[requestId].processed = true;
    _payAgents(OrderType.VERIFY);
    emit ProcessedVerification(requestId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(_tokenId);
  }
}
