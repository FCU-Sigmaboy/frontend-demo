# Trophy & Achievement Design Recommendations

## Overview
This document provides comprehensive trophy/achievement design recommendations for the gamification system, including database design considerations for expandability and occasional promotion events.

## Trophy Categories & Complete List

### 1. Streak Badges (連續簽到類)
| Badge ID | Name | Icon | Description | Points | Rarity | Threshold |
|----------|------|------|-------------|--------|--------|-----------|
| `streak_7` | 連續簽到達人 | 🔥 | 連續簽到7天 | +20P | Common | 7 days |
| `streak_14` | 雙週堅持者 | ⭐ | 連續簽到14天 | +30P | Uncommon | 14 days |
| `streak_30` | 月度堅持者 | 🌟 | 連續簽到30天 | +50P | Rare | 30 days |
| `streak_60` | 雙月達人 | 💫 | 連續簽到60天 | +100P | Rare | 60 days |
| `streak_100` | 傳奇簽到王 | 👑 | 連續簽到100天 | +200P | Legendary | 100 days |
| `streak_365` | 年度簽到王 | 🏆 | 連續簽到365天 | +500P | Legendary | 365 days |

### 2. Transaction Badges (交易類)
| Badge ID | Name | Icon | Description | Points | Rarity | Threshold |
|----------|------|------|-------------|--------|--------|-----------|
| `first_sale` | 首次出售 | 🎉 | 完成第一筆交易 | +10P | Common | 1 sale |
| `first_purchase` | 首次購買 | 🛒 | 完成第一筆購買 | +10P | Common | 1 purchase |
| `seller_5` | 新手賣家 | 📦 | 完成5筆銷售 | +20P | Common | 5 sales |
| `seller_10` | 活躍賣家 | 💼 | 完成10筆銷售 | +30P | Uncommon | 10 sales |
| `seller_25` | 熟練賣家 | 📊 | 完成25筆銷售 | +50P | Uncommon | 25 sales |
| `seller_50` | 專業賣家 | 🏆 | 完成50筆銷售 | +100P | Rare | 50 sales |
| `seller_100` | 頂級賣家 | 💎 | 完成100筆銷售 | +200P | Epic | 100 sales |
| `buyer_5` | 購物新手 | 🛍️ | 完成5筆購買 | +15P | Common | 5 purchases |
| `buyer_10` | 購物達人 | 🛒 | 完成10筆購買 | +30P | Uncommon | 10 purchases |
| `buyer_25` | 購物專家 | 🎁 | 完成25筆購買 | +50P | Uncommon | 25 purchases |
| `buyer_50` | 購物大師 | 🏅 | 完成50筆購買 | +100P | Rare | 50 purchases |
| `transaction_100` | 百筆交易 | ⚡ | 累積完成100筆交易 | +150P | Rare | 100 total |
| `transaction_500` | 五百交易 | 🌟 | 累積完成500筆交易 | +300P | Epic | 500 total |

### 3. Points Accumulation Badges (點數累積類)
| Badge ID | Name | Icon | Description | Points | Rarity | Threshold |
|----------|------|------|-------------|--------|--------|-----------|
| `points_500` | 五百點達人 | 💰 | 累積賺取500點 | +20P | Common | 500 points |
| `points_1000` | 千點富翁 | 💵 | 累積賺取1000點 | +50P | Uncommon | 1000 points |
| `points_2500` | 兩千五百點 | 💸 | 累積賺取2500點 | +100P | Uncommon | 2500 points |
| `points_5000` | 萬點大亨 | 💎 | 累積賺取5000點 | +200P | Rare | 5000 points |
| `points_10000` | 萬點富翁 | 💍 | 累積賺取10000點 | +300P | Rare | 10000 points |
| `points_25000` | 兩萬五千點 | 👑 | 累積賺取25000點 | +500P | Epic | 25000 points |
| `points_50000` | 五萬點傳奇 | 🌟 | 累積賺取50000點 | +1000P | Legendary | 50000 points |

