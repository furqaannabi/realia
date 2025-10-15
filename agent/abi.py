"""
ABI definitions for Realia smart contracts
"""

# VerificationResult enum values (matching the Solidity enum)
class VerificationResult:
    NONE = 0
    VERIFIED = 1
    MODIFIED = 2
    NOT_VERIFIED = 3

# OrderType enum values (matching the Solidity enum)
class OrderType:
    NONE = 0
    MINT = 1
    VERIFY = 2

# RealiaFactory ABI - contains only the functions/events used by the agent
REALIA_FACTORY_ABI = [
    {"anonymous": False, "inputs": [{"indexed": False, "internalType": "address", "name": "user", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "requestId", "type": "uint256"}], "name": "VerificationRequested", "type": "event"},
    {"anonymous": False, "inputs": [{"indexed": False, "internalType": "address", "name": "agent", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "requestId", "type": "uint256"}, {"indexed": False, "internalType": "bool", "name": "verified", "type": "bool"}], "name": "VerificationResponseByAgent", "type": "event"},
    {"anonymous": False, "inputs": [{"indexed": False, "internalType": "address", "name": "agent", "type": "address"}], "name": "AgentRegistered", "type": "event"},
    {"anonymous": False, "inputs": [{"indexed": False, "internalType": "address", "name": "agent", "type": "address"}, {"indexed": False, "internalType": "string", "name": "agentAddress", "type": "string"}], "name": "AgentAddressUpdated", "type": "event"},
    {"inputs": [], "name": "MIN_AGENT_STAKING", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "PYUSD", "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "agents", "outputs": [{"internalType": "string", "name": "agentAddress", "type": "string"}, {"internalType": "address", "name": "evmAddress", "type": "address"}, {"internalType": "uint256", "name": "verifiedCount", "type": "uint256"}, {"internalType": "bool", "name": "isStaked", "type": "bool"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "agentAddress", "type": "string"}], "name": "registerAgent", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "agentAddress", "type": "string"}], "name": "updateAgentAddress", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "verificationRequests", "outputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "string", "name": "uri", "type": "string"}, {"internalType": "bool", "name": "processed", "type": "bool"}, {"internalType": "uint256", "name": "requestTime", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "requestId", "type": "uint256"}, {"internalType": "enum VerificationResult", "name": "result", "type": "uint8"}, {"internalType": "uint256", "name": "propertyTokenId", "type": "uint256"}], "name": "responseVerification", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [], "name": "syncAgent", "outputs": [{"internalType": "uint256", "name": "totalCount", "type": "uint256"}, {"internalType": "uint256[]", "name": "nftIds", "type": "uint256[]"}, {"internalType": "string[]", "name": "nftUris", "type": "string[]"}], "stateMutability": "view", "type": "function"}
]

# RealiaNFT ABI - contains only the functions/events used by the agent
REALIA_NFT_ABI = [
    {"anonymous": False, "inputs": [{"indexed": False, "internalType": "address", "name": "to", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "Minted", "type": "event"},
    {"inputs": [{"internalType": "uint256", "name": "_tokenId", "type": "uint256"}], "name": "tokenURI", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "tokenId", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}
]

# ERC20 ABI for PYUSD token interactions
ERC20_ABI = [
    {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}
]

# Legacy compatibility - for code that uses REALIA_ABI
REALIA_ABI = REALIA_FACTORY_ABI
