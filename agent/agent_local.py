from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
from web3 import Web3
from uagents import Agent, Context
from qdrant import ensure_qdrant_collection, create_point, search_points, get_embeddings, point_exists
from abi import REALIA_FACTORY_ABI, REALIA_NFT_ABI, ERC20_ABI, VerificationResult
# --- Setup ---
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY")
FACTORY_ADDRESS = os.getenv("REALIA_FACTORY_CONTRACT_ADDRESS")
NFT_ADDRESS = os.getenv("REALIA_NFT_CONTRACT_ADDRESS")
SEED = os.getenv("SEED")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_BASE_URL = os.getenv("QDRANT_BASE_URL")
EMBEDDING_URL = os.getenv("EMBEDDING_URL")
AGENT_PRIVATE_KEY = os.getenv("AGENT_PRIVATE_KEY")

w3 = Web3(Web3.HTTPProvider(f"https://arb-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}"))
factory_contract = w3.eth.contract(address=FACTORY_ADDRESS, abi=REALIA_FACTORY_ABI)
nft_contract = w3.eth.contract(address=NFT_ADDRESS, abi=REALIA_NFT_ABI)

# Setup agent wallet
agent_account = w3.eth.account.from_key(AGENT_PRIVATE_KEY)
AGENT_EVM_ADDRESS = agent_account.address

# --- Agent Setup ---
agent = Agent(name="realia_agent", seed=SEED, port=8001, mailbox=True)

async def check_and_register_agent(ctx: Context):
    """Check if agent is registered, if not attempt to register"""
    try:
        # Check if agent is already registered
        agent_info = factory_contract.functions.agents(AGENT_EVM_ADDRESS).call()
        print(agent_info)
        is_staked = agent_info[3]  # isStaked is the 4th element (index 3)
        
        if is_staked:
            registered_agent_address = agent_info[0]  # agentAddress is the 1st element
            current_agent_address = ctx.agent.address
            
            ctx.logger.info(f"✓ Agent already registered: {AGENT_EVM_ADDRESS}")
            ctx.logger.info(f"  - Registered agent address: {registered_agent_address}")
            ctx.logger.info(f"  - Current agent address: {current_agent_address}")
            ctx.logger.info(f"  - Verified count: {agent_info[2]}")
            
            # Check if agent address needs to be updated
            if registered_agent_address != current_agent_address:
                ctx.logger.warning(f"Agent address mismatch! Updating...")
                update_tx = factory_contract.functions.updateAgentAddress(current_agent_address).build_transaction({
                    'from': AGENT_EVM_ADDRESS,
                    'nonce': w3.eth.get_transaction_count(AGENT_EVM_ADDRESS)
                })
                signed_update = agent_account.sign_transaction(update_tx)
                update_hash = w3.eth.send_raw_transaction(signed_update.raw_transaction)
                update_receipt = w3.eth.wait_for_transaction_receipt(update_hash)
                
                if update_receipt['status'] != 1:
                    raise Exception(f"Update agent address transaction failed! TX: {update_hash.hex()}")
                
                ctx.logger.info(f"✓ Agent address updated! TX: {update_hash.hex()}")
            
            return True
        
        ctx.logger.warning(f"Agent not registered: {AGENT_EVM_ADDRESS}")
        ctx.logger.info("Attempting to register agent...")
        
        # Get contract constants
        min_staking = factory_contract.functions.MIN_AGENT_STAKING().call()
        pyusd_address = factory_contract.functions.PYUSD().call()
        
        # Create PYUSD contract instance
        pyusd_contract = w3.eth.contract(address=pyusd_address, abi=ERC20_ABI)
        
        # Check PYUSD balance
        pyusd_balance = pyusd_contract.functions.balanceOf(AGENT_EVM_ADDRESS).call()
        ctx.logger.info(f"PYUSD Balance: {pyusd_balance / 1e6} PYUSD")
        ctx.logger.info(f"Required Staking: {min_staking / 1e6} PYUSD")
        
        if pyusd_balance < min_staking:
            error_msg = f"Insufficient PYUSD balance! Required: {min_staking / 1e6} PYUSD, Available: {pyusd_balance / 1e6} PYUSD"
            ctx.logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Approve PYUSD for contract
        ctx.logger.info("Approving PYUSD for contract...")
        approve_tx = pyusd_contract.functions.approve(FACTORY_ADDRESS, min_staking).build_transaction({
            'from': AGENT_EVM_ADDRESS,
            'nonce': w3.eth.get_transaction_count(AGENT_EVM_ADDRESS)
        })
        signed_approve = agent_account.sign_transaction(approve_tx)
        approve_hash = w3.eth.send_raw_transaction(signed_approve.raw_transaction)
        approve_receipt = w3.eth.wait_for_transaction_receipt(approve_hash)
        
        if approve_receipt['status'] != 1:
            raise Exception(f"Approval transaction failed! TX: {approve_hash.hex()}")
        
        ctx.logger.info(f"✓ Approval transaction: {approve_hash.hex()}")
        
        # Register agent
        ctx.logger.info("Registering agent...")
        ctx.logger.info(f"Agent address to register: {ctx.agent.address}")
        
        register_tx = factory_contract.functions.registerAgent(ctx.agent.address).build_transaction({
            'from': AGENT_EVM_ADDRESS,
            'nonce': w3.eth.get_transaction_count(AGENT_EVM_ADDRESS)
        })
        
        ctx.logger.info(f"Transaction details: gas={register_tx.get('gas')}, gasPrice={register_tx.get('gasPrice')}")
        
        signed_register = agent_account.sign_transaction(register_tx)
        register_hash = w3.eth.send_raw_transaction(signed_register.raw_transaction)
        ctx.logger.info(f"Transaction sent: {register_hash.hex()}")
        ctx.logger.info("Waiting for confirmation...")
        
        register_receipt = w3.eth.wait_for_transaction_receipt(register_hash, timeout=120)
        
        if register_receipt['status'] != 1:
            ctx.logger.error(f"Registration transaction reverted! TX: {register_hash.hex()}")
            ctx.logger.error(f"Receipt: {register_receipt}")
            raise Exception(f"Registration transaction failed! Check transaction: {register_hash.hex()}")
        
        ctx.logger.info(f"✓ Registration transaction: {register_hash.hex()}")
        ctx.logger.info(f"🎉 Agent successfully registered!")
        
        return True
        
    except ValueError as e:
        # Re-raise ValueError (insufficient balance)
        raise e
    except Exception as e:
        ctx.logger.error(f"Failed to check/register agent: {e}")
        raise e

