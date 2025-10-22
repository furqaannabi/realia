# Realia - Decentralized Image Authenticity Protocol

> **Proving Image Authenticity in the Age of AI**

Realia is a decentralized protocol that verifies whether an image is real, AI-generated, or modified. It provides on-chain proofs of authenticity linked to NFTs using hybrid on-chain and off-chain computation.

> **🌐 Try it now: [https://realia-protocol.vercel.app/](https://realia-protocol.vercel.app/)**

Built for **ETHOnline 2025** integrating:
- 💵 **PYUSD** for payments, staking, and rewards
- 🔍 **Blockscout** for blockchain data indexing and verification dashboards
- 🤖 **Fetch.ai Agents (ASI Layer)** for decentralized AI verification and autonomous compute

---

## 🏗️ Architecture

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────────┐
│   Frontend   │ ◄─────► │  Backend (EC2)  │         │  Arbitrum Sepolia│
│  (Next.js)   │         │  Node.js + API  │ ◄─────► │   Smart Contracts│
└──────────────┘         └────────┬────────┘         └────────┬─────────┘
                                  │                            │
                                  ▼                            │
                         ┌─────────────────┐                  │
                         │ Embeddings (EC2)│                  │
                         │   CLIP Model    │                  │
                         └────────┬────────┘                  │
                                  │                            │
                                  ▼                            ▼
                         ┌──────────────┐          ┌──────────────────┐
                         │  IPFS/S3     │          │   Blockscout     │
                         │  (Storage)   │          │   (Explorer)     │
                         └──────────────┘          └──────────────────┘
                                                             ▲
                                                             │
                         ┌───────────────────────────────────┘
                         │
                  ┌──────▼────────┐          ┌──────────────┐
                  │  Fetch.ai     │ ◄─────► │   Qdrant DB  │
                  │  Agentverse   │          │  (Vectors)   │
                  │  (AI Agents)  │          │ (per agent)  │
                  └───────────────┘          └──────────────┘
```

### Infrastructure
- **Backend & Embeddings Server**: Hosted on AWS EC2
- **Agents**: Deployed on Fetch.ai Agentverse (24/7 autonomous operation)
- **Blockchain**: Arbitrum Sepolia testnet
- **Storage**: IPFS for images, S3 for backup storage
- **Vector Database**: Qdrant Cloud (each agent maintains their own DB)

---

## 💰 Configuration

### Current (Hackathon Demo)
- **REQUIRED_VERIFICATIONS**: 2 agents
- **MINT_PRICE**: 1 PYUSD
- **VERIFY_PRICE**: 0.05 PYUSD
- **MIN_AGENT_STAKING**: 0.05 PYUSD

### Post-Hackathon Production Values
- **REQUIRED_VERIFICATIONS**: 5 agents
- **MINT_PRICE**: 5 PYUSD
- **VERIFY_PRICE**: 0.5 PYUSD
- **MIN_AGENT_STAKING**: 500 PYUSD

---

## ✨ Features

### 🔐 NFT-Based Authenticity
- Mint authenticity NFTs for verified images
- On-chain proof of ownership and verification history
- Immutable record of image fingerprints

### 🤖 Decentralized AI Verification
- Multiple autonomous Fetch.ai agents verify each image
- Consensus-based verification (requires 2 agent confirmations for demo, 5 post-hackathon)
- AI agents stake PYUSD and get rewarded for honest work
- Dishonest agents are automatically slashed

### 💰 PYUSD Economy
- Users pay PYUSD fees: 1 PYUSD for minting, 0.05 PYUSD for verification (demo values)
- Agents stake PYUSD to participate (0.05 PYUSD for demo, 500 PYUSD post-hackathon)
- Rewards distributed automatically to honest verifiers
- Protocol fee for sustainability (10%)

### 🔍 Transparent Proofs
- All transactions indexed on Blockscout
- Public verification history
- Real-time proof explorer

---

## 📦 Repository Structure

```
realia/
├── frontend/           # Next.js + Wagmi + RainbowKit UI
├── backend/           # Node.js + Express backend API
├── contracts/         # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── RealiaFactory.sol    # Main verification logic
│   │   ├── RealiaNFT.sol        # ERC-721 NFT contract
│   │   ├── interfaces/          # Contract interfaces
│   │   └── types/               # Enums and structs
├── agent/             # Fetch.ai verification agents (Python)
├── embeddings/        # AWS embedding service (Python)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Python 3.11+
- Arbitrum Sepolia testnet access
- PYUSD tokens on Arbitrum Sepolia

### 1️⃣ Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### 2️⃣ Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

### 3️⃣ Backend (Deployed on AWS EC2)

```bash
cd backend
npm install
npm run dev
```

API runs on `http://localhost:3001` (or EC2 public IP in production)

**Production**: Backend is deployed on AWS EC2 for 24/7 availability

### 4️⃣ Embedding Service (Deployed on AWS EC2)

```bash
cd embeddings
pip install -r requirements.txt
python main.py
```

Embedding service runs on `http://localhost:8000` (or EC2 endpoint in production)

**Production**: Embeddings server is deployed on AWS EC2 alongside the backend

### 5️⃣ Fetch.ai Agents (Deployed on Agentverse)

```bash
cd agent
pip install -r pyproject.toml

# Setup environment (see Environment Setup section)
cp .env.sample .env
# Update .env with your configuration

# Run locally for testing
python agent_local.py

# Deploy to Agentverse for production (see agent/README.md)
```

**Production**: Agents are deployed on Fetch.ai Agentverse for:
- 24/7 autonomous operation
- Continuous polling for blockchain events (`Minted` and `VerificationRequested`)
- Automatic verification processing
- Independent Qdrant database management per agent

---

## 🔧 Environment Setup

Each component requires environment variables. Use the provided `.env.sample` files as templates:

### Frontend
```bash
cd frontend
cp .env.sample .env
# Update the .env file with your configuration
```

### Backend
```bash
cd backend
cp .env.sample .env
# Update the .env file with your configuration
```

### Agent
```bash
cd agent
cp .env.sample .env
# Update the .env file with your configuration
```

**Note**: The embeddings service does not require environment variables.

---

## 📊 How It Works

### 🎨 Mint Flow

![Mint Flow Diagram](Diagram%20of%20Mint.png)

1. **User Creates Order & Pays**
   - User creates a mint order in the smart contract
   - Pays PYUSD fee to the contract
   - Receives order confirmation on-chain

2. **Image Upload & Backend Verification**
   - User uploads image to backend (EC2)
   - Backend verifies the image is new (not previously minted)
   - Backend checks image is not AI-generated
   - Image passes authenticity checks

3. **NFT Minting**
   - Backend mints NFT on Arbitrum Sepolia
   - NFT metadata and image stored on IPFS/S3
   - `Minted` event emitted on blockchain

4. **Agent Processing**
   - All Fetch.ai agents on Agentverse polling for new `Minted` events
   - Each agent detects the new mint
   - Agents retrieve image from IPFS
   - Generate CLIP embedding via embeddings server (EC2)
   - Store embedding in their respective Qdrant databases
   - Each agent maintains independent vector database

---

### 🔍 Verification Flow

![Verification Flow Diagram](Diagram%20of%20Verification.png)

1. **User Creates Verification Order & Pays**
   - User creates verification order in smart contract
   - Pays PYUSD verification fee
   - Order recorded on-chain

2. **Image Upload & IPFS Storage**
   - User uploads image to backend (EC2)
   - Backend submits image to IPFS for decentralized storage
   - Image URI saved for agent retrieval

3. **Verification Request**
   - Backend calls `requestVerification()` on smart contract
   - `VerificationRequested` event emitted
   - Request includes order ID and image URI

4. **Agent Verification Process**
   - All agents on Agentverse polling for `VerificationRequested` events
   - Each agent retrieves image from IPFS using the URI
   - Generate embedding via embeddings server (EC2)
   - Compare embedding against their Qdrant database
   - Calculate similarity score with existing NFT embeddings

5. **Similarity-Based Results**
   - **Score ≥ 0.95**: VERIFIED (exact match with existing NFT)
   - **Score 0.75-0.95**: MODIFIED (similar but altered)
   - **Score < 0.75**: NOT_VERIFIED (no match found)

6. **On-Chain Submission**
   - Each agent posts verification result to blockchain
   - Result includes similarity score and verification status
   - Multiple agents create consensus

7. **Consensus & Rewards**
   - Smart contract collects results from multiple agents (requires 2 for demo, 5 post-hackathon)
   - Determines majority verdict
   - Rewards honest agents with PYUSD
   - Slashes dishonest/outlier agents
   - Final verification status recorded on-chain

8. **Proof & Transparency**
   - Blockscout indexes all events and transactions
   - Frontend displays verification history
   - Users can view all agent responses and similarity scores

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Arbitrum Sepolia | Smart contract deployment | Blockscout Autoscout |
| **Smart Contracts** | Solidity + Hardhat + OpenZeppelin | NFT minting & verification logic |
| **Payments** | PYUSD (ERC-20) | Staking, fees, rewards |
| **Frontend** | Next.js + TypeScript + Wagmi + RainbowKit | User interface |
| **Backend** | Node.js + Express + Prisma (AWS EC2) | API & database |
| **AI Agents** | Fetch.ai uAgents SDK (Python) | Autonomous verification |
| **Agent Hosting** | Fetch.ai Agentverse | 24/7 agent uptime & polling |
| **AI/ML** | CLIP Model + Sentence Transformers | Image embeddings |
| **Embeddings** | Python Flask (AWS EC2) | Embedding generation service |
| **Vector DB** | Qdrant Cloud | NFT embedding storage (per agent) |
| **Explorer** | Blockscout | Transaction & event indexing |
| **Storage** | AWS S3 + IPFS | Image & metadata storage |

---

## 📝 Smart Contracts

### RealiaFactory.sol
Main protocol contract handling:
- Agent registration and staking (0.05 PYUSD for demo, 500 PYUSD post-hackathon)
- Order management (Mint/Verify)
- Verification requests and responses
- Consensus mechanism (2 required verifications for demo, 5 post-hackathon)
- PYUSD reward distribution
- Agent slashing for dishonest behavior

**Deployed Address**: [`0x49183a04032446c70bD520dcF2A25e8cBD15eAB4`](https://arbitrum-realia.cloud.blockscout.com/address/0x49183a04032446c70bD520dcF2A25e8cBD15eAB4)

### RealiaNFT.sol
ERC-721 NFT contract for:
- Minting authenticity NFTs
- Storing token URIs
- Token ownership and transfers

**Deployed Address**: [`0xD7283D6af2A6B84411EC926D374d5bbedcae3119`](https://arbitrum-realia.cloud.blockscout.com/address/0xD7283D6af2A6B84411EC926D374d5bbedcae3119)

---

## 🤖 Fetch.ai Agents

Autonomous agents deployed on **Agentverse** that continuously:
- ✅ **Poll for blockchain events** (`Minted` and `VerificationRequested`)
- ✅ Auto-register on blockchain with PYUSD staking
- ✅ Auto-update agent address if changed
- ✅ **Process new mints**: Retrieve images from IPFS, generate embeddings, store in Qdrant
- ✅ **Process verification requests**: Compare images against their own Qdrant database
- ✅ Calculate image similarity using CLIP embeddings
- ✅ Submit verification results with thresholds:
  - **VERIFIED** (≥0.95): Exact match with existing NFT
  - **MODIFIED** (0.75-0.95): Similar but altered image
  - **NOT_VERIFIED** (<0.75): No match found
- ✅ **Post results to blockchain** based on similarity scores
- ✅ Sync all NFTs periodically
- ✅ Automatic gas estimation for all transactions
- ✅ Transaction status checking and error handling
- ✅ Each agent maintains **independent Qdrant database** for decentralization

---

## 💡 Use Cases

- **Content Creators**: Prove image ownership and authenticity
- **NFT Marketplaces**: Verify image originality before listing
- **Journalism**: Authenticate news images
- **Legal Evidence**: Timestamped proof of unmodified images
- **Social Media**: Combat deepfakes and manipulated content

---

## 🌟 Future Roadmap

- [ ] Zero-knowledge proof verification for privacy
- [ ] Multi-agent collaboration using CoLearn
- [ ] Lens Protocol / Farcaster integration
- [ ] Mobile app for on-the-go verification
- [ ] Video authenticity verification
- [ ] Cross-chain bridge for multiple networks

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

### Live Application
- **Realia Web App**: [https://realia-protocol.vercel.app/](https://realia-protocol.vercel.app/) - Mint & Verify Images

### Deployed Contracts
- **RealiaFactory**: [`0x49183a04032446c70bD520dcF2A25e8cBD15eAB4`](https://arbitrum-realia.cloud.blockscout.com/address/0x49183a04032446c70bD520dcF2A25e8cBD15eAB4)
- **RealiaNFT**: [`0xD7283D6af2A6B84411EC926D374d5bbedcae3119`](https://arbitrum-realia.cloud.blockscout.com/address/0xD7283D6af2A6B84411EC926D374d5bbedcae3119)
- **PYUSD**: [`0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`](https://arbitrum-realia.cloud.blockscout.com/address/0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1)

### Resources
- **Blockscout Explorer**: [Arbitrum Sepolia Blockscout](https://arbitrum-realia.cloud.blockscout.com/)
- **Fetch.ai**: [agentverse.ai](https://agentverse.ai/)
- **Qdrant**: [qdrant.tech](https://qdrant.tech/)

---

## 👥 Team

Built with ❤️ by Furqaan Nabi and Apurva Borhade for ETHOnline 2025

---

## 🙏 Acknowledgments

- PayPal for PYUSD
- Fetch.ai for the uAgents SDK and Agentverse
- Blockscout for blockchain indexing
- OpenZeppelin for secure smart contract libraries
- The Ethereum and Arbitrum communities

---

**⚠️ Disclaimer**: This project is for educational and demonstration purposes. Please ensure proper security audits before production deployment.
