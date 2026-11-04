"""Simple in-memory sliding-window rate limiter utility (backup for slowapi)."""
import time
from collections import defaultdict, deque
from threading import Lock


class RateLimiter:
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window = window_seconds
        self._calls: dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            dq = self._calls[key]
            # Remove expired timestamps
            while dq and dq[0] < now - self.window:
                dq.popleft()
            if len(dq) >= self.max_calls:
                return False
            dq.append(now)
            return True


# Default: 20 chat requests per minute per IP
chat_limiter = RateLimiter(max_calls=20, window_seconds=60)

