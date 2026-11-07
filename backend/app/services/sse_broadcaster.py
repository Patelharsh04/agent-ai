import asyncio
import json
from typing import List, Dict, Any, Optional
from ..models.schemas import AgentEvent

class SSEBroadcaster:
    """
    Manages Server-Sent Events (SSE) telemetry.
    Maintains an in-memory ring buffer for Last-Event-ID replay resilience.
    """
    
    def __init__(self, max_buffer_size: int = 500):
        self._subscribers: List[asyncio.Queue] = []
        self._event_buffer: List[AgentEvent] = []
        self._max_buffer_size = max_buffer_size
        self._lock = asyncio.Lock()
        
    async def subscribe(self, last_event_id: Optional[str] = None) -> asyncio.Queue:
        queue = asyncio.Queue()
        async with self._lock:
            # Replay any missed events since last_event_id
            if last_event_id:
                replay = False
                for evt in self._event_buffer:
                    if replay:
                        await queue.put(evt)
                    elif evt.event_id == last_event_id:
                        replay = True
            self._subscribers.append(queue)
        return queue
        
    async def unsubscribe(self, queue: asyncio.Queue):
        async with self._lock:
            if queue in self._subscribers:
                self._subscribers.remove(queue)
                
    async def emit(self, event: AgentEvent):
        async with self._lock:
            self._event_buffer.append(event)
            if len(self._event_buffer) > self._max_buffer_size:
                self._event_buffer.pop(0)
                
            for q in list(self._subscribers):
                try:
                    q.put_nowait(event)
                except asyncio.QueueFull:
                    pass
                    
    def get_all_events(self) -> List[AgentEvent]:
        return list(self._event_buffer)
        
    def clear(self):
        self._event_buffer.clear()

broadcaster = SSEBroadcaster()

