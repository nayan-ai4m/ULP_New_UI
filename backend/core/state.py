"""Process-wide caches that span multiple routers / the WS loop.

Anything mutated must be referenced as `state.NAME` (not imported by name)
so writes land on the module attribute, not a stale local rebinding.
"""

from __future__ import annotations

import time
from typing import Optional

# Set once at import time; /healthz reports uptime against this.
START_TIME: float = time.time()

# Active laminate name — refreshed from QuestDB on WS connect.
CACHED_SKU: Optional[str] = None