async def listen_for_verification_events(ctx: Context):
    """Listen for verification request events from the blockchain"""
    event_filter = factory_contract.events.VerificationRequested.create_filter(from_block="latest")
    while True:
        for event in event_filter.get_new_entries():
            data = event["args"]
            request_id = data["requestId"]
            user_address = data["user"]
            ctx.logger.info(f"🔍 New verification request! ID: {request_id}, User: {user_address}")
            
            # Handle verification asynchronously
            asyncio.create_task(handle_verification(ctx, request_id))
        
        await asyncio.sleep(5)

async def listen_for_mint_events(ctx: Context):
    """Listen for new NFT mint events and create embeddings immediately"""
    event_filter = nft_contract.events.Minted.create_filter(from_block="latest")
    while True:
        for event in event_filter.get_new_entries():
            data = event["args"]
            token_id = data["tokenId"]
            to_address = data["to"]
            ctx.logger.info(f"🎉 New NFT minted! Token ID: {token_id}, Owner: {to_address}")
            
            try:
                # Get the token URI from the contract
                token_uri = nft_contract.functions.tokenURI(token_id).call()
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
            # Call syncAgent function from smart contract (RealiaFactory)
            total_count, nft_ids, nft_uris = factory_contract.functions.syncAgent().call()
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
    ctx.logger.info(f"Agent EVM Address: {AGENT_EVM_ADDRESS}")
    
    # Check and register agent if needed
    try:
        await check_and_register_agent(ctx)
    except ValueError as e:
        ctx.logger.error(f"❌ Cannot start agent: {e}")
        ctx.logger.error("Please fund the agent wallet with sufficient PYUSD and restart.")
        raise e
    except Exception as e:
        ctx.logger.error(f"❌ Agent registration check failed: {e}")
        raise e
    
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

