# Backend API Design Recommendations

## Overview
This document provides backend team with API design recommendations for the gamification system, including database schema, API endpoints, and implementation guidelines.

## Database Schema Recommendations

### 1. Core Tables (Already Designed)

#### `user_points_profiles`
- Tracks user's points balance, level, trust, and streak
- **Status**: ✅ Already designed in design.md

#### `points_transactions`
- Immutable audit trail of all points operations
- **Status**: ✅ Already designed in design.md

#### `user_badges`
- Tracks earned badges per user
- **Status**: ✅ Already designed in design.md

#### `daily_signins`
- Tracks daily sign-in records
- **Status**: ✅ Already designed in design.md

#### `level_configs`
- Configuration table for level tiers
- **Status**: ✅ Already designed in design.md

#### `trust_level_configs`
- Configuration table for trust tiers
- **Status**: ✅ Already designed in design.md

### 2. New Tables for Expandability

#### `badge_definitions` (NEW - Recommended)
```sql
CREATE TABLE badge_definitions (
  badge_id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'streak', 'transaction', 'points', 'special', 'carbon', 'event'
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  points_reward INTEGER NOT NULL DEFAULT 0,
  
  -- Flexible condition tracking
  condition_type VARCHAR(50), -- 'threshold', 'date_range', 'event', 'custom'
  condition_value JSONB, -- Flexible JSON for different condition types
  
  -- Event badges
  event_id VARCHAR(50), -- NULL for non-event badges
  event_start_date DATE,
  event_end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = true;
```

**Purpose**: Allows adding new badges without code changes. All badge definitions stored in database.

#### `event_definitions` (NEW - Recommended)
```sql
CREATE TABLE event_definitions (
  event_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  badge_ids TEXT[], -- Array of badge_ids for this event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_definitions_dates ON event_definitions(start_date, end_date) WHERE is_active = true;
```

**Purpose**: Manages seasonal/promotional events and their associated badges.

#### `badge_progress` (NEW - Recommended)
```sql
CREATE TABLE badge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(badge_id),
  current_progress INTEGER NOT NULL DEFAULT 0,
  target_progress INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_badge_progress_user_badge ON badge_progress(user_id, badge_id);
```

**Purpose**: Tracks progress for badges that require multiple steps (e.g., "Complete 10 sales").

## API Endpoints Recommendations

### Points APIs

#### `GET /api/points/profile`
**Status**: ✅ Already designed
**Returns**: User points profile with balance, level, trust, streak

#### `GET /api/points/transactions`
**Status**: ✅ Already designed
**Query Params**: `type`, `startDate`, `endDate`, `page`, `size`
**Returns**: Paginated transaction list

### Gamification APIs

#### `POST /api/gamification/signin`
**Status**: ✅ Already designed
**Returns**: `{ success, points_awarded, streak_day, next_reward }`

#### `GET /api/gamification/badges/definitions` (NEW)
**Purpose**: Get all available badges (including locked ones)
**Query Params**: 
- `category` (optional): Filter by category
- `include_locked` (default: true): Include badges user hasn't earned
- `event_id` (optional): Filter by event

**Response**:
```json
{
  "badges": [
    {
      "badge_id": "streak_7",
      "category": "streak",
      "name": "連續簽到達人",
      "icon": "🔥",
      "description": "連續簽到7天",
      "rarity": "common",
      "points_reward": 20,
      "condition_type": "threshold",
      "condition_value": {
        "threshold": 7,
        "metric": "streak_days"
      },
      "is_active": true,
      "is_earned": false,
      "progress": 5,
      "target": 7
    }
  ]
}
```

#### `GET /api/gamification/badges/earned` (NEW)
**Purpose**: Get user's earned badges only
**Response**: Same structure as above, but only `is_earned: true` badges

