from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
from web3 import Web3
from uagents import Agent, Context
from pydantic import BaseModel
from qdrant import ensure_qdrant_collection, create_point, search_points
# --- Setup ---
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
SEED = os.getenv("SEED")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_BASE_URL = os.getenv("QDRANT_BASE_URL")

if not ALCHEMY_API_KEY or not CONTRACT_ADDRESS or not SEED or not QDRANT_API_KEY or not QDRANT_BASE_URL:
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
    }
]

w3 = Web3(Web3.HTTPProvider(f"https://arb-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}"))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

# --- Agent Setup ---
class VerificationRequest(BaseModel):
    image_hash: str
    requester: str

agent = Agent(name="realia_agent", seed=SEED, port=8001)

async def listen_for_events(ctx: Context):
    event_filter = contract.events.VerificationRequested.create_filter(from_block="latest")
    while True:
        for event in event_filter.get_new_entries():
            data = event["args"]
            ctx.logger.info(f"New event! Image hash: {data['imageHash']}")
            await handle_verification(ctx, VerificationRequest(
                image_hash=data["imageHash"], requester=data["requester"]
            ))
        await asyncio.sleep(5)

@agent.on_event("startup")
async def start(ctx: Context):
    ctx.logger.info("Starting event listener...")
    asyncio.create_task(listen_for_events(ctx))
    qdrant_result = ensure_qdrant_collection()
    ctx.logger.info(f"QDRANT collection: {qdrant_result}")

async def handle_verification(ctx: Context, msg: VerificationRequest):
    ctx.logger.info(f"Verifying image {msg.image_hash}")
    # perform AI logic here
    # then call submitVerification()
    # (pseudo)
    # tx = ctx.send_tx(to=CONTRACT_ADDRESS, function="submitVerification", args={"imageHash": msg.image_hash, "result": True})
    ctx.logger.info("Verification complete!")

agent.run()