### 4. Special Achievement Badges (特殊成就類)
| Badge ID | Name | Icon | Description | Points | Rarity | Condition |
|----------|------|------|-------------|--------|--------|-----------|
| `early_adopter` | 早期用戶 | 🌱 | 平台早期註冊用戶 | +100P | Epic | Registration date < launch + 30 days |
| `perfect_rating` | 完美評價 | ⭐ | 獲得10個5星評價 | +50P | Rare | 10 five-star ratings |
| `fast_seller` | 快速賣家 | ⚡ | 24小時內完成交易 | +20P | Common | Complete sale within 24h |
| `community_helper` | 社區助手 | 🤝 | 幫助其他用戶10次 | +30P | Uncommon | Help others 10 times |
| `reviewer` | 評價達人 | ✍️ | 留下20個評價 | +25P | Uncommon | Leave 20 reviews |
| `photo_master` | 照片達人 | 📸 | 上傳50張商品照片 | +20P | Common | Upload 50 photos |
| `description_expert` | 描述專家 | 📝 | 撰寫詳細商品描述 | +15P | Common | Detailed descriptions |

### 5. Carbon Footprint Badges (環保類 - Already Implemented)
| Badge ID | Name | Icon | Description | Points | Rarity | Threshold |
|----------|------|------|-------------|--------|--------|-----------|
| `carbon_10` | 環保新手 | 🌿 | 減少10公斤碳排放 | +20P | Common | 10 kg |
| `carbon_50` | 環保達人 | 🌳 | 減少50公斤碳排放 | +50P | Uncommon | 50 kg |
| `carbon_100` | 環保高手 | 🌲 | 減少100公斤碳排放 | +100P | Rare | 100 kg |
| `carbon_200` | 環保大師 | 🌍 | 減少200公斤碳排放 | +200P | Epic | 200 kg |
| `carbon_500` | 環保傳奇 | 🌎 | 減少500公斤碳排放 | +500P | Legendary | 500 kg |

### 6. Seasonal/Event Badges (季節性/活動類 - Expandable)
| Badge ID | Name | Icon | Description | Points | Rarity | Event Type |
|----------|------|------|-------------|--------|--------|------------|
| `event_spring_2025` | 春季活動 | 🌸 | 參與2025春季活動 | +50P | Uncommon | Seasonal |
| `event_summer_2025` | 夏季活動 | ☀️ | 參與2025夏季活動 | +50P | Uncommon | Seasonal |
| `event_autumn_2025` | 秋季活動 | 🍂 | 參與2025秋季活動 | +50P | Uncommon | Seasonal |
| `event_winter_2025` | 冬季活動 | ❄️ | 參與2025冬季活動 | +50P | Uncommon | Seasonal |
| `event_anniversary` | 週年紀念 | 🎂 | 平台週年慶活動 | +100P | Rare | Anniversary |
| `event_black_friday` | 黑色星期五 | 🛍️ | 黑色星期五活動 | +75P | Uncommon | Promotion |
| `event_new_year` | 新年活動 | 🎊 | 新年特別活動 | +50P | Uncommon | Holiday |
| `event_earth_day` | 地球日 | 🌍 | 地球日環保活動 | +50P | Uncommon | Environmental |

## Database Design for Expandability

### Recommended Schema Structure

```sql
-- Badge Definitions Table (Configurable)
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

-- User Badges Table (Existing, but enhanced)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(badge_id),
  
  -- Denormalized for performance
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) NOT NULL,
  
  -- Tracking
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_rewarded INTEGER NOT NULL DEFAULT 0,
  
  -- Event tracking
  event_id VARCHAR(50), -- For event badges
  
  UNIQUE(user_id, badge_id),
  CONSTRAINT valid_rarity CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  ))
);

-- Event Definitions Table (For occasional promotions)
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

-- Badge Progress Tracking (For progress-based badges)
CREATE TABLE badge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(badge_id),
  current_progress INTEGER NOT NULL DEFAULT 0,
  target_progress INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

### API Design Recommendations

```javascript
// Get all available badges (including locked ones)
GET /api/gamification/badges/definitions
Response: {
  badges: [
    {
      badge_id: 'streak_7',
      category: 'streak',
      name: '連續簽到達人',
      icon: '🔥',
      description: '連續簽到7天',
      rarity: 'common',
      points_reward: 20,
      condition_type: 'threshold',
      condition_value: { threshold: 7, metric: 'streak_days' },
      is_active: true,
      is_earned: false, // User-specific
      progress: 5, // Current progress if applicable
      target: 7
    }
  ]
}

// Get user's earned badges
GET /api/gamification/badges/earned
Response: {
  badges: [
    {
      id: 'badge_1',
      badge_id: 'streak_7',
      name: '連續簽到達人',
      icon: '🔥',
      description: '連續簽到7天',
      rarity: 'common',
      earned_at: '2025-11-04T09:05:00Z',
      points_rewarded: 20
    }
  ]
}