#### `POST /api/gamification/badges/check` (NEW - Internal)
**Purpose**: Check and award badges after user actions
**Body**:
```json
{
  "user_id": "uuid",
  "trigger_type": "transaction" | "signin" | "event" | "manual",
  "trigger_data": {
    "transaction_id": "uuid",
    "amount": 500,
    "type": "sale_earning"
  }
}
```
**Returns**: `{ badges_awarded: [...], total_points: 50 }`

#### `GET /api/gamification/events/active` (NEW)
**Purpose**: Get currently active events
**Response**:
```json
{
  "events": [
    {
      "event_id": "spring_2025",
      "name": "春季活動",
      "description": "參與春季活動獲得特殊徽章",
      "start_date": "2025-03-01",
      "end_date": "2025-05-31",
      "badges": ["event_spring_2025"]
    }
  ]
}
```

### Trust Level APIs

#### `GET /api/trust/check-listing/:itemPrice`
**Status**: ✅ Already designed
**Returns**: `{ allowed, current_trust_level, required_trust_level, sales_needed }`

## Implementation Recommendations

### 1. Badge Checking System

```javascript
// Badge checking should be:
// - Automatic after relevant actions (transaction, signin)
// - Batch checkable for periodic evaluation
// - Event-triggered for seasonal badges

async function checkBadges(userId, triggerType, triggerData) {
  // Get all active badge definitions
  const badges = await supabase
    .from('badge_definitions')
    .select('*')
    .eq('is_active', true);
  
  // Get user's current stats
  const userStats = await getUserStats(userId);
  
  // Get user's earned badges
  const earnedBadges = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));
  
  const newBadges = [];
  
  // Check each badge
  for (const badge of badges.data) {
    if (earnedBadgeIds.has(badge.badge_id)) continue;
    
    // Check if badge applies to this trigger
    if (!shouldCheckBadge(badge, triggerType)) continue;
    
    // Evaluate condition
    if (await evaluateBadgeCondition(badge, userStats, triggerData)) {
      await awardBadge(userId, badge);
      newBadges.push(badge);
    }
  }
  
  return newBadges;
}

function shouldCheckBadge(badge, triggerType) {
  // Only check badges relevant to the trigger
  const triggerMap = {
    'transaction': ['transaction', 'points', 'special'],
    'signin': ['streak'],
    'event': ['event']
  };
  
  return triggerMap[triggerType]?.includes(badge.category);
}

async function evaluateBadgeCondition(badge, userStats, triggerData) {
  switch (badge.condition_type) {
    case 'threshold':
      const metric = badge.condition_value.metric;
      const threshold = badge.condition_value.threshold;
      return userStats[metric] >= threshold;
    
    case 'date_range':
      const now = new Date();
      return now >= new Date(badge.event_start_date) && 
             now <= new Date(badge.event_end_date);
    
    case 'event':
      const activeEvents = await getActiveEvents();
      return activeEvents.some(e => e.badge_ids.includes(badge.badge_id));
    
    default:
      return false;
  }
}
```

### 2. Event Badge System

```javascript
// Event badges should:
// - Only be available during event period
// - Automatically check when event starts
// - Have clear start/end dates

async function checkEventBadges(userId, eventId) {
  const event = await supabase
    .from('event_definitions')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .single();
  
  if (!event) return;
  
  const now = new Date();
  if (now < new Date(event.start_date) || now > new Date(event.end_date)) {
    return;
  }
  
  // Check event-specific badges
  for (const badgeId of event.badge_ids) {
    const badge = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('badge_id', badgeId)
      .single();
    
    if (badge && await evaluateEventBadgeCondition(badge, userId, event)) {
      await awardBadge(userId, badge);
    }
  }
}
```

### 3. Level System Recommendations

**Current Design**: 7 levels (新手交易者 → 大師交易者)
**Recommendation**: ✅ **Keep 7 levels** - This is sufficient and well-balanced.

**Reasoning**:
- Levels 1-2: Beginner (0-999 points) - Easy to reach
- Levels 3-4: Intermediate (1000-4999 points) - Regular users
- Levels 5-6: Advanced (5000-19999 points) - Active users
- Level 7: Master (20000+ points) - Long-term dedicated users

