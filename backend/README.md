# Realia Backend

Backend API server for the Realia platform, deployed on AWS EC2.

## Overview

The backend handles:
- Image upload and storage (IPFS/S3)
- NFT minting via smart contracts
- Verification request management
- Database operations (PostgreSQL + Prisma)
- Integration with Arbitrum Sepolia blockchain

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **ethers.js** - Ethereum interactions
- **Alchemy** - RPC provider
- **AWS S3** - Image storage
- **IPFS/Pinata** - Decentralized storage
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing

## Configuration

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

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.sample .env
# Update the .env file with your configuration
```

3. Setup database:
```bash
npx prisma generate
npx prisma migrate dev
```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

## Build

Build the TypeScript code:
```bash
npm run build
```

## Production

Run the production server:
```bash
npm start
```

## API Endpoints

- `GET /` - API status
- `GET /health` - Health check endpoint
- Image upload and minting endpoints
- Verification request endpoints
- NFT metadata endpoints

## Deployment

The backend is deployed on **AWS EC2** for 24/7 availability:
- Automatic service restart on failure
- HTTPS support
- CORS configured for frontend integration
- Production-ready error handling