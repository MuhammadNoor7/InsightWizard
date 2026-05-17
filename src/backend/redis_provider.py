import os
import redis.asyncio as aioredis
import asyncio
import logging

logger = logging.getLogger("RedisProvider")

def load_env():
    # Attempt to locate and load the .env file dynamically
    env_path = ".env"
    if not os.path.exists(env_path):
        possible_paths = [
            os.path.join(os.path.dirname(__file__), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
            os.path.join(os.getcwd(), "src", "backend", ".env"),
            os.path.join(os.getcwd(), ".env")
        ]
        for p in possible_paths:
            if os.path.exists(p):
                env_path = p
                break
    
    if os.path.exists(env_path):
        print(f"[Env] Loading environment variables from {os.path.abspath(env_path)}")
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        key, _, val = line.partition("=")
                        key = key.strip()
                        val = val.strip()
                        if val.startswith(('"', "'")) and val.endswith(('"', "'")):
                            val = val[1:-1]
                        os.environ[key] = val
        except Exception as e:
            print(f"[Env ERROR] Failed to read .env file: {str(e)}")

# Load env variables immediately on import
load_env()

# In-Memory fallback implementation for high-fidelity offline operation
class InMemoryPubSub:
    def __init__(self, in_memory_redis):
        self.redis = in_memory_redis
        self.channels = []
        self.queue = asyncio.Queue()

    async def subscribe(self, channel: str):
        self.channels.append(channel)
        self.redis.register_subscriber(channel, self)

    async def unsubscribe(self, channel: str):
        if channel in self.channels:
            self.channels.remove(channel)
        self.redis.unregister_subscriber(channel, self)

    async def get_message(self, ignore_subscribe_messages=True):
        try:
            # Blocks until a message is put into the queue
            return await self.queue.get()
        except asyncio.CancelledError:
            raise
        except Exception:
            return None

    def put_message(self, message):
        self.queue.put_nowait(message)


class InMemoryRedis:
    def __init__(self):
        self.kv = {}
        self.subscribers = {}

    async def set(self, key: str, value: str):
        self.kv[key] = value.encode('utf-8') if isinstance(value, str) else value
        return True

    async def get(self, key: str):
        return self.kv.get(key)

    def register_subscriber(self, channel: str, pubsub: InMemoryPubSub):
        if channel not in self.subscribers:
            self.subscribers[channel] = []
        self.subscribers[channel].append(pubsub)

    def unregister_subscriber(self, channel: str, pubsub: InMemoryPubSub):
        if channel in self.subscribers:
            if pubsub in self.subscribers[channel]:
                self.subscribers[channel].remove(pubsub)
            if not self.subscribers[channel]:
                del self.subscribers[channel]

    async def publish(self, channel: str, message: str):
        count = 0
        if channel in self.subscribers:
            for pubsub in self.subscribers[channel]:
                pubsub.put_message({
                    'type': 'message',
                    'pattern': None,
                    'channel': channel.encode('utf-8'),
                    'data': message.encode('utf-8') if isinstance(message, str) else message
                })
                count += 1
        return count

    def pubsub(self):
        return InMemoryPubSub(self)

    async def close(self):
        pass


_in_memory_instance = InMemoryRedis()
_use_in_memory = False
_redis_client = None

def get_redis_client():
    global _use_in_memory, _redis_client
    if _use_in_memory:
        return _in_memory_instance
    
    if _redis_client is None:
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        _redis_client = aioredis.from_url(redis_url)
        
    return _redis_client

async def check_redis_connection():
    global _use_in_memory
    client = get_redis_client()
    if isinstance(client, InMemoryRedis):
        return True
        
    try:
        # Quick ping check to see if Redis is running
        await asyncio.wait_for(client.ping(), timeout=2.0)
        logger.info("Successfully connected to Redis.")
        print("[Redis] Successfully connected to external Redis server.")
        _use_in_memory = False
    except Exception as e:
        logger.warning(f"Redis not available ({e}). Falling back to In-Memory storage.")
        print(f"\n[Redis WARNING] Redis server not detected at {os.environ.get('REDIS_URL', 'localhost:6379')}.")
        print("[Redis WARNING] Falling back to high-fidelity In-Memory storage & PubSub! (No Docker/Redis needed)\n")
        _use_in_memory = True