**No changes needed** - Current progression is optimal.

### 4. Trust Level System Recommendations

**Current Design**: 5 levels (新手賣家 → 鑽石賣家)
**Recommendation**: ✅ **5 levels are sufficient** for scam prevention.

**Current Trust Tiers**:
| Tier | Name | Max Listing | Required Sales | Protection Level |
|------|------|-------------|----------------|-----------------|
| 1 | 新手賣家 | 500P | 0 | Basic items only |
| 2 | 可信賣家 | 1000P | 500P | Low-value items |
| 3 | 優質賣家 | 3000P | 2000P | Mid-value items |
| 4 | 金牌賣家 | 5000P | 5000P | High-value items |
| 5 | 鑽石賣家 | Unlimited | 15000P | Luxury items |

**Why 5 Levels is Enough**:
1. **Gradual Progression**: Users must complete real transactions
2. **High Threshold for Luxury**: 15000P sales requirement prevents new accounts
3. **Clear Boundaries**: Each tier has distinct limits

**Optional Enhancement**: Consider adding a **"Verified Seller"** status (separate from trust level):
- Requires ID verification
- Phone verification
- Bank account verification
- Minimum 6 months on platform
- No negative reviews in last 3 months

This would be a **manual verification** process, not automatic.

### 5. Database Indexes (Performance)

```sql
-- User badges
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);

-- Badge definitions
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = true;

-- Events
CREATE INDEX idx_event_definitions_dates ON event_definitions(start_date, end_date) WHERE is_active = true;

-- Badge progress
CREATE INDEX idx_badge_progress_user_badge ON badge_progress(user_id, badge_id);
```

### 6. Transaction Points Processing

```javascript
// When transaction completes:
async function processTransactionPoints(transactionData) {
  const { seller_id, buyer_id, amount, transaction_id } = transactionData;
  
  // 1. Deduct from buyer
  await deductPoints(buyer_id, amount, {
    type: 'purchase_spending',
    description: `購買商品`,
    reference_type: 'transaction',
    reference_id: transaction_id
  });
  
  // 2. Award to seller
  await awardPoints(seller_id, amount, {
    type: 'sale_earning',
    description: `出售商品`,
    reference_type: 'transaction',
    reference_id: transaction_id
  });
  
  // 3. Update seller's total sales points
  await updateTotalSalesPoints(seller_id, amount);
  
  // 4. Check for level-ups and badges
  await checkLevelUp(seller_id);
  await checkBadges(seller_id, 'transaction', {
    transaction_id,
    amount,
    type: 'sale_earning'
  });
  await checkBadges(buyer_id, 'transaction', {
    transaction_id,
    amount,
    type: 'purchase_spending'
  });
  
  // 5. Check trust level
  await updateTrustLevel(seller_id);
}
```

## Summary

### Database Changes Needed
1. ✅ **Add `badge_definitions` table** - For expandable badge system
2. ✅ **Add `event_definitions` table** - For seasonal/promotional events
3. ✅ **Add `badge_progress` table** - For progress tracking
4. ✅ **Enhance `user_badges` table** - Add `event_id` field

### API Endpoints Needed
1. ✅ `GET /api/gamification/badges/definitions` - Get all badges
2. ✅ `GET /api/gamification/badges/earned` - Get earned badges
3. ✅ `POST /api/gamification/badges/check` - Check badges (internal)
4. ✅ `GET /api/gamification/events/active` - Get active events

### System Recommendations
1. ✅ **Level System**: Keep 7 levels - no changes needed
2. ✅ **Trust System**: Keep 5 levels - sufficient for scam prevention
3. ✅ **Badge System**: Use database-driven approach for expandability
4. ✅ **Event System**: Support date-based event badges

### Implementation Priority
1. **High Priority**: Core badge checking system
2. **Medium Priority**: Event badge system
3. **Low Priority**: Badge progress tracking (can be added later)

The system is designed to be **expandable** without requiring database schema changes for new badge types or events.



