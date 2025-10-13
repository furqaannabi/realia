import requests, json, base64, os

BASE_URL = os.getenv("QDRANT_BASE_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

def ensure_qdrant_collection():
    r = requests.get(f"{BASE_URL}/collections/realia", headers={"api-key": QDRANT_API_KEY})
    if r.status_code != 200:
        payload = {"vectors": {"size": 512, "distance": "Cosine"}}
        res = requests.put(f"{BASE_URL}/collections/realia", headers={"Content-Type": "application/json", "api-key": QDRANT_API_KEY}, data=json.dumps(payload))
        return "created"
    else:
        return "already exists"

def create_point(id, vector, payload=None):
    data = {"points": [{"id": id, "vector": vector, "payload": payload or {}}]}
    r = requests.put(f"{BASE_URL}/collections/realia/points",
                     headers={"Content-Type": "application/json", "api-key": QDRANT_API_KEY},
                     data=json.dumps(data))
    return r.json()

def search_points(vector, limit=5):
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
    r = requests.get(ipfs_to_https(uri))
    imageLink = r.json()["image"]
    r = requests.get(ipfs_to_https(imageLink))
    b64 = base64.b64encode(r.content).decode("utf-8")
    payload = {"image": b64}
    r = requests.post("https://embedding.furqaannabi.com/get_image_embedding", json=payload)
    embedding = r.json()["embedding"]
    return embedding

def get_point_count():
    r = requests.get(f"{BASE_URL}/collections/realia",
                     headers={"api-key": QDRANT_API_KEY})
    if r.status_code == 200:
        return r.json()["result"]["points_count"]
    return 0

def point_exists(point_id):
    r = requests.get(f"{BASE_URL}/collections/realia/points/{point_id}",
                     headers={"api-key": QDRANT_API_KEY})
    return r.status_code == 200