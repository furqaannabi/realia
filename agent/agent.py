from dotenv import load_dotenv
load_dotenv()

import asyncio, os, requests, json, base64
from web3 import Web3
from uagents import Agent, Context

# ============================================================================
# ABI Definitions
# ============================================================================

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
    {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "verificationResponses", "outputs": [{"internalType": "address", "name": "agent", "type": "address"}, {"internalType": "enum VerificationResult", "name": "result", "type": "uint8"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "uint256", "name": "responseTime", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "requestId", "type": "uint256"}, {"internalType": "enum VerificationResult", "name": "result", "type": "uint8"}, {"internalType": "uint256", "name": "propertyTokenId", "type": "uint256"}], "name": "responseVerification", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [], "name": "syncAgent", "outputs": [{"internalType": "uint256", "name": "totalCount", "type": "uint256"}, {"internalType": "uint256[]", "name": "nftIds", "type": "uint256[]"}, {"internalType": "string[]", "name": "nftUris", "type": "string[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "syncPendingVerifications", "outputs": [{"internalType": "uint256", "name": "pendingCount", "type": "uint256"}, {"internalType": "uint256[]", "name": "requestIds", "type": "uint256[]"}, {"internalType": "address[]", "name": "users", "type": "address[]"}, {"internalType": "string[]", "name": "uris", "type": "string[]"}, {"internalType": "uint256[]", "name": "responseCounts", "type": "uint256[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "requestId", "type": "uint256"}, {"internalType": "address", "name": "agent", "type": "address"}], "name": "hasAgentResponded", "outputs": [{"internalType": "bool", "name": "hasResponded", "type": "bool"}], "stateMutability": "view", "type": "function"}
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

# ============================================================================
# Qdrant Functions
# ============================================================================

def ensure_qdrant_collection():
    BASE_URL = os.getenv("QDRANT_BASE_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    r = requests.get(f"{BASE_URL}/collections/realia", headers={"api-key": QDRANT_API_KEY})
    if r.status_code != 200:
        payload = {"vectors": {"size": 512, "distance": "Cosine"}}
        res = requests.put(f"{BASE_URL}/collections/realia", headers={"Content-Type": "application/json", "api-key": QDRANT_API_KEY}, data=json.dumps(payload))
        return "created"
    else:
        return "already exists"

def create_point(id, vector, payload=None):
    BASE_URL = os.getenv("QDRANT_BASE_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    data = {"points": [{"id": id, "vector": vector, "payload": payload or {}}]}
    r = requests.put(f"{BASE_URL}/collections/realia/points",
                     headers={"Content-Type": "application/json", "api-key": QDRANT_API_KEY},
                     data=json.dumps(data))
    return r.json()

def search_points(vector, limit=5):
    BASE_URL = os.getenv("QDRANT_BASE_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    data = {"vector": vector, "limit": limit}
    r = requests.post(f"{BASE_URL}/collections/realia/points/search",
                      headers={"Content-Type": "application/json", "api-key": QDRANT_API_KEY},
                      data=json.dumps(data))
    return r.json()

def ipfs_to_https(uri):
    if uri.startswith("ipfs://"):
        return uri.replace("ipfs://", "https://ipfs.io/ipfs/")
    return uri

def get_embeddings(uri):
    EMBEDDING_URL = os.getenv("EMBEDDING_URL")
    r = requests.get(ipfs_to_https(uri))
    imageLink = r.json()["image"]
    r = requests.get(ipfs_to_https(imageLink))
    b64 = base64.b64encode(r.content).decode("utf-8")
    payload = {"image": b64}
    r = requests.post(EMBEDDING_URL, json=payload)
    embedding = r.json()["embedding"]
    return embedding

def get_point_count():
    BASE_URL = os.getenv("QDRANT_BASE_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    r = requests.get(f"{BASE_URL}/collections/realia",
                     headers={"api-key": QDRANT_API_KEY})
    if r.status_code == 200:
        return r.json()["result"]["points_count"]
    return 0

def point_exists(point_id):
    BASE_URL = os.getenv("QDRANT_BASE_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    r = requests.get(f"{BASE_URL}/collections/realia/points/{point_id}",
                     headers={"api-key": QDRANT_API_KEY})
    return r.status_code == 200

# ============================================================================
# Agent Setup
# ============================================================================
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY")
FACTORY_ADDRESS = os.getenv("REALIA_FACTORY_CONTRACT_ADDRESS")
NFT_ADDRESS = os.getenv("REALIA_NFT_CONTRACT_ADDRESS")
WALLET_SEED = os.getenv("WALLET_SEED")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_BASE_URL = os.getenv("QDRANT_BASE_URL")
EMBEDDING_URL = os.getenv("EMBEDDING_URL")
WALLET_PRIVATE_KEY = os.getenv("WALLET_PRIVATE_KEY")

w3 = Web3(Web3.HTTPProvider(f"https://arb-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}"))
factory_contract = w3.eth.contract(address=FACTORY_ADDRESS, abi=REALIA_FACTORY_ABI)
nft_contract = w3.eth.contract(address=NFT_ADDRESS, abi=REALIA_NFT_ABI)

# Setup agent wallet
agent_account = w3.eth.account.from_key(WALLET_PRIVATE_KEY)
AGENT_EVM_ADDRESS = agent_account.address

# --- Agent Setup ---
agent = Agent(name="realia_agent", seed=WALLET_SEED, port=8001)

async def check_and_register_agent(ctx: Context):
    """Check if agent is registered, if not attempt to register"""
    try:
        # Check if agent is already registered
        agent_info = factory_contract.functions.agents(AGENT_EVM_ADDRESS).call()
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
                update_hash = w3.eth.send_raw_transaction(signed_update.rawTransaction)
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
        approve_hash = w3.eth.send_raw_transaction(signed_approve.rawTransaction)
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
        register_hash = w3.eth.send_raw_transaction(signed_register.rawTransaction)
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

async def sync_verification_requests(ctx: Context):
    """Poll for pending verification requests every 5 seconds using syncPendingVerifications"""
    processed_requests = set()  # Track which requests we've already processed locally
    
    while True:
        try:
            # Call syncPendingVerifications to get all pending verifications
            pending_count, request_ids, users, uris, response_counts = factory_contract.functions.syncPendingVerifications().call()
            
            if pending_count > 0:
                ctx.logger.info(f"Syncing {pending_count} pending verification request(s) from contract")
                
                new_pending = 0
                for i in range(pending_count):
                    request_id = request_ids[i]
                    user = users[i]
                    uri = uris[i]
                    response_count = response_counts[i]
                    
                    # Check if we've already processed this request locally
                    if request_id in processed_requests:
                        continue
                    
                    # Check if this agent has already responded on-chain
                    has_responded = factory_contract.functions.hasAgentResponded(request_id, AGENT_EVM_ADDRESS).call()
                    
                    if not has_responded:
                        ctx.logger.info(f"🔍 Found pending verification request! ID: {request_id}, User: {user}, Responses: {response_count}/5")
                        new_pending += 1
                        
                        # Mark as being processed locally
                        processed_requests.add(request_id)
                        
                        # Handle verification inline
                        try:
                            ctx.logger.info(f"Verification URI: {uri}")
                            
                            # Get embedding for the verification image
                            ctx.logger.info("Generating embedding for verification image...")
                            verification_embedding = get_embeddings(uri)
                            ctx.logger.info("✓ Embedding generated")
                            
                            # Search Qdrant for similar NFTs
                            ctx.logger.info("Searching for matching NFTs...")
                            search_response = search_points(verification_embedding, limit=5)
                            search_results = search_response.get("result", []) if isinstance(search_response, dict) else []
                            
                            if not search_results or len(search_results) == 0:
                                ctx.logger.warning("No matching NFTs found. Responding with NOT_VERIFIED")
                                verification_result = VerificationResult.NOT_VERIFIED
                                matched_token_id = 0
                            else:
                                # Get the best match
                                best_match = search_results[0]
                                similarity_score = best_match.get("score", 0)
                                matched_token_id = best_match.get("payload", {}).get("tokenId", 0)
                                
                                ctx.logger.info(f"Search results: {len(search_results)} matches found")
                                
                                ctx.logger.info(f"Best match: NFT #{matched_token_id}, Similarity: {similarity_score:.4f}")
                                
                                # Thresholds for verification
                                VERIFIED_THRESHOLD = 0.95
                                MODIFIED_THRESHOLD = 0.75
                                
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
                            response_hash = w3.eth.send_raw_transaction(signed_response.rawTransaction)
                            ctx.logger.info(f"Transaction sent: {response_hash.hex()}")
                            
                            response_receipt = w3.eth.wait_for_transaction_receipt(response_hash)
                            
                            if response_receipt['status'] != 1:
                                ctx.logger.error(f"Verification response transaction reverted! TX: {response_hash.hex()}")
                            else:
                                ctx.logger.info(f"🎉 Verification #{request_id} completed successfully!")
                        except Exception as e:
                            ctx.logger.error(f"Failed to handle verification #{request_id}: {e}")
                
                if new_pending > 0:
                    ctx.logger.info(f"Processing {new_pending} new verification request(s)")
                    
        except Exception as e:
            ctx.logger.error(f"Error polling for verification requests: {e}")
        
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
    
    # Start verification request polling
    asyncio.create_task(sync_verification_requests(ctx))
    ctx.logger.info("✓ Started verification request polling (every 5s)")
    
    # Start NFT sync task
    asyncio.create_task(sync_nft_embeddings(ctx))
    ctx.logger.info("✓ Started NFT embedding sync task (every 30s)")
    
    ctx.logger.info("🚀 All services running!")