async def handle_verification(ctx: Context, request_id: int):
    """
    Handle verification request by:
    1. Fetching verification request details from blockchain
    2. Getting embedding for the verification image
    3. Searching Qdrant for similar NFTs
    4. Submitting verification response to blockchain
    """
    try:
        ctx.logger.info(f"Processing verification request #{request_id}")
        
        # Get verification request details from blockchain
        verification_req = factory_contract.functions.verificationRequests(request_id).call()
        verification_uri = verification_req[1]
        is_processed = verification_req[2]
        
        if is_processed:
            ctx.logger.warning(f"Verification request #{request_id} already processed. Skipping.")
            return
        
        ctx.logger.info(f"Verification URI: {verification_uri}")
        
        # Get embedding for the verification image
        ctx.logger.info("Generating embedding for verification image...")
        verification_embedding = get_embeddings(verification_uri)
        ctx.logger.info("✓ Embedding generated")
        
        # Search Qdrant for similar NFTs
        ctx.logger.info("Searching for matching NFTs...")
        search_results = search_points(verification_embedding, limit=5)
        
        if not search_results or len(search_results) == 0:
            ctx.logger.warning("No matching NFTs found. Responding with NOT_VERIFIED")
            verification_result = VerificationResult.NOT_VERIFIED
            matched_token_id = 0
        else:
            # Get the best match
            best_match = search_results[0]
            similarity_score = best_match.get("score", 0)
            matched_token_id = best_match.get("payload", {}).get("tokenId", 0)
            
            ctx.logger.info(f"Best match: NFT #{matched_token_id}, Similarity: {similarity_score:.4f}")
            
            # Thresholds for verification (you can adjust these)
            VERIFIED_THRESHOLD = 0.95      # Very high similarity - exact match
            MODIFIED_THRESHOLD = 0.75      # Medium similarity - likely modified
            
            if similarity_score >= VERIFIED_THRESHOLD:
                verification_result = VerificationResult.VERIFIED
                ctx.logger.info(f"✓ VERIFIED! Exact match with NFT #{matched_token_id}")
            elif similarity_score >= MODIFIED_THRESHOLD:
                verification_result = VerificationResult.MODIFIED
                ctx.logger.info(f"⚠ MODIFIED! Similar to NFT #{matched_token_id} but with modifications")
            else:
                verification_result = VerificationResult.NOT_VERIFIED
                matched_token_id = 0
                ctx.logger.info(f"✗ NOT_VERIFIED. Similarity too low.")
        
        # Submit verification response to blockchain
        result_name = ["NONE", "VERIFIED", "MODIFIED", "NOT_VERIFIED"][verification_result]
        ctx.logger.info(f"Submitting response: result={result_name}, tokenId={matched_token_id}")
        
        response_tx = factory_contract.functions.responseVerification(
            request_id,
            verification_result,
            matched_token_id
        ).build_transaction({
            'from': AGENT_EVM_ADDRESS,
            'nonce': w3.eth.get_transaction_count(AGENT_EVM_ADDRESS)
        })
        
        signed_response = agent_account.sign_transaction(response_tx)
        response_hash = w3.eth.send_raw_transaction(signed_response.raw_transaction)
        ctx.logger.info(f"Transaction sent: {response_hash.hex()}")
        
        response_receipt = w3.eth.wait_for_transaction_receipt(response_hash)
        
        if response_receipt['status'] != 1:
            ctx.logger.error(f"Verification response transaction reverted! TX: {response_hash.hex()}")
            raise Exception(f"Verification response failed! TX: {response_hash.hex()}")
        
        ctx.logger.info(f"✓ Response submitted! TX: {response_hash.hex()}")
        ctx.logger.info(f"🎉 Verification #{request_id} completed successfully!")
        
    except Exception as e:
        ctx.logger.error(f"Failed to handle verification #{request_id}: {e}")
        import traceback
        ctx.logger.error(traceback.format_exc())

agent.run()