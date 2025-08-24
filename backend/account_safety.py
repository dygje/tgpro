import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class AccountHealthMetrics:
    """Track account health indicators"""
    messages_sent_today: int = 0
    messages_sent_this_hour: int = 0
    groups_joined_today: int = 0
    failed_deliveries: int = 0
    flood_waits_today: int = 0
    last_flood_wait: Optional[datetime] = None
    active_conversations: int = 0
    received_messages: int = 0
    successful_deliveries: int = 0
    account_age_days: int = 1  # Assume new account
    
    @property
    def success_rate(self) -> float:
        total = self.successful_deliveries + self.failed_deliveries
        return (self.successful_deliveries / total) if total > 0 else 1.0
    
    @property
    def engagement_ratio(self) -> float:
        sent = self.messages_sent_today
        received = self.received_messages
        return (received / sent) if sent > 0 else 0.0

class AccountSafetyManager:
    """Comprehensive account safety and spam prevention system"""
    
    def __init__(self):
        self.health_metrics = AccountHealthMetrics()
        self.message_history: deque = deque(maxlen=1000)  # Recent message tracking
        self.content_hashes: Set[str] = set()  # Detect duplicate content
        self.risk_thresholds = self._initialize_risk_thresholds()
        self.spam_keywords = self._load_spam_keywords()
        self.warmup_schedule = self._create_warmup_schedule()
        self.daily_reset_time = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        self.hourly_reset_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    
    def _initialize_risk_thresholds(self) -> Dict[str, Dict[RiskLevel, int]]:
        """Initialize risk thresholds for various metrics"""
        return {
            'messages_per_hour': {
                RiskLevel.LOW: 10,
                RiskLevel.MEDIUM: 20,
                RiskLevel.HIGH: 35,
                RiskLevel.CRITICAL: 50
            },
            'messages_per_day': {
                RiskLevel.LOW: 100,
                RiskLevel.MEDIUM: 200,
                RiskLevel.HIGH: 350,
                RiskLevel.CRITICAL: 500
            },
            'flood_waits_per_day': {
                RiskLevel.LOW: 0,
                RiskLevel.MEDIUM: 1,
                RiskLevel.HIGH: 3,
                RiskLevel.CRITICAL: 5
            },
            'failed_delivery_rate': {
                RiskLevel.LOW: 0.1,  # 10%
                RiskLevel.MEDIUM: 0.2,  # 20%
                RiskLevel.HIGH: 0.3,  # 30%
                RiskLevel.CRITICAL: 0.5  # 50%
            }
        }
    
    def _load_spam_keywords(self) -> List[str]:
        """Load spam keywords for content analysis"""
        return [
            'free money', 'get rich quick', 'limited time offer',
            'click here now', 'guaranteed profit', 'no risk',
            'make money fast', 'exclusive deal', 'urgent action required',
            'congratulations selected', 'winner announcement', 'claim prize',
            'crypto', 'bitcoin', 'investment', 'trading', 'forex'
        ]
    
    def _create_warmup_schedule(self) -> Dict[int, Dict[str, int]]:
        """Create account warm-up schedule by day"""
        return {
            1: {'max_messages': 5, 'max_groups': 1, 'delay_minutes': 30},
            2: {'max_messages': 8, 'max_groups': 1, 'delay_minutes': 25},
            3: {'max_messages': 12, 'max_groups': 2, 'delay_minutes': 20},
            4: {'max_messages': 16, 'max_groups': 2, 'delay_minutes': 18},
            5: {'max_messages': 20, 'max_groups': 3, 'delay_minutes': 15},
            7: {'max_messages': 30, 'max_groups': 4, 'delay_minutes': 12},
            14: {'max_messages': 50, 'max_groups': 5, 'delay_minutes': 10},
            30: {'max_messages': 100, 'max_groups': 8, 'delay_minutes': 8}
        }
    
    def _reset_daily_counters_if_needed(self):
        """Reset daily counters if a new day has started"""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if today_start > self.daily_reset_time:
            self.health_metrics.messages_sent_today = 0
            self.health_metrics.groups_joined_today = 0
            self.health_metrics.flood_waits_today = 0
            self.daily_reset_time = today_start
            logger.info("Daily counters reset")
    
    def _reset_hourly_counters_if_needed(self):
        """Reset hourly counters if a new hour has started"""
        now = datetime.now()
        hour_start = now.replace(minute=0, second=0, microsecond=0)
        
        if hour_start > self.hourly_reset_time:
            self.health_metrics.messages_sent_this_hour = 0
            self.hourly_reset_time = hour_start
            logger.debug("Hourly counters reset")
    
    async def assess_operation_risk(
        self,
        operation_type: str,
        recipient_count: int,
        content: str = None
    ) -> Tuple[RiskLevel, List[str]]:
        """Assess risk level for a planned operation"""
        
        # Reset counters if needed
        self._reset_daily_counters_if_needed()
        self._reset_hourly_counters_if_needed()
        
        risk_factors = []
        risk_scores = []
        
        # Evaluate current account health
        if operation_type == 'send_messages':
            # Check hourly limits
            projected_hourly = self.health_metrics.messages_sent_this_hour + recipient_count
            hourly_risk = self._evaluate_threshold('messages_per_hour', projected_hourly)
            risk_scores.append(hourly_risk)
            
            if hourly_risk != RiskLevel.LOW:
                risk_factors.append(f"Hourly message limit concern: {projected_hourly}")
            
            # Check daily limits
            projected_daily = self.health_metrics.messages_sent_today + recipient_count
            daily_risk = self._evaluate_threshold('messages_per_day', projected_daily)
            risk_scores.append(daily_risk)
            
            if daily_risk != RiskLevel.LOW:
                risk_factors.append(f"Daily message limit concern: {projected_daily}")
            
            # Analyze content if provided
            if content:
                content_risk = await self._analyze_content_risk(content)
                risk_scores.append(content_risk)
                
                if content_risk != RiskLevel.LOW:
                    risk_factors.append("Content contains spam indicators")
        
        # Check recent flood waits
        flood_wait_risk = self._evaluate_threshold('flood_waits_per_day', self.health_metrics.flood_waits_today)
        risk_scores.append(flood_wait_risk)
        
        if flood_wait_risk != RiskLevel.LOW:
            risk_factors.append(f"Recent flood waits: {self.health_metrics.flood_waits_today}")
        
        # Check success rate
        if self.health_metrics.success_rate < 0.8:  # Less than 80% success rate
            risk_scores.append(RiskLevel.HIGH)
            risk_factors.append(f"Low success rate: {self.health_metrics.success_rate:.2%}")
        
        # Determine overall risk level
        overall_risk = max(risk_scores) if risk_scores else RiskLevel.LOW
        
        return overall_risk, risk_factors
    
    def _evaluate_threshold(self, metric: str, value: int) -> RiskLevel:
        """Evaluate a metric against risk thresholds"""
        thresholds = self.risk_thresholds.get(metric, {})
        
        for risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW]:
            if value >= thresholds.get(risk_level, float('inf')):
                return risk_level
        
        return RiskLevel.LOW
    
    async def _analyze_content_risk(self, content: str) -> RiskLevel:
        """Analyze message content for spam indicators"""
        risk_score = 0
        
        # Calculate uniqueness based on content hash
        content_hash = hashlib.md5(content.lower().encode()).hexdigest()
        if content_hash in self.content_hashes:
            risk_score += 2  # Duplicate content penalty
        else:
            self.content_hashes.add(content_hash)
        
        # Count spam keywords
        content_lower = content.lower()
        spam_keyword_count = sum(1 for keyword in self.spam_keywords if keyword in content_lower)
        risk_score += spam_keyword_count * 1.5
        
        # Check message length
        length = len(content)
        if length < 10 or length > 500:  # Too short or too long
            risk_score += 1
        
        # Detect suspicious patterns
        suspicious_patterns = (
            content.count('!') > 3 or
            content.isupper() or
            len(set(content.replace(' ', ''))) < len(content) * 0.3  # Low character diversity
        )
        
        if suspicious_patterns:
            risk_score += 2
        
        # Map score to risk level
        if risk_score >= 8:
            return RiskLevel.CRITICAL
        elif risk_score >= 5:
            return RiskLevel.HIGH
        elif risk_score >= 2:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    async def should_proceed_with_operation(
        self,
        operation_type: str,
        recipient_count: int,
        content: str = None,
        force: bool = False
    ) -> Tuple[bool, List[str]]:
        """Determine if operation should proceed based on risk assessment"""
        
        if force:
            return True, ["Operation forced by user"]
        
        risk_level, risk_factors = await self.assess_operation_risk(
            operation_type, recipient_count, content
        )
        
        # Check warmup schedule for new accounts
        if self.health_metrics.account_age_days < 30:
            warmup_limits = self._get_warmup_limits(self.health_metrics.account_age_days)
            
            if operation_type == 'send_messages':
                if self.health_metrics.messages_sent_today + recipient_count > warmup_limits['max_messages']:
                    return False, ["Exceeds warmup phase message limits"]
        
        # Decision logic based on risk level
        if risk_level == RiskLevel.CRITICAL:
            return False, ["Operation blocked due to critical risk level"] + risk_factors
        elif risk_level == RiskLevel.HIGH:
            # Allow only small operations or if success rate is good
            if recipient_count > 10 or self.health_metrics.success_rate < 0.9:
                return False, ["Operation blocked due to high risk level"] + risk_factors
        elif risk_level == RiskLevel.MEDIUM:
            # Implement cooling-off period
            if self.health_metrics.last_flood_wait:
                time_since_flood = datetime.now() - self.health_metrics.last_flood_wait
                if time_since_flood < timedelta(hours=2):
                    return False, ["Cooling-off period after recent flood wait"] + risk_factors
        
        return True, risk_factors
    
    def _get_warmup_limits(self, account_age_days: int) -> Dict[str, int]:
        """Get appropriate limits for account warm-up phase"""
        for day_threshold in sorted(self.warmup_schedule.keys(), reverse=True):
            if account_age_days >= day_threshold:
                return self.warmup_schedule[day_threshold]
        
        return self.warmup_schedule[1]  # Default to most restrictive
    
    def update_metrics_after_operation(
        self,
        operation_type: str,
        results: Dict[str, Any],
        had_flood_wait: bool = False
    ):
        """Update health metrics after completing an operation"""
        
        self._reset_daily_counters_if_needed()
        self._reset_hourly_counters_if_needed()
        
        if operation_type == 'send_messages':
            sent_count = len(results.get('sent', []))
            failed_count = len(results.get('failed', []))
            
            self.health_metrics.messages_sent_today += sent_count
            self.health_metrics.messages_sent_this_hour += sent_count
            self.health_metrics.successful_deliveries += sent_count
            self.health_metrics.failed_deliveries += failed_count
            
            if had_flood_wait:
                self.health_metrics.flood_waits_today += 1
                self.health_metrics.last_flood_wait = datetime.now()
        
        # Record operation in history
        self.message_history.append({
            'timestamp': datetime.now(),
            'operation_type': operation_type,
            'results': results,
            'had_flood_wait': had_flood_wait
        })
    
    async def generate_safety_report(self) -> Dict[str, Any]:
        """Generate comprehensive safety and health report"""
        
        self._reset_daily_counters_if_needed()
        self._reset_hourly_counters_if_needed()
        
        current_risk, risk_factors = await self.assess_operation_risk('send_messages', 0)
        
        return {
            'account_health': {
                'messages_sent_today': self.health_metrics.messages_sent_today,
                'messages_sent_this_hour': self.health_metrics.messages_sent_this_hour,
                'success_rate': f"{self.health_metrics.success_rate:.2%}",
                'engagement_ratio': f"{self.health_metrics.engagement_ratio:.2%}",
                'flood_waits_today': self.health_metrics.flood_waits_today,
                'account_age_days': self.health_metrics.account_age_days
            },
            'current_risk_assessment': {
                'risk_level': current_risk.value,
                'risk_factors': risk_factors
            },
            'recommendations': self._generate_recommendations(current_risk),
            'warmup_status': self._get_warmup_status(),
            'report_timestamp': datetime.now().isoformat()
        }
    
    def _generate_recommendations(self, current_risk: RiskLevel) -> List[str]:
        """Generate safety recommendations based on current risk level"""
        recommendations = []
        
        if current_risk == RiskLevel.CRITICAL:
            recommendations.extend([
                "Stop all automated operations immediately",
                "Wait at least 24 hours before resuming activity",
                "Review and improve message content quality",
                "Consider using different account or IP address"
            ])
        elif current_risk == RiskLevel.HIGH:
            recommendations.extend([
                "Reduce operation frequency significantly",
                "Implement longer delays between messages",
                "Focus on recipients with established relationships",
                "Improve message personalization and relevance"
            ])
        elif current_risk == RiskLevel.MEDIUM:
            recommendations.extend([
                "Moderate operation pace for next few hours",
                "Monitor account health metrics closely",
                "Ensure message content is varied and natural",
                "Consider implementing recipient engagement tracking"
            ])
        else:  # LOW risk
            recommendations.extend([
                "Continue current operations with standard precautions",
                "Maintain good message quality and variation",
                "Monitor for any changes in success rates",
                "Gradually increase activity if needed"
            ])
        
        return recommendations
    
    def _get_warmup_status(self) -> Dict[str, Any]:
        """Get current warmup phase status"""
        if self.health_metrics.account_age_days >= 30:
            return {
                'phase': 'completed',
                'restrictions': 'none',
                'progress': '100%'
            }
        
        current_limits = self._get_warmup_limits(self.health_metrics.account_age_days)
        next_phase_days = None
        
        for day_threshold in sorted(self.warmup_schedule.keys()):
            if day_threshold > self.health_metrics.account_age_days:
                next_phase_days = day_threshold
                break
        
        return {
            'phase': f'day_{self.health_metrics.account_age_days}',
            'current_limits': current_limits,
            'next_phase_in_days': next_phase_days - self.health_metrics.account_age_days if next_phase_days else 0,
            'progress': f"{(self.health_metrics.account_age_days / 30) * 100:.1f}%"
        }