import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

class TelegramRateLimiter:
    """Rate limiter for Telegram operations"""
    
    def __init__(self):
        # Rate limiting buckets
        self.buckets: Dict[str, deque] = defaultdict(deque)
        
        # Rate limits (requests per time period)
        self.limits = {
            'messages': {
                'count': 20,  # 20 messages
                'period': 60,  # per minute
                'burst': 5    # max 5 in burst before enforcing delays
            },
            'api_calls': {
                'count': 30,  # 30 API calls
                'period': 60,  # per minute
                'burst': 10   # max 10 in burst
            }
        }
        
        # Last request times for burst detection
        self.last_requests: Dict[str, datetime] = {}
        self.burst_counts: Dict[str, int] = defaultdict(int)
    
    async def acquire(self, operation_type: str = 'messages'):
        """Acquire permission to perform an operation"""
        if operation_type not in self.limits:
            return  # No limits for unknown operations
        
        now = datetime.now()
        limit_config = self.limits[operation_type]
        bucket = self.buckets[operation_type]
        
        # Clean old entries from bucket
        cutoff = now - timedelta(seconds=limit_config['period'])
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        
        # Check if we need to wait
        if len(bucket) >= limit_config['count']:
            # Rate limit exceeded, calculate wait time
            oldest_request = bucket[0]
            wait_time = (oldest_request + timedelta(seconds=limit_config['period']) - now).total_seconds()
            
            if wait_time > 0:
                logger.info(f"Rate limit reached for {operation_type}, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
                
                # Clean bucket again after waiting
                cutoff = datetime.now() - timedelta(seconds=limit_config['period'])
                while bucket and bucket[0] < cutoff:
                    bucket.popleft()
        
        # Check burst protection
        last_request = self.last_requests.get(operation_type)
        if last_request and (now - last_request).total_seconds() < 1:
            # Multiple requests within a second
            self.burst_counts[operation_type] += 1
            
            if self.burst_counts[operation_type] >= limit_config['burst']:
                # Burst limit reached, enforce delay
                delay = min(2.0, self.burst_counts[operation_type] * 0.5)
                logger.info(f"Burst limit reached for {operation_type}, delaying {delay:.1f} seconds")
                await asyncio.sleep(delay)
        else:
            # Reset burst counter if enough time has passed
            self.burst_counts[operation_type] = 0
        
        # Record this request
        bucket.append(now)
        self.last_requests[operation_type] = now
    
    def get_remaining_quota(self, operation_type: str = 'messages') -> int:
        """Get remaining quota for operation type"""
        if operation_type not in self.limits:
            return float('inf')
        
        limit_config = self.limits[operation_type]
        bucket = self.buckets[operation_type]
        
        # Clean old entries
        now = datetime.now()
        cutoff = now - timedelta(seconds=limit_config['period'])
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        
        return max(0, limit_config['count'] - len(bucket))
    
    def get_reset_time(self, operation_type: str = 'messages') -> Optional[datetime]:
        """Get time when quota will reset"""
        if operation_type not in self.limits:
            return None
        
        bucket = self.buckets[operation_type]
        if not bucket:
            return None
        
        limit_config = self.limits[operation_type]
        oldest_request = bucket[0]
        return oldest_request + timedelta(seconds=limit_config['period'])
    
    def get_status(self) -> Dict[str, Dict]:
        """Get rate limiter status for all operation types"""
        status = {}
        
        for operation_type in self.limits:
            remaining = self.get_remaining_quota(operation_type)
            reset_time = self.get_reset_time(operation_type)
            
            status[operation_type] = {
                'remaining_quota': remaining,
                'reset_time': reset_time.isoformat() if reset_time else None,
                'burst_count': self.burst_counts.get(operation_type, 0)
            }
        
        return status