// Get active events
GET /api/gamification/events/active
Response: {
  events: [
    {
      event_id: 'spring_2025',
      name: '春季活動',
      description: '參與春季活動獲得特殊徽章',
      start_date: '2025-03-01',
      end_date: '2025-05-31',
      badges: ['event_spring_2025']
    }
  ]
}

// Check and award badges (internal API)
POST /api/gamification/badges/check
Body: {
  user_id: 'uuid',
  trigger_type: 'transaction' | 'signin' | 'event' | 'manual',
  trigger_data: {}
}
```

## Level System Recommendations

### Current Levels (7 levels) - **SUFFICIENT**

The current 7-level system is well-balanced:
- **Level 1-2**: Beginner (0-999 points) - Easy to reach, keeps new users engaged
- **Level 3-4**: Intermediate (1000-4999 points) - Regular users
- **Level 5-6**: Advanced (5000-19999 points) - Active users
- **Level 7**: Master (20000+ points) - Long-term dedicated users

**Recommendation**: Keep 7 levels. Adding more would dilute the achievement value. The current progression is:
- Achievable for casual users (Level 1-3)
- Rewarding for regular users (Level 4-5)
- Prestigious for power users (Level 6-7)

## Trust Level System Recommendations

### Current Trust Levels (5 levels) - **ENOUGH for Scam Prevention**

The current 5-level system provides good protection:

| Tier | Name | Max Listing | Required Sales | Protection Level |
|------|------|-------------|----------------|-----------------|
| 1 | 新手賣家 | 500P | 0 | Basic items only |
| 2 | 可信賣家 | 1000P | 500P | Low-value items |
| 3 | 優質賣家 | 3000P | 2000P | Mid-value items |
| 4 | 金牌賣家 | 5000P | 5000P | High-value items |
| 5 | 鑽石賣家 | Unlimited | 15000P | Luxury items |

**Recommendation**: **5 levels are sufficient** for scam prevention because:
1. **Gradual Progression**: Users must complete real transactions to level up
2. **High Threshold for Luxury**: 15000P sales requirement prevents new accounts from listing expensive items
3. **Clear Boundaries**: Each tier has distinct limits that prevent abuse

**Optional Enhancement**: Consider adding a **"Verified Seller"** status (separate from trust level) that requires:
- ID verification
- Phone verification
- Bank account verification
- Minimum 6 months on platform
- No negative reviews in last 3 months

This would be a **manual verification** process, not automatic based on points.

## Backend Implementation Recommendations

### 1. Badge Checking System

```javascript
// Badge checking should be:
// - Automatic after relevant actions (transaction, signin)
// - Batch checkable for periodic evaluation
// - Event-triggered for seasonal badges

async function checkBadges(userId, triggerType, triggerData) {
  // Get all active badge definitions
  const badges = await getActiveBadgeDefinitions();
  
  // Get user's current stats
  const userStats = await getUserStats(userId);
  
  // Get user's earned badges
  const earnedBadges = await getUserEarnedBadges(userId);
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));
  
  // Check each badge
  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.badge_id)) continue;
    if (!badge.is_active) continue;
    
    // Check if badge applies to this trigger
    if (!shouldCheckBadge(badge, triggerType)) continue;
    
    // Evaluate condition
    if (evaluateBadgeCondition(badge, userStats, triggerData)) {
      await awardBadge(userId, badge);
    }
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
  const event = await getEvent(eventId);
  if (!event || !event.is_active) return;
  
  const now = new Date();
  if (now < event.start_date || now > event.end_date) return;
  
  // Check event-specific badges
  for (const badgeId of event.badge_ids) {
    const badge = await getBadgeDefinition(badgeId);
    if (badge && evaluateEventBadgeCondition(badge, userId, event)) {
      await awardBadge(userId, badge);
    }
  }
}
```

### 3. Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = true;
CREATE INDEX idx_event_definitions_dates ON event_definitions(start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_badge_progress_user_badge ON badge_progress(user_id, badge_id);
```

## Summary

1. **Trophy Design**: 50+ badge types across 6 categories, all expandable
2. **Database Design**: Flexible schema supporting event badges and custom conditions
3. **Level System**: 7 levels is sufficient - no changes needed
4. **Trust System**: 5 levels is enough for scam prevention - consider adding manual verification
5. **Event System**: Ready for seasonal/promotional badges with date-based activation

The system is designed to be **expandable** without requiring database schema changes for new badge types or events.



