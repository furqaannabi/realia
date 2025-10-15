# Realia - Decentralized Image Authenticity Protocol

> **Proving Image Authenticity in the Age of AI**

Realia is a decentralized protocol that verifies whether an image is real, AI-generated, or modified. It provides on-chain proofs of authenticity linked to NFTs using hybrid on-chain and off-chain computation.

Built for **ETHOnline 2025** integrating:
- 💵 **PYUSD** for payments, staking, and rewards
- 🔍 **Blockscout** for blockchain data indexing and verification dashboards
- 🤖 **Fetch.ai Agents (ASI Layer)** for decentralized AI verification and autonomous compute

---

## 🏗️ Architecture

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────────┐
│   Frontend   │ ◄─────► │  AWS Embeddings │         │  Arbitrum Sepolia│
│  (Next.js)   │         │   (CLIP Model)  │         │   Smart Contracts│
└──────┬───────┘         └────────┬────────┘         └────────┬─────────┘
       │                          │                            │
       │                          │                            │
       │                          ▼                            ▼
       │                  ┌──────────────┐          ┌──────────────────┐
       │                  │   Qdrant DB  │          │   Blockscout     │
       │                  │  (Vectors)   │          │   (Explorer)     │
       │                  └──────────────┘          └──────────────────┘
       │                          ▲                            ▲
       │                          │                            │
       └──────────────────────────┴────────────────────────────┘
                                  │
                          ┌───────▼────────┐
                          │  Fetch.ai      │
                          │  Agentverse    │
                          │  (AI Agents)   │
                          └────────────────┘
```

---

## ✨ Features

### 🔐 NFT-Based Authenticity
- Mint authenticity NFTs for verified images
- On-chain proof of ownership and verification history
- Immutable record of image fingerprints

### 🤖 Decentralized AI Verification
- Multiple autonomous Fetch.ai agents verify each image
- Consensus-based verification (requires 5 agent confirmations)
- AI agents stake PYUSD and get rewarded for honest work
- Dishonest agents are automatically slashed

### 💰 PYUSD Economy
- Users pay small PYUSD fees for minting and verification
- Agents stake PYUSD to participate (50,000 PYUSD minimum)
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

### 3️⃣ Backend

```bash
cd backend
npm install
npm run dev
```

API runs on `http://localhost:3001`

### 4️⃣ Embedding Service

```bash
cd embeddings
pip install -r requirements.txt
python main.py
```

### 5️⃣ Fetch.ai Agent

```bash
cd agent
pip install -r pyproject.toml

# Create .env file
cp .env.example .env
# Fill in: ALCHEMY_API_KEY, REALIA_FACTORY_CONTRACT_ADDRESS, 
#          REALIA_NFT_CONTRACT_ADDRESS, AGENT_PRIVATE_KEY, etc.

# Run locally
python agent_local.py

# Or deploy to Agentverse (see agent/README.md)
```

---

## 🔧 Environment Variables

### Frontend
```env
NEXT_PUBLIC_REALIA_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_REALIA_NFT_ADDRESS=0x...
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Backend
```env
DATABASE_URL=postgresql://...
REALIA_FACTORY_ADDRESS=0x...
REALIA_NFT_ADDRESS=0x...
ALCHEMY_API_KEY=...
```

### Agent
```env
ALCHEMY_API_KEY=...
REALIA_FACTORY_CONTRACT_ADDRESS=0x...
REALIA_NFT_CONTRACT_ADDRESS=0x...
AGENT_PRIVATE_KEY=0x...
SEED=your_agent_seed
QDRANT_API_KEY=...
QDRANT_BASE_URL=https://...
EMBEDDING_URL=http://localhost:8000
```

---

## 📊 How It Works

### 1. **User Mints Authenticity NFT**
```
User uploads image → Frontend calls AWS embedding service
→ Generate CLIP embedding → User pays PYUSD fee
→ Mint NFT on Arbitrum → Agents store embedding in Qdrant
```

### 2. **Verification Request**
```
User requests verification → Pays PYUSD verification fee
→ Creates order → Emits VerificationRequested event
```

### 3. **Decentralized Verification**
```
Fetch.ai Agents listen to events → Fetch image and URI
→ Request embedding from AWS → Compare with Qdrant database
→ Calculate similarity score → Submit result on-chain
```

### 4. **Consensus & Rewards**
```
Smart contract collects 5 verifications → Determines majority
→ Rewards honest agents (PYUSD) → Slashes dishonest agents
→ Updates verification status → Emits Verified event
```

### 5. **Proof Display**
```
Blockscout indexes all events → Frontend queries Blockscout
→ Displays verification history and proofs
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Arbitrum Sepolia | Smart contract deployment |
| **Smart Contracts** | Solidity + Hardhat + OpenZeppelin | NFT minting & verification logic |
| **Payments** | PYUSD (ERC-20) | Staking, fees, rewards |
| **Frontend** | Next.js + TypeScript + Wagmi + RainbowKit | User interface |
| **Backend** | Node.js + Express + Prisma | API & database |
| **AI Agents** | Fetch.ai uAgents SDK (Python) | Autonomous verification |
| **Agent Hosting** | Agentverse / Fetch Station | 24/7 agent uptime |
| **AI/ML** | CLIP Model + Sentence Transformers | Image embeddings |
| **Embeddings** | AWS EC2/Lambda | Embedding generation service |
| **Vector DB** | Qdrant Cloud | NFT embedding storage |
| **Explorer** | Blockscout | Transaction & event indexing |
| **Storage** | AWS S3 + IPFS | Image & metadata storage |

---

## 📝 Smart Contracts

### RealiaFactory.sol
Main protocol contract handling:
- Agent registration and staking (50,000 PYUSD)
- Order management (Mint/Verify)
- Verification requests and responses
- Consensus mechanism (5 required verifications)
- PYUSD reward distribution
- Agent slashing for dishonest behavior

### RealiaNFT.sol
ERC-721 NFT contract for:
- Minting authenticity NFTs
- Storing token URIs
- Token ownership and transfers

---

## 🤖 Fetch.ai Agents

Autonomous agents that:
- ✅ Auto-register on blockchain with PYUSD staking
- ✅ Auto-update agent address if changed
- ✅ Listen for `VerificationRequested` events
- ✅ Listen for `Minted` events (create embeddings)
- ✅ Sync all NFTs periodically
- ✅ Calculate image similarity using CLIP embeddings
- ✅ Submit verification results with thresholds:
  - **VERIFIED** (≥0.95): Exact match
  - **MODIFIED** (0.75-0.95): Similar but modified
  - **NOT_VERIFIED** (<0.75): No match
- ✅ Automatic gas estimation for all transactions
- ✅ Transaction status checking and error handling

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

- **Blockscout Explorer**: [Arbitrum Sepolia](https://sepolia.arbiscan.io/)
- **PYUSD Contract**: `0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1`
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
