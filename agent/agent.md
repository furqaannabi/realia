# Realia Verification Agent 🔍

## Overview

An autonomous AI agent that verifies image authenticity on the blockchain as part of the Realia decentralized protocol. This agent continuously monitors the Arbitrum Sepolia blockchain for verification requests and minting events, processes images using CLIP embeddings, and submits verification results on-chain.

> **🌐 Want to mint or verify images? Visit [https://realia-protocol.vercel.app/](https://realia-protocol.vercel.app/)**

## What This Agent Does

### 🎨 NFT Minting Processing
- Polls for new `Minted` events from the RealiaNFT contract
- Retrieves minted NFT images from IPFS
- Generates CLIP embeddings for each image
- Stores embeddings in Qdrant vector database

### 🔍 Image Verification
- Polls for `VerificationRequested` events from the RealiaFactory contract
- Retrieves verification images from IPFS
- Generates embeddings and compares against stored NFT database
- Calculates similarity scores using cosine distance
- Determines verification result:
  - **VERIFIED** (≥0.95): Exact match with existing NFT
  - **MODIFIED** (0.75-0.95): Similar but altered image
  - **NOT_VERIFIED** (<0.75): No match found
- Submits results to blockchain with matched token ID

### 💰 PYUSD Staking & Rewards
- Auto-registers on blockchain with 50,000 PYUSD staking requirement
- Receives PYUSD rewards for honest verification
- Risk of slashing for dishonest behavior (enforced by consensus)

### 💬 Chat Interface
- Responds to user queries about Realia protocol
- Reports verification count directly from blockchain
- Explains image verification process
- Powered by ASI1 AI model

## How It Works

### Startup Sequence
1. **Registration Check**: Verifies agent is registered on blockchain
2. **Auto-Registration**: If not registered, automatically stakes PYUSD and registers
3. **Address Update**: Updates agent address if it has changed
4. **Qdrant Setup**: Ensures vector database collection exists
5. **Polling Start**: Begins continuous monitoring of blockchain events

### Verification Flow
```
1. Event Detected → 2. Image Retrieved → 3. Embedding Generated
   ↓
4. Database Search → 5. Similarity Calculated → 6. Result Determined
   ↓
7. Transaction Submitted → 8. Rewards Distributed
```

### Consensus Mechanism
- Multiple agents verify each image independently
- Smart contract requires 5 agent confirmations
- Majority verdict determines final result
- Honest agents rewarded, dishonest agents slashed

## Technical Stack

| Component | Technology |
|-----------|-----------|
| **Agent Framework** | Fetch.ai uAgents SDK |
| **Blockchain** | Web3.py + Arbitrum Sepolia |
| **AI Model** | CLIP (via embeddings server) + ASI1 (chat) |
| **Vector DB** | Qdrant Cloud |
| **Storage** | IPFS |
| **Token** | PYUSD (ERC-20) |

## Smart Contracts

### RealiaFactory
- **Address**: `0x16db8E9910937D2D137E3d1381f833202A0CC5A4`
- **Network**: Arbitrum Sepolia
- **Explorer**: [View on Blockscout](https://arbitrum-sepolia.blockscout.com/address/0x16db8E9910937D2D137E3d1381f833202A0CC5A4)

### RealiaNFT
- **Address**: `0x05C2009C27a6D89dc3a1733B4691A60E5dB33c7F`
- **Network**: Arbitrum Sepolia
- **Explorer**: [View on Blockscout](https://arbitrum-sepolia.blockscout.com/address/0x05C2009C27a6D89dc3a1733B4691A60E5dB33c7F)

## Environment Variables Required

```bash
# Blockchain
ALCHEMY_API_KEY=your_alchemy_api_key
REALIA_FACTORY_CONTRACT_ADDRESS=0x16db8E9910937D2D137E3d1381f833202A0CC5A4
REALIA_NFT_CONTRACT_ADDRESS=0x05C2009C27a6D89dc3a1733B4691A60E5dB33c7F

# Agent Wallet
WALLET_PRIVATE_KEY=your_private_key
WALLET_SEED=your_agent_seed

# Qdrant Vector Database
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_BASE_URL=https://your-qdrant-cluster.qdrant.io

# Embeddings Service
EMBEDDING_URL=https://your-embeddings-server.com

# AI Chat (Optional)
ASI_ONE_API_KEY=your_asi_api_key
```

## Prerequisites

### 1. PYUSD Tokens
- Agent wallet needs **50,000 PYUSD** minimum for staking
- Get testnet PYUSD on Arbitrum Sepolia
- PYUSD Contract: `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`

### 2. ETH for Gas
- Agent wallet needs ETH for transaction fees on Arbitrum Sepolia
- Get testnet ETH from [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)

### 3. Qdrant Database
- Create a free account at [Qdrant Cloud](https://qdrant.tech/)
- Create a cluster and get API key
- Collection will be auto-created by agent

### 4. Embeddings Server
- Deploy the embeddings service (Python Flask + CLIP model)
- Accessible via HTTP endpoint
- Located in `/embeddings` directory of the repository

## Agent Capabilities

✅ **Autonomous Operation**: Runs 24/7 without human intervention  
✅ **Auto-Registration**: Automatically registers and stakes PYUSD  
✅ **Self-Updating**: Updates agent address if changed  
✅ **Event Polling**: Continuously monitors blockchain for events  
✅ **Image Processing**: Downloads and processes images from IPFS  
✅ **Vector Search**: Performs similarity matching in Qdrant  
✅ **On-Chain Submission**: Submits verification results to blockchain  
✅ **Gas Management**: Automatically estimates and handles gas fees  
✅ **Error Handling**: Robust error handling and logging  
✅ **Chat Interface**: Responds to user queries about Realia  

## Monitoring & Logs

The agent provides detailed logging for:
- Registration status and verification count
- Pending verification requests detected
- Embedding generation and similarity scores
- Transaction hashes and confirmation status
- Errors and exceptions with context

## Security Considerations

⚠️ **Private Key**: Never share or commit your wallet private key  
⚠️ **PYUSD Staking**: Ensure sufficient balance before running  
⚠️ **Honest Behavior**: Dishonest verification results may lead to slashing  
⚠️ **Gas Costs**: Monitor ETH balance for transaction fees  

## Deployment Options

### Option 1: Agentverse (Recommended)
1. Create account at [agentverse.ai](https://agentverse.ai/)
2. Create new agent and upload `agent.py`
3. Configure environment variables
4. Deploy and monitor via dashboard

### Option 2: Local/VPS
```bash
cd agent
pip install -r requirements.txt
python agent.py
```

### Option 3: Fetch Station
1. Install Fetch Station
2. Import agent seed
3. Run agent locally with GUI

## Links & Resources

- **Web App**: [https://realia-protocol.vercel.app/](https://realia-protocol.vercel.app/) - Mint & Verify Images
- **GitHub**: [Realia Repository](https://github.com/your-repo/realia)
- **Blockscout**: [Arbitrum Sepolia Explorer](https://arbitrum-sepolia.blockscout.com/)
- **Fetch.ai**: [Agentverse Platform](https://agentverse.ai/)
- **Qdrant**: [Vector Database](https://qdrant.tech/)
- **Documentation**: See `README.md` in repository

## Support & Contribution

Built for **ETHOnline 2025** hackathon integrating:
- 💵 **PYUSD** for payments and rewards
- 🔍 **Blockscout** for blockchain indexing
- 🤖 **Fetch.ai** for autonomous agent infrastructure

For issues, questions, or contributions, please visit the GitHub repository.

---

**⚠️ Disclaimer**: This is experimental software for educational purposes. Use at your own risk. Ensure proper security audits before production deployment.

