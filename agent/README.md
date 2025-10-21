# Realia Agent

AI agent for the Realia NFT verification platform.

> **🌐 Want to mint or verify images? Visit [https://realia-protocol.vercel.app/](https://realia-protocol.vercel.app/)**  
> **📄 For Agentverse deployment documentation, see [`agent.md`](./agent.md)**

## Features

- 🔍 **Real-time Mint Listening** - Detects new NFT mints and creates embeddings immediately
- ✅ **Verification Processing** - Handles verification requests from the blockchain
- 🔄 **Background Sync** - Periodically syncs all NFTs to ensure no embeddings are missed
- 🤖 **Auto-Registration** - Automatically registers agent on blockchain if not already registered
- 💬 **Chat Interface** - Responds to messages with verification count and Realia information

## Environment Variables

Create a `.env` file in the `agent` directory with the following variables:

```env
# Blockchain Configuration
ALCHEMY_API_KEY=your_alchemy_api_key
REALIA_FACTORY_CONTRACT_ADDRESS=0x16db8E9910937D2D137E3d1381f833202A0CC5A4
REALIA_NFT_CONTRACT_ADDRESS=0x05C2009C27a6D89dc3a1733B4691A60E5dB33c7F
AGENT_PRIVATE_KEY=0x...  # Private key for agent wallet (needs PYUSD for staking)

# Agent Configuration
SEED=your_agent_seed

# Qdrant Configuration
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_BASE_URL=https://your-qdrant-instance.io

# Embedding Service
EMBEDDING_URL=https://your-embedding-service.com

# Chat AI
ASI_ONE_API_KEY=your_asi_api_key  # For chat functionality
```

## Requirements

### PYUSD Balance

The agent wallet **must have at least 0.05 PYUSD** (MIN_AGENT_STAKING) to register as an agent on the blockchain.

- If the wallet has insufficient PYUSD, the agent will **throw an error** and refuse to start
- Fund the wallet before starting the agent
- The PYUSD will be staked to the Realia contract upon registration

## Installation

```bash
# Install dependencies
uv pip install -r pyproject.toml

# Or using pip
pip install -r requirements.txt
```

## Running the Agent

```bash
python main.py
```

## What Happens on Startup

1. ✅ Checks if agent is registered on blockchain
2. 💰 If not registered:
   - Checks PYUSD balance
   - Throws error if insufficient balance
   - Otherwise, approves PYUSD and registers agent
3. 🔄 Initializes Qdrant collection
4. 🎧 Starts event listeners for mints and verifications
5. 🔄 Starts background sync task
6. 🚀 Agent is ready!

## Error Handling

### Insufficient PYUSD

```
❌ Cannot start agent: Insufficient PYUSD balance! Required: 0.05 PYUSD, Available: 0.0 PYUSD
Please fund the agent wallet with sufficient PYUSD and restart.
```

**Solution:** Send at least 0.05 PYUSD to the agent wallet address and restart.

## Agent Functions

### Registration Check
- Checks if agent is already registered
- Displays agent info (name, verified count)
- Auto-registers if not registered and has sufficient PYUSD

### Mint Event Listener
- Listens for `Minted` events in real-time
- Fetches token URI from blockchain
- Generates and stores embeddings immediately

### Verification Event Listener
- Listens for `VerificationRequested` events in real-time
- Fetches verification request details from blockchain
- Generates embedding for verification image
- Searches Qdrant for matching NFTs using cosine similarity
- Uses multi-tier threshold system:
  - **VERIFIED** (≥0.95): Exact match with existing NFT
  - **MODIFIED** (0.75-0.95): Similar but with modifications
  - **NOT_VERIFIED** (<0.75): No match found or too different
- Submits verification result to blockchain (VerificationResult enum + matched token ID)
- Handles errors gracefully with detailed logging

### Background Sync
- Runs every 30 seconds
- Fetches all NFTs from blockchain
- Creates missing embeddings
- Ensures data consistency

