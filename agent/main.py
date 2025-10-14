from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
from web3 import Web3
from uagents import Agent, Context
from pydantic import BaseModel
from qdrant import ensure_qdrant_collection, create_point, search_points, get_embeddings, point_exists
# --- Setup ---
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
SEED = os.getenv("SEED")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_BASE_URL = os.getenv("QDRANT_BASE_URL")
EMBEDDING_URL = os.getenv("EMBEDDING_URL")
if not ALCHEMY_API_KEY or not CONTRACT_ADDRESS or not SEED or not QDRANT_API_KEY or not QDRANT_BASE_URL or not EMBEDDING_URL:
    raise ValueError("Missing environment variables")

ABI = [
   {
      "anonymous": False,
      "inputs": [
        {
          "indexed": False,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": False,
          "internalType": "uint256",
          "name": "requestId",
          "type": "uint256"
        }
      ],
      "name": "VerificationRequested",
      "type": "event"
    },
    {
      "anonymous": False,
      "inputs": [
        {
          "indexed": False,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": False,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Minted",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "syncAgent",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "nftIds",
          "type": "uint256[]"
        },
        {
          "internalType": "string[]",
          "name": "nftUris",
          "type": "string[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
]

w3 = Web3(Web3.HTTPProvider(f"https://arb-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}"))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

# --- Agent Setup ---
class VerificationRequest(BaseModel):
    image_hash: str
    requester: str

agent = Agent(name="realia_agent", seed=SEED, port=8001)

async def listen_for_verification_events(ctx: Context):
    event_filter = contract.events.VerificationRequested.create_filter(from_block="latest")
    while True:
        for event in event_filter.get_new_entries():
            data = event["args"]
            ctx.logger.info(f"New verification request! Request ID: {data['requestId']}")
            await handle_verification(ctx, VerificationRequest(
                image_hash=data["imageHash"], requester=data["requester"]
            ))
        await asyncio.sleep(5)

async def listen_for_mint_events(ctx: Context):
    """Listen for new NFT mint events and create embeddings immediately"""
    event_filter = contract.events.Minted.create_filter(from_block="latest")
    while True:
        for event in event_filter.get_new_entries():
            data = event["args"]
            token_id = data["tokenId"]
            to_address = data["to"]
            ctx.logger.info(f"🎉 New NFT minted! Token ID: {token_id}, Owner: {to_address}")
            
            try:
                # Get the token URI from the contract
                token_uri = contract.functions.tokenURI(token_id).call()
                ctx.logger.info(f"Fetching URI for NFT #{token_id}: {token_uri}")
                
                # Create embedding if it doesn't exist
                if not point_exists(token_id):
                    ctx.logger.info(f"Creating embedding for newly minted NFT #{token_id}")
                    embedding = get_embeddings(token_uri)
                    create_point(token_id, embedding, {"tokenId": token_id, "uri": token_uri, "owner": to_address})
                    ctx.logger.info(f"✓ Embedding created for NFT #{token_id}")
                else:
                    ctx.logger.info(f"Embedding already exists for NFT #{token_id}")
            except Exception as e:
                ctx.logger.error(f"Failed to process minted NFT #{token_id}: {e}")
        
        await asyncio.sleep(5)

async def sync_nft_embeddings(ctx: Context):
    """Sync NFT embeddings from blockchain to Qdrant"""
    while True:
        try:
            # Call syncAgent function from smart contract
            total_count, nft_ids, nft_uris = contract.functions.syncAgent().call()
            ctx.logger.info(f"Syncing {total_count} NFTs from blockchain")
            
            # Check each NFT and create embedding if missing
            for i in range(len(nft_ids)):
                nft_id = nft_ids[i]
                nft_uri = nft_uris[i]
                
                if not point_exists(nft_id):
                    ctx.logger.info(f"Creating embedding for NFT #{nft_id}")
                    try:
                        embedding = get_embeddings(nft_uri)
                        create_point(nft_id, embedding, {"tokenId": nft_id, "uri": nft_uri})
                        ctx.logger.info(f"✓ Created embedding for NFT #{nft_id}")
                    except Exception as e:
                        ctx.logger.error(f"Failed to create embedding for NFT #{nft_id}: {e}")
                else:
                    ctx.logger.debug(f"Embedding already exists for NFT #{nft_id}")
            
            ctx.logger.info(f"Sync complete. Total NFTs: {total_count}")
        except Exception as e:
            ctx.logger.error(f"Sync error: {e}")
        
        # Wait 30 seconds before next sync
        await asyncio.sleep(30)

@agent.on_event("startup")
async def start(ctx: Context):
    ctx.logger.info("Starting Realia Agent...")
    
    # Initialize Qdrant collection
    qdrant_result = ensure_qdrant_collection()
    ctx.logger.info(f"QDRANT collection: {qdrant_result}")
    
    # Start verification event listener
    asyncio.create_task(listen_for_verification_events(ctx))
    ctx.logger.info("✓ Started verification event listener")
    
    # Start mint event listener
    asyncio.create_task(listen_for_mint_events(ctx))
    ctx.logger.info("✓ Started mint event listener")
    
    # Start NFT sync task
    asyncio.create_task(sync_nft_embeddings(ctx))
    ctx.logger.info("✓ Started NFT embedding sync task")
    
    ctx.logger.info("🚀 All services running!")

async def handle_verification(ctx: Context, msg: VerificationRequest):
    ctx.logger.info(f"Verifying image {msg.image_hash}")
    # perform AI logic here
    # then call submitVerification()
    # (pseudo)
    # tx = ctx.send_tx(to=CONTRACT_ADDRESS, function="submitVerification", args={"imageHash": msg.image_hash, "result": True})
    ctx.logger.info("Verification complete!")

agent.run()
