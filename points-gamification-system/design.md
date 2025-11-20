# Points and Gamification System - Design Document

## Overview

The Points and Gamification System creates an engaging, trust-building economy within the trading platform. It combines a virtual points currency with game-like progression mechanics to incentivize user engagement, reward consistent participation, and establish seller credibility through earned trust levels.

### Key Design Principles

1. **Transparent Economy**: Clear point values and calculations visible to users
2. **Progressive Trust**: Gradual unlocking of privileges through earned reputation
3. **Engagement Rewards**: Daily activities and milestones provide consistent incentives
4. **Visual Feedback**: Progress indicators and achievements create satisfying user experience
5. **Anti-Gaming**: Safeguards prevent point manipulation and ensure legitimate trading

### Design Philosophy

Inspired by successful gamification systems (Duolingo streaks, Reddit karma, eBay seller ratings), the design focuses on:
- Immediate feedback for user actions
- Clear progression paths with visible milestones
- Social proof through badges and levels
- Balanced economy preventing inflation or exploitation

## Architecture

### High-Level System Structure

```
┌─────────────────────────────────────────────────────────────┐
│                Points & Gamification System                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Points     │  │ Gamification │  │    Trust     │      │
│  │   Engine     │  │    Engine    │  │   System     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│  ┌─────────────────────────┴──────────────────────────────┐ │
│  │              User Dashboard Components                   │ │
│  │  - Points Balance    - Transaction History              │ │
│  │  - Level Progress    - Badges & Achievements            │ │
│  │  - Trust Level       - Daily Streak                     │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────┴──────────────────────────────┐ │
│  │              API & Database Layer                       │ │
│  │  - Points Transactions  - User Stats                    │ │
│  │  - Achievements         - Configuration                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Points Flow Diagram

```
User Actions → Points Engine → Database → User Dashboard
     ↓              ↓              ↓            ↓
  Sign In      Calculate      Record      Update UI
  Complete     Validate       Audit       Show Feedback
  Transaction  Apply Rules    Trail       Trigger Rewards
```


## Components and Interfaces

### 1. User Dashboard Page

**Route**: `/dashboard` or `/profile/points`

**Purpose**: Central hub for all points, gamification, and trust information

**Layout Structure**:
```
┌──────────────────────────────────────────────────────────┐
│  ← 返回                    我的點數                       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Points Balance Card                               │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  💰 當前點數                                  │ │  │
│  │  │  500 P                                        │ │  │
│  │  │  ────────────────────────────────────────    │ │  │
│  │  │  本月賺取: +150P  |  本月花費: -50P         │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Gamification Progress                             │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  🔥 連續簽到: 7 天                            │ │  │
│  │  │  [████████░░] 明天簽到可獲得 15P             │ │  │
│  │  │                                                │ │  │
│  │  │  ⭐ 當前等級: 青銅交易者 (Lv 2)               │ │  │
│  │  │  [██████░░░░] 距離下一級還需 200P (60%)      │ │  │
│  │  │                                                │ │  │
│  │  │  🛡️ 信任等級: 新手賣家                        │ │  │
│  │  │  已解鎖: 可刊登 500P 以下商品                 │ │  │
│  │  │  下一級: 需累積 1000P 銷售額                  │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Badges & Achievements                             │  │
│  │  [🏆] [⭐] [💎] [🎯] [+12]                         │  │
│  │  最近解鎖: 連續簽到達人 (7天)                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Transaction History                               │  │
│  │  [全部] [收入] [支出] [獎勵]                       │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ +450P  出售 IKEA 檯燈                         │ │  │
│  │  │        2025/11/06 14:30                       │ │  │
│  │  │        餘額: 950P                             │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ -300P  購買 登山背包                          │ │  │
│  │  │        2025/11/05 10:15                       │ │  │
│  │  │        餘額: 500P                             │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  [載入更多...]                                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**State Management**:
```javascript
const dashboardState = reactive({
  user: null,
  pointsBalance: 0,
  monthlyEarnings: 0,
  monthlySpending: 0,
  dailyStreak: 0,
  currentLevel: null,
  trustLevel: null,
  badges: [],
  transactions: [],
  loading: false,
  error: null
})
```


### 2. Points Balance Card Component

**Purpose**: Display current points and monthly summary

**Props**:
```javascript
{
  balance: Number,
  monthlyEarnings: Number,
  monthlySpending: Number
}
```

**Features**:
- Large, prominent points display
- Monthly earnings/spending breakdown
- Animated number transitions
- Click to view detailed breakdown

### 3. Daily Streak Component

**Purpose**: Show consecutive sign-in days and next reward

**Props**:
```javascript
{
  streakDays: Number,
  nextReward: Number,
  lastSignIn: String
}
```

**Display Logic**:
- Show flame icon with streak count
- Progress bar to next milestone (7, 30, 100 days)
- Next reward amount
- "Sign In" button if not signed in today
- Celebration animation on milestone achievement

**Streak Rewards Table**:
```javascript
const STREAK_REWARDS = {
  1: 5,    // Day 1: 5 points
  2: 5,    // Day 2: 5 points
  3: 10,   // Day 3: 10 points
  7: 20,   // Day 7: 20 points (weekly milestone)
  14: 30,  // Day 14: 30 points
  30: 50,  // Day 30: 50 points (monthly milestone)
  100: 200 // Day 100: 200 points (legendary milestone)
}
```

### 4. Level Progress Component

**Purpose**: Display user level and progress to next level

**Props**:
```javascript
{
  currentLevel: {
    tier: Number,
    name: String,
    icon: String,
    minPoints: Number,
    maxPoints: Number
  },
  totalEarnedPoints: Number
}
```

**Level Tiers**:
```javascript
const LEVEL_TIERS = [
  { tier: 1, name: '新手交易者', icon: '🌱', minPoints: 0, maxPoints: 499, bonus: 0 },
  { tier: 2, name: '青銅交易者', icon: '🥉', minPoints: 500, maxPoints: 999, bonus: 50 },
  { tier: 3, name: '白銀交易者', icon: '🥈', minPoints: 1000, maxPoints: 2499, bonus: 100 },
  { tier: 4, name: '黃金交易者', icon: '🥇', minPoints: 2500, maxPoints: 4999, bonus: 200 },
  { tier: 5, name: '鉑金交易者', icon: '💎', minPoints: 5000, maxPoints: 9999, bonus: 500 },
  { tier: 6, name: '鑽石交易者', icon: '💠', minPoints: 10000, maxPoints: 19999, bonus: 1000 },
  { tier: 7, name: '大師交易者', icon: '👑', minPoints: 20000, maxPoints: Infinity, bonus: 2000 }
]
```

**Features**:
- Visual progress bar
- Percentage completion
- Points needed to next level
- Level-up animation with confetti
- Bonus points awarded on level-up

### 5. Trust Level Component

**Purpose**: Display seller trust level and listing capabilities

**Props**:
```javascript
{
  trustLevel: {
    tier: Number,
    name: String,
    maxListingValue: Number,
    totalSalesPoints: Number
  }
}
```

**Trust Tiers**:
```javascript
const TRUST_TIERS = [
  { tier: 1, name: '新手賣家', maxListingValue: 500, requiredSales: 0 },
  { tier: 2, name: '可信賣家', maxListingValue: 1000, requiredSales: 500 },
  { tier: 3, name: '優質賣家', maxListingValue: 3000, requiredSales: 2000 },
  { tier: 4, name: '金牌賣家', maxListingValue: 5000, requiredSales: 5000 },
  { tier: 5, name: '鑽石賣家', maxListingValue: Infinity, requiredSales: 15000 }
]
```

**Features**:
- Shield icon with tier indicator
- Current listing limit display
- Progress to next tier
- Tooltip explaining trust system
- Warning when attempting to list above limit


### 6. Badges & Achievements Component

**Purpose**: Display earned badges and recent achievements

**Props**:
```javascript
{
  badges: Array<{
    id: String,
    name: String,
    icon: String,
    description: String,
    earnedAt: String,
    rarity: String
  }>,
  recentAchievements: Array
}
```

**Badge Categories**:
```javascript
const BADGE_DEFINITIONS = {
  // Streak Badges
  'streak_7': { name: '連續簽到達人', icon: '🔥', description: '連續簽到7天', rarity: 'common' },
  'streak_30': { name: '月度堅持者', icon: '🌟', description: '連續簽到30天', rarity: 'rare' },
  'streak_100': { name: '傳奇簽到王', icon: '👑', description: '連續簽到100天', rarity: 'legendary' },
  
  // Transaction Badges
  'first_sale': { name: '首次出售', icon: '🎉', description: '完成第一筆交易', rarity: 'common' },
  'seller_10': { name: '活躍賣家', icon: '💼', description: '完成10筆銷售', rarity: 'uncommon' },
  'seller_50': { name: '專業賣家', icon: '🏆', description: '完成50筆銷售', rarity: 'rare' },
  'buyer_10': { name: '購物達人', icon: '🛍️', description: '完成10筆購買', rarity: 'uncommon' },
  
  // Points Badges
  'points_1000': { name: '千點富翁', icon: '💰', description: '累積賺取1000點', rarity: 'uncommon' },
  'points_5000': { name: '萬點大亨', icon: '💎', description: '累積賺取5000點', rarity: 'rare' },
  
  // Special Badges
  'early_adopter': { name: '早期用戶', icon: '🌱', description: '平台早期註冊用戶', rarity: 'epic' },
  'perfect_rating': { name: '完美評價', icon: '⭐', description: '獲得10個5星評價', rarity: 'rare' }
}
```

**Features**:
- Grid display of earned badges
- Hover to see badge details
- Click to view badge requirements
- Recent achievements notification
- Badge rarity color coding

### 7. Transaction History Component

**Purpose**: Display all point transactions with filtering

**Props**:
```javascript
{
  transactions: Array<{
    id: String,
    type: String,
    amount: Number,
    description: String,
    timestamp: String,
    balanceAfter: Number,
    metadata: Object
  }>,
  filters: Object
}
```

**Transaction Types**:
```javascript
const TRANSACTION_TYPES = {
  WELCOME_BONUS: { label: '新手禮包', icon: '🎁', color: 'purple' },
  SALE_EARNING: { label: '出售收入', icon: '💰', color: 'green' },
  PURCHASE_SPENDING: { label: '購買支出', icon: '🛒', color: 'red' },
  DAILY_SIGNIN: { label: '每日簽到', icon: '📅', color: 'blue' },
  LEVEL_BONUS: { label: '升級獎勵', icon: '⭐', color: 'gold' },
  BADGE_REWARD: { label: '成就獎勵', icon: '🏆', color: 'orange' },
  ADMIN_ADJUSTMENT: { label: '管理員調整', icon: '⚙️', color: 'gray' }
}
```

**Features**:
- Tab filtering (All, Income, Spending, Rewards)
- Date range picker
- Search by description
- Infinite scroll pagination
- Export to CSV
- Transaction detail modal

### 8. Header Points Display

**Purpose**: Show points balance in main navigation header

**Location**: Top navigation bar, next to profile icon

**Display**:
```
┌────────────────────────────────────────┐
│  [Logo]  [Search]      [💰 500P] [👤]  │
└────────────────────────────────────────┘
```

**Features**:
- Click to open User Dashboard
- Animated number changes
- Tooltip showing recent change
- Badge notification dot for new achievements


## Data Models

### User Points Profile

```typescript
interface UserPointsProfile {
  user_id: string;
  
  // Points
  current_balance: number;
  total_earned: number;
  total_spent: number;
  
  // Gamification
  daily_streak: number;
  last_signin_date: string;
  current_level_tier: number;
  
  // Trust
  trust_level_tier: number;
  total_sales_points: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}
```

### Points Transaction

```typescript
interface PointsTransaction {
  id: string;
  user_id: string;
  
  // Transaction details
  type: TransactionType;
  amount: number;  // Positive for earnings, negative for spending
  description: string;
  
  // Balance tracking
  balance_before: number;
  balance_after: number;
  
  // References
  reference_type?: string;  // 'item', 'transaction', 'badge', etc.
  reference_id?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  created_at: string;
  created_by?: string;  // For admin adjustments
}

enum TransactionType {
  WELCOME_BONUS = 'welcome_bonus',
  SALE_EARNING = 'sale_earning',
  PURCHASE_SPENDING = 'purchase_spending',
  DAILY_SIGNIN = 'daily_signin',
  LEVEL_BONUS = 'level_bonus',
  BADGE_REWARD = 'badge_reward',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  REFUND = 'refund'
}
```

### User Badge

```typescript
interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  
  // Badge details
  name: string;
  icon: string;
  description: string;
  rarity: BadgeRarity;
  
  // Tracking
  earned_at: string;
  points_rewarded: number;
}

enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}
```

### Daily Sign-In Record

```typescript
interface DailySignIn {
  id: string;
  user_id: string;
  signin_date: string;  // YYYY-MM-DD format
  points_awarded: number;
  streak_day: number;
  created_at: string;
}
```

### Level Configuration

```typescript
interface LevelConfig {
  tier: number;
  name: string;
  icon: string;
  min_points: number;
  max_points: number;
  bonus_points: number;
}
```

### Trust Level Configuration

```typescript
interface TrustLevelConfig {
  tier: number;
  name: string;
  max_listing_value: number;
  required_sales_points: number;
}
```


## Database Schema

### New Tables

#### `user_points_profiles` table

```sql
CREATE TABLE user_points_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Points
  current_balance INTEGER NOT NULL DEFAULT 500,
  total_earned INTEGER NOT NULL DEFAULT 500,
  total_spent INTEGER NOT NULL DEFAULT 0,
  
  -- Gamification
  daily_streak INTEGER NOT NULL DEFAULT 0,
  last_signin_date DATE,
  current_level_tier INTEGER NOT NULL DEFAULT 1,
  
  -- Trust
  trust_level_tier INTEGER NOT NULL DEFAULT 1,
  total_sales_points INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_balance CHECK (current_balance >= 0),
  CONSTRAINT valid_level CHECK (current_level_tier >= 1 AND current_level_tier <= 7),
  CONSTRAINT valid_trust CHECK (trust_level_tier >= 1 AND trust_level_tier <= 5)
);

CREATE INDEX idx_user_points_balance ON user_points_profiles(current_balance);
CREATE INDEX idx_user_points_level ON user_points_profiles(current_level_tier);
CREATE INDEX idx_user_points_trust ON user_points_profiles(trust_level_tier);
```

#### `points_transactions` table

```sql
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Balance tracking
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- References
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT valid_transaction_type CHECK (type IN (
    'welcome_bonus', 'sale_earning', 'purchase_spending',
    'daily_signin', 'level_bonus', 'badge_reward',
    'admin_adjustment', 'refund'
  ))
);

CREATE INDEX idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_type ON points_transactions(type);
CREATE INDEX idx_points_transactions_created ON points_transactions(created_at DESC);
CREATE INDEX idx_points_transactions_reference ON points_transactions(reference_type, reference_id);
```

#### `user_badges` table

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL,
  
  -- Badge details (denormalized for performance)
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) NOT NULL,
  
  -- Tracking
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_rewarded INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(user_id, badge_id),
  CONSTRAINT valid_rarity CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  ))
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);
```

#### `daily_signins` table

```sql
CREATE TABLE daily_signins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signin_date DATE NOT NULL,
  points_awarded INTEGER NOT NULL,
  streak_day INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, signin_date)
);

CREATE INDEX idx_daily_signins_user ON daily_signins(user_id);
CREATE INDEX idx_daily_signins_date ON daily_signins(signin_date DESC);
```

#### `level_configs` table (Configuration)

```sql
CREATE TABLE level_configs (
  tier INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  min_points INTEGER NOT NULL,
  max_points INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT valid_tier CHECK (tier >= 1),
  CONSTRAINT valid_range CHECK (max_points > min_points)
);

-- Insert default levels
INSERT INTO level_configs (tier, name, icon, min_points, max_points, bonus_points) VALUES
(1, '新手交易者', '🌱', 0, 499, 0),
(2, '青銅交易者', '🥉', 500, 999, 50),
(3, '白銀交易者', '🥈', 1000, 2499, 100),
(4, '黃金交易者', '🥇', 2500, 4999, 200),
(5, '鉑金交易者', '💎', 5000, 9999, 500),
(6, '鑽石交易者', '💠', 10000, 19999, 1000),
(7, '大師交易者', '👑', 20000, 2147483647, 2000);
```

#### `trust_level_configs` table (Configuration)

```sql
CREATE TABLE trust_level_configs (
  tier INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  max_listing_value INTEGER NOT NULL,
  required_sales_points INTEGER NOT NULL,
  
  CONSTRAINT valid_tier CHECK (tier >= 1)
);

-- Insert default trust levels
INSERT INTO trust_level_configs (tier, name, max_listing_value, required_sales_points) VALUES
(1, '新手賣家', 500, 0),
(2, '可信賣家', 1000, 500),
(3, '優質賣家', 3000, 2000),
(4, '金牌賣家', 5000, 5000),
(5, '鑽石賣家', 2147483647, 15000);
```

### Database Triggers

#### Auto-create points profile on user registration

```sql
CREATE OR REPLACE FUNCTION create_user_points_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_points_profiles (user_id, current_balance, total_earned)
  VALUES (NEW.id, 500, 500);
  
  INSERT INTO points_transactions (
    user_id, type, amount, description,
    balance_before, balance_after
  ) VALUES (
    NEW.id, 'welcome_bonus', 500, '新手禮包',
    0, 500
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_points_profile
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_points_profile();
```

#### Update timestamp on profile changes

```sql
CREATE OR REPLACE FUNCTION update_points_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_points_timestamp
BEFORE UPDATE ON user_points_profiles
FOR EACH ROW
EXECUTE FUNCTION update_points_profile_timestamp();
```


## API Endpoints

### Points APIs

#### Get User Points Profile

```typescript
// GET /api/points/profile
getUserPointsProfile(): Promise<UserPointsProfile>

// Response
{
  user_id: "uuid",
  current_balance: 500,
  total_earned: 1200,
  total_spent: 700,
  daily_streak: 7,
  last_signin_date: "2025-11-06",
  current_level_tier: 2,
  trust_level_tier: 1,
  total_sales_points: 450
}
```

#### Get Points Transactions

```typescript
// GET /api/points/transactions
getPointsTransactions(params: {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<{
  transactions: PointsTransaction[];
  total: number;
  page: number;
}>

// Response
{
  transactions: [
    {
      id: "uuid",
      type: "sale_earning",
      amount: 450,
      description: "出售 IKEA 檯燈",
      balance_before: 500,
      balance_after: 950,
      reference_type: "transaction",
      reference_id: "trans-uuid",
      created_at: "2025-11-06T14:30:00Z"
    }
  ],
  total: 25,
  page: 1
}
```

#### Process Transaction Points

```typescript
// POST /api/points/process-transaction
// Called internally when transaction completes
processTransactionPoints(data: {
  transaction_id: string;
  seller_id: string;
  buyer_id: string;
  amount: number;
}): Promise<{
  seller_points: number;
  buyer_points: number;
}>

// Implementation
async function processTransactionPoints(data) {
  const { transaction_id, seller_id, buyer_id, amount } = data;
  
  // Deduct points from buyer
  await deductPoints(buyer_id, amount, {
    type: 'purchase_spending',
    description: `購買商品`,
    reference_type: 'transaction',
    reference_id: transaction_id
  });
  
  // Award points to seller
  await awardPoints(seller_id, amount, {
    type: 'sale_earning',
    description: `出售商品`,
    reference_type: 'transaction',
    reference_id: transaction_id
  });
  
  // Update seller's total sales points for trust level
  await updateTotalSalesPoints(seller_id, amount);
  
  // Check for level-ups and badge achievements
  await checkLevelUp(seller_id);
  await checkBadges(seller_id);
  
  return {
    seller_points: await getBalance(seller_id),
    buyer_points: await getBalance(buyer_id)
  };
}
```

### Gamification APIs

#### Daily Sign-In

```typescript
// POST /api/gamification/signin
dailySignIn(): Promise<{
  success: boolean;
  points_awarded: number;
  streak_day: number;
  next_reward: number;
}>

// Implementation
async function dailySignIn(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already signed in today
  const existingSignIn = await supabase
    .from('daily_signins')
    .select('id')
    .eq('user_id', userId)
    .eq('signin_date', today)
    .maybeSingle();
  
  if (existingSignIn) {
    throw new Error('今天已經簽到過了');
  }
  
  // Get user profile
  const profile = await getUserPointsProfile(userId);
  
  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newStreak = 1;
  if (profile.last_signin_date === yesterdayStr) {
    newStreak = profile.daily_streak + 1;
  }
  
  // Calculate points based on streak
  const pointsAwarded = calculateStreakReward(newStreak);
  
  // Record sign-in
  await supabase
    .from('daily_signins')
    .insert({
      user_id: userId,
      signin_date: today,
      points_awarded: pointsAwarded,
      streak_day: newStreak
    });
  
  // Award points
  await awardPoints(userId, pointsAwarded, {
    type: 'daily_signin',
    description: `每日簽到 (第 ${newStreak} 天)`,
    reference_type: 'signin',
    reference_id: today
  });
  
  // Update profile
  await supabase
    .from('user_points_profiles')
    .update({
      daily_streak: newStreak,
      last_signin_date: today
    })
    .eq('user_id', userId);
  
  // Check for streak badges
  await checkStreakBadges(userId, newStreak);
  
  return {
    success: true,
    points_awarded: pointsAwarded,
    streak_day: newStreak,
    next_reward: calculateStreakReward(newStreak + 1)
  };
}

function calculateStreakReward(day: number): number {
  if (day === 1 || day === 2) return 5;
  if (day === 3) return 10;
  if (day === 7) return 20;
  if (day === 14) return 30;
  if (day === 30) return 50;
  if (day === 100) return 200;
  
  // Default: 5 points for regular days
  return 5;
}
```

#### Get User Badges

```typescript
// GET /api/gamification/badges
getUserBadges(): Promise<UserBadge[]>

// Response
[
  {
    id: "uuid",
    badge_id: "streak_7",
    name: "連續簽到達人",
    icon: "🔥",
    description: "連續簽到7天",
    rarity: "common",
    earned_at: "2025-11-06T10:00:00Z",
    points_rewarded: 20
  }
]
```

#### Check and Award Badges

```typescript
// Internal function called after various actions
async function checkBadges(userId: string) {
  const profile = await getUserPointsProfile(userId);
  const transactions = await getTransactionStats(userId);
  
  const badgesToCheck = [
    // Streak badges
    { id: 'streak_7', condition: profile.daily_streak >= 7, points: 20 },
    { id: 'streak_30', condition: profile.daily_streak >= 30, points: 50 },
    { id: 'streak_100', condition: profile.daily_streak >= 100, points: 200 },
    
    // Transaction badges
    { id: 'first_sale', condition: transactions.total_sales >= 1, points: 10 },
    { id: 'seller_10', condition: transactions.total_sales >= 10, points: 50 },
    { id: 'seller_50', condition: transactions.total_sales >= 50, points: 200 },
    { id: 'buyer_10', condition: transactions.total_purchases >= 10, points: 30 },
    
    // Points badges
    { id: 'points_1000', condition: profile.total_earned >= 1000, points: 50 },
    { id: 'points_5000', condition: profile.total_earned >= 5000, points: 200 }
  ];
  
  for (const badge of badgesToCheck) {
    if (badge.condition) {
      await awardBadgeIfNew(userId, badge.id, badge.points);
    }
  }
}

async function awardBadgeIfNew(userId: string, badgeId: string, points: number) {
  // Check if badge already earned
  const existing = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();
  
  if (existing) return;
  
  // Get badge definition
  const badgeDef = BADGE_DEFINITIONS[badgeId];
  
  // Award badge
  await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      name: badgeDef.name,
      icon: badgeDef.icon,
      description: badgeDef.description,
      rarity: badgeDef.rarity,
      points_rewarded: points
    });
  
  // Award points
  await awardPoints(userId, points, {
    type: 'badge_reward',
    description: `獲得成就: ${badgeDef.name}`,
    reference_type: 'badge',
    reference_id: badgeId
  });
  
  // Trigger notification
  await sendBadgeNotification(userId, badgeDef);
}
```


### Trust Level APIs

#### Check Listing Permission

```typescript
// GET /api/trust/check-listing/:itemPrice
checkListingPermission(itemPrice: number): Promise<{
  allowed: boolean;
  current_trust_level: TrustLevelConfig;
  required_trust_level?: TrustLevelConfig;
  sales_needed?: number;
}>

// Implementation
async function checkListingPermission(userId: string, itemPrice: number) {
  const profile = await getUserPointsProfile(userId);
  const trustConfig = await getTrustLevelConfig(profile.trust_level_tier);
  
  if (itemPrice <= trustConfig.max_listing_value) {
    return {
      allowed: true,
      current_trust_level: trustConfig
    };
  }
  
  // Find required trust level
  const requiredLevel = await supabase
    .from('trust_level_configs')
    .select('*')
    .gte('max_listing_value', itemPrice)
    .order('tier', { ascending: true })
    .limit(1)
    .single();
  
  const salesNeeded = requiredLevel.required_sales_points - profile.total_sales_points;
  
  return {
    allowed: false,
    current_trust_level: trustConfig,
    required_trust_level: requiredLevel,
    sales_needed: Math.max(0, salesNeeded)
  };
}
```

#### Update Trust Level

```typescript
// Internal function called after sales
async function updateTrustLevel(userId: string) {
  const profile = await getUserPointsProfile(userId);
  
  // Find appropriate trust level
  const newTrustLevel = await supabase
    .from('trust_level_configs')
    .select('*')
    .lte('required_sales_points', profile.total_sales_points)
    .order('tier', { ascending: false })
    .limit(1)
    .single();
  
  if (newTrustLevel.tier > profile.trust_level_tier) {
    // Level up!
    await supabase
      .from('user_points_profiles')
      .update({ trust_level_tier: newTrustLevel.tier })
      .eq('user_id', userId);
    
    // Send notification
    await sendTrustLevelUpNotification(userId, newTrustLevel);
  }
}
```

### Level System APIs

#### Check Level Up

```typescript
// Internal function called after earning points
async function checkLevelUp(userId: string) {
  const profile = await getUserPointsProfile(userId);
  
  // Find appropriate level
  const newLevel = await supabase
    .from('level_configs')
    .select('*')
    .lte('min_points', profile.total_earned)
    .lte('max_points', profile.total_earned)
    .single();
  
  if (newLevel.tier > profile.current_level_tier) {
    // Level up!
    await supabase
      .from('user_points_profiles')
      .update({ current_level_tier: newLevel.tier })
      .eq('user_id', userId);
    
    // Award bonus points
    if (newLevel.bonus_points > 0) {
      await awardPoints(userId, newLevel.bonus_points, {
        type: 'level_bonus',
        description: `升級至 ${newLevel.name}`,
        reference_type: 'level',
        reference_id: newLevel.tier.toString()
      });
    }
    
    // Send notification
    await sendLevelUpNotification(userId, newLevel);
  }
}
```

### Core Points Functions

#### Award Points

```typescript
async function awardPoints(
  userId: string,
  amount: number,
  details: {
    type: TransactionType;
    description: string;
    reference_type?: string;
    reference_id?: string;
    metadata?: any;
  }
): Promise<void> {
  // Get current balance
  const profile = await getUserPointsProfile(userId);
  const balanceBefore = profile.current_balance;
  const balanceAfter = balanceBefore + amount;
  
  // Create transaction record
  await supabase
    .from('points_transactions')
    .insert({
      user_id: userId,
      type: details.type,
      amount: amount,
      description: details.description,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: details.reference_type,
      reference_id: details.reference_id,
      metadata: details.metadata
    });
  
  // Update profile
  await supabase
    .from('user_points_profiles')
    .update({
      current_balance: balanceAfter,
      total_earned: profile.total_earned + amount
    })
    .eq('user_id', userId);
}
```

#### Deduct Points

```typescript
async function deductPoints(
  userId: string,
  amount: number,
  details: {
    type: TransactionType;
    description: string;
    reference_type?: string;
    reference_id?: string;
    metadata?: any;
  }
): Promise<void> {
  // Get current balance
  const profile = await getUserPointsProfile(userId);
  const balanceBefore = profile.current_balance;
  
  // Check sufficient balance
  if (balanceBefore < amount) {
    throw new Error('點數不足');
  }
  
  const balanceAfter = balanceBefore - amount;
  
  // Create transaction record
  await supabase
    .from('points_transactions')
    .insert({
      user_id: userId,
      type: details.type,
      amount: -amount,  // Negative for spending
      description: details.description,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: details.reference_type,
      reference_id: details.reference_id,
      metadata: details.metadata
    });
  
  // Update profile
  await supabase
    .from('user_points_profiles')
    .update({
      current_balance: balanceAfter,
      total_spent: profile.total_spent + amount
    })
    .eq('user_id', userId);
}
```


## User Flows

### Flow 1: New User Registration

```
User completes registration
  ↓
Database trigger fires
  ↓
Create user_points_profile with 500 points
  ↓
Create welcome_bonus transaction record
  ↓
User sees "🎉 歡迎！您已獲得 500 點新手禮包" notification
  ↓
User navigates to dashboard
  ↓
Dashboard shows 500P balance and Level 1 status
```

### Flow 2: Daily Sign-In

```
User opens app/website
  ↓
Check if signed in today
  ├─ Yes → Show "已簽到" status
  └─ No  → Show "簽到" button in header or dashboard
           ↓
           User clicks "簽到"
           ↓
           Call dailySignIn() API
           ↓
           Calculate streak and reward
           ↓
           Award points
           ↓
           Update profile (streak, last_signin_date)
           ↓
           Check for streak badges (7, 30, 100 days)
           ↓
           Show success animation with points earned
           ↓
           Update header points display
```

### Flow 3: Complete Transaction (Buyer)

```
Buyer confirms purchase in transaction flow
  ↓
Check buyer has sufficient points
  ├─ No  → Show error: "點數不足，當前餘額: XP"
  │        Suggest: "前往賺取點數" link to dashboard
  │
  └─ Yes → Proceed with transaction
           ↓
           Deduct points from buyer
           ↓
           Create purchase_spending transaction record
           ↓
           Update buyer's current_balance and total_spent
           ↓
           Show success: "交易完成！已扣除 XP"
           ↓
           Update header points display
```

### Flow 4: Complete Transaction (Seller)

```
Transaction completes successfully
  ↓
Award points to seller (equal to item price)
  ↓
Create sale_earning transaction record
  ↓
Update seller's current_balance and total_earned
  ↓
Update seller's total_sales_points
  ↓
Check for level-up
  ├─ Level up detected
  │  ↓
  │  Update current_level_tier
  │  ↓
  │  Award bonus points
  │  ↓
  │  Show level-up animation: "🎉 恭喜升級至 [Level Name]！"
  │  ↓
  │  Show bonus points notification
  │
  └─ No level up
     ↓
     Check for trust level update
     ├─ Trust level up
     │  ↓
     │  Update trust_level_tier
     │  ↓
     │  Show notification: "🛡️ 信任等級提升！現在可刊登 XP 以下商品"
     │
     └─ No trust level up
        ↓
        Check for badges (first_sale, seller_10, etc.)
        ├─ New badge earned
        │  ↓
        │  Award badge
        │  ↓
        │  Award badge points
        │  ↓
        │  Show badge notification with animation
        │
        └─ No new badges
           ↓
           Show simple success: "已獲得 XP"
```

### Flow 5: Attempt to List High-Value Item

```
Seller creates new listing
  ↓
Enter item price
  ↓
Call checkListingPermission(itemPrice)
  ↓
Check if price <= max_listing_value for current trust level
  ├─ Yes → Allow listing
  │        Show: "✓ 可刊登此價格商品"
  │
  └─ No  → Block listing
           ↓
           Show modal:
           "⚠️ 信任等級不足
            
            當前等級: [Current Level]
            可刊登上限: [Max Value]P
            
            此商品價格: [Item Price]P
            需要等級: [Required Level]
            還需銷售: [Sales Needed]P
            
            [查看如何提升信任等級]"
           ↓
           User clicks "查看如何提升信任等級"
           ↓
           Navigate to dashboard trust section
           ↓
           Show trust level progression and tips
```

### Flow 6: View Dashboard

```
User clicks points icon in header
  ↓
Navigate to /dashboard
  ↓
Load user points profile
  ↓
Load recent transactions (last 20)
  ↓
Load user badges
  ↓
Calculate level progress percentage
  ↓
Calculate trust level progress
  ↓
Display all information in dashboard
  ↓
User can:
  - View detailed transaction history
  - Filter transactions by type
  - Export transaction history
  - View all earned badges
  - See progress to next level/trust tier
  - Check daily streak status
```


## Error Handling

### Error Scenarios

1. **Insufficient Points for Purchase**
   ```javascript
   if (buyer.current_balance < itemPrice) {
     throw new Error('INSUFFICIENT_POINTS');
     // UI shows: "點數不足，當前餘額: 250P，需要: 500P"
     // Provide link to earn more points
   }
   ```

2. **Already Signed In Today**
   ```javascript
   if (hasSignedInToday) {
     throw new Error('ALREADY_SIGNED_IN');
     // UI shows: "今天已經簽到過了，明天再來吧！"
     // Show next sign-in time
   }
   ```

3. **Trust Level Insufficient for Listing**
   ```javascript
   if (itemPrice > trustLevel.max_listing_value) {
     throw new Error('TRUST_LEVEL_INSUFFICIENT');
     // UI shows modal with current/required trust level
     // Show how many sales needed
   }
   ```

4. **Concurrent Transaction Conflict**
   ```javascript
   // Use database transactions to prevent race conditions
   await supabase.rpc('deduct_points_atomic', {
     user_id: userId,
     amount: amount
   });
   
   // If balance becomes negative, rollback
   ```

5. **Invalid Points Amount**
   ```javascript
   if (amount <= 0 || !Number.isInteger(amount)) {
     throw new Error('INVALID_AMOUNT');
     // UI shows: "點數金額無效"
   }
   ```

6. **Badge Already Earned**
   ```javascript
   // Silently skip if badge already exists
   // No error thrown, just log for debugging
   ```

### Error Handling Pattern

```javascript
async function handlePointsOperation(operation) {
  try {
    const result = await operation();
    
    // Show success feedback
    showToast({
      title: '成功',
      message: result.message,
      variant: 'success',
      icon: '✓'
    });
    
    return result;
    
  } catch (error) {
    // Map error codes to user-friendly messages
    const errorMessages = {
      'INSUFFICIENT_POINTS': '點數不足，無法完成此操作',
      'ALREADY_SIGNED_IN': '今天已經簽到過了',
      'TRUST_LEVEL_INSUFFICIENT': '信任等級不足，無法刊登此價格商品',
      'INVALID_AMOUNT': '點數金額無效',
      'NETWORK_ERROR': '網路連線失敗，請稍後再試'
    };
    
    const message = errorMessages[error.code] || '操作失敗，請稍後再試';
    
    showToast({
      title: '錯誤',
      message: message,
      variant: 'danger',
      icon: '✕'
    });
    
    // Log for debugging
    console.error('Points operation failed:', error);
    
    throw error;
  }
}
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// Cache user points profile in Vuex/Pinia
const pointsStore = defineStore('points', {
  state: () => ({
    profile: null,
    lastFetch: null,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  }),
  
  actions: {
    async fetchProfile(force = false) {
      const now = Date.now();
      
      if (!force && this.profile && 
          (now - this.lastFetch) < this.cacheDuration) {
        return this.profile;
      }
      
      this.profile = await getUserPointsProfile();
      this.lastFetch = now;
      
      return this.profile;
    },
    
    invalidateCache() {
      this.lastFetch = null;
    }
  }
});

// Invalidate cache after points operations
await awardPoints(userId, amount);
pointsStore.invalidateCache();
```

### 2. Optimistic Updates

```javascript
// Update UI immediately, sync with server in background
async function optimisticSignIn() {
  const estimatedReward = calculateStreakReward(currentStreak + 1);
  
  // Update UI immediately
  pointsBalance.value += estimatedReward;
  dailyStreak.value += 1;
  showSignInAnimation();
  
  try {
    // Sync with server
    const result = await dailySignIn();
    
    // Adjust if server calculation differs
    if (result.points_awarded !== estimatedReward) {
      pointsBalance.value = pointsBalance.value - estimatedReward + result.points_awarded;
    }
    
  } catch (error) {
    // Rollback on error
    pointsBalance.value -= estimatedReward;
    dailyStreak.value -= 1;
    showError(error);
  }
}
```

### 3. Pagination for Transaction History

```javascript
const TRANSACTIONS_PER_PAGE = 20;

async function loadTransactions(page = 1) {
  const { transactions, total } = await getPointsTransactions({
    page,
    size: TRANSACTIONS_PER_PAGE
  });
  
  if (page === 1) {
    transactionList.value = transactions;
  } else {
    transactionList.value.push(...transactions);
  }
  
  hasMore.value = transactionList.value.length < total;
}

// Infinite scroll
const handleScroll = (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  
  if (scrollHeight - scrollTop <= clientHeight + 100 && 
      !loading.value && hasMore.value) {
    currentPage.value++;
    loadTransactions(currentPage.value);
  }
};
```

### 4. Database Query Optimization

```sql
-- Use covering indexes for common queries
CREATE INDEX idx_points_transactions_user_type_created 
ON points_transactions(user_id, type, created_at DESC);

-- Materialized view for user stats (updated periodically)
CREATE MATERIALIZED VIEW user_points_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE type = 'sale_earning') as total_sales,
  COUNT(*) FILTER (WHERE type = 'purchase_spending') as total_purchases,
  SUM(amount) FILTER (WHERE type = 'sale_earning') as total_sales_amount,
  SUM(amount) FILTER (WHERE type = 'purchase_spending') as total_purchases_amount
FROM points_transactions
GROUP BY user_id;

CREATE UNIQUE INDEX ON user_points_stats(user_id);

-- Refresh periodically (e.g., every hour)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_points_stats;
```

### 5. Batch Badge Checking

```javascript
// Instead of checking badges after every action,
// batch check periodically or on significant events
async function batchCheckBadges(userId: string) {
  const [profile, stats, badges] = await Promise.all([
    getUserPointsProfile(userId),
    getTransactionStats(userId),
    getUserBadges(userId)
  ]);
  
  const earnedBadgeIds = new Set(badges.map(b => b.badge_id));
  const newBadges = [];
  
  // Check all badges at once
  for (const [badgeId, definition] of Object.entries(BADGE_DEFINITIONS)) {
    if (earnedBadgeIds.has(badgeId)) continue;
    
    if (shouldAwardBadge(badgeId, profile, stats)) {
      newBadges.push(badgeId);
    }
  }
  
  // Award all new badges
  if (newBadges.length > 0) {
    await Promise.all(
      newBadges.map(badgeId => awardBadge(userId, badgeId))
    );
  }
  
  return newBadges;
}
```


## Testing Strategy

### Unit Tests

**Components to Test**:
1. Points calculation functions
2. Level tier determination
3. Trust level checking
4. Streak reward calculation
5. Badge eligibility logic

**Example Tests**:
```javascript
describe('Points System', () => {
  describe('calculateStreakReward', () => {
    it('returns 5 points for day 1', () => {
      expect(calculateStreakReward(1)).toBe(5);
    });
    
    it('returns 20 points for day 7 milestone', () => {
      expect(calculateStreakReward(7)).toBe(20);
    });
    
    it('returns 200 points for day 100 milestone', () => {
      expect(calculateStreakReward(100)).toBe(200);
    });
  });
  
  describe('checkListingPermission', () => {
    it('allows listing when price is within trust level', async () => {
      const result = await checkListingPermission('user-id', 400);
      expect(result.allowed).toBe(true);
    });
    
    it('blocks listing when price exceeds trust level', async () => {
      const result = await checkListingPermission('user-id', 1500);
      expect(result.allowed).toBe(false);
      expect(result.sales_needed).toBeGreaterThan(0);
    });
  });
  
  describe('Level System', () => {
    it('determines correct level tier based on points', () => {
      expect(getLevelTier(0)).toBe(1);
      expect(getLevelTier(500)).toBe(2);
      expect(getLevelTier(2500)).toBe(4);
    });
    
    it('awards bonus points on level up', async () => {
      const initialBalance = 450;
      await awardPoints('user-id', 100); // Crosses 500 threshold
      
      const profile = await getUserPointsProfile('user-id');
      expect(profile.current_balance).toBe(initialBalance + 100 + 50); // +50 bonus
    });
  });
});
```

### Integration Tests

**Scenarios to Test**:
1. Complete transaction flow with points transfer
2. Daily sign-in with streak calculation
3. Level-up triggering badge awards
4. Trust level progression through sales
5. Concurrent points operations

**Example Tests**:
```javascript
describe('Transaction Points Flow', () => {
  it('transfers points from buyer to seller on transaction completion', async () => {
    const buyer = await createTestUser();
    const seller = await createTestUser();
    const itemPrice = 300;
    
    const buyerInitial = await getBalance(buyer.id);
    const sellerInitial = await getBalance(seller.id);
    
    await processTransactionPoints({
      transaction_id: 'test-trans',
      buyer_id: buyer.id,
      seller_id: seller.id,
      amount: itemPrice
    });
    
    const buyerFinal = await getBalance(buyer.id);
    const sellerFinal = await getBalance(seller.id);
    
    expect(buyerFinal).toBe(buyerInitial - itemPrice);
    expect(sellerFinal).toBe(sellerInitial + itemPrice);
  });
  
  it('prevents transaction when buyer has insufficient points', async () => {
    const buyer = await createTestUser({ balance: 100 });
    const seller = await createTestUser();
    
    await expect(
      processTransactionPoints({
        transaction_id: 'test-trans',
        buyer_id: buyer.id,
        seller_id: seller.id,
        amount: 300
      })
    ).rejects.toThrow('點數不足');
  });
});

describe('Gamification Flow', () => {
  it('maintains streak on consecutive daily sign-ins', async () => {
    const user = await createTestUser();
    
    // Day 1
    await dailySignIn(user.id);
    let profile = await getUserPointsProfile(user.id);
    expect(profile.daily_streak).toBe(1);
    
    // Day 2 (simulate next day)
    await setSystemDate('2025-11-07');
    await dailySignIn(user.id);
    profile = await getUserPointsProfile(user.id);
    expect(profile.daily_streak).toBe(2);
  });
  
  it('resets streak when missing a day', async () => {
    const user = await createTestUser();
    
    await dailySignIn(user.id);
    await setSystemDate('2025-11-07');
    await dailySignIn(user.id);
    
    // Skip day 3, sign in on day 4
    await setSystemDate('2025-11-09');
    await dailySignIn(user.id);
    
    const profile = await getUserPointsProfile(user.id);
    expect(profile.daily_streak).toBe(1); // Reset to 1
  });
  
  it('awards badge and points on milestone achievement', async () => {
    const user = await createTestUser();
    
    // Simulate 7 consecutive sign-ins
    for (let i = 0; i < 7; i++) {
      await setSystemDate(`2025-11-0${i + 1}`);
      await dailySignIn(user.id);
    }
    
    const badges = await getUserBadges(user.id);
    const streakBadge = badges.find(b => b.badge_id === 'streak_7');
    
    expect(streakBadge).toBeDefined();
    expect(streakBadge.points_rewarded).toBe(20);
  });
});
```

### E2E Tests

**User Journeys to Test**:
1. New user receives welcome bonus and can make first purchase
2. User signs in daily for a week and earns streak badge
3. Seller completes multiple sales, levels up, and unlocks higher listing limits
4. User views dashboard and transaction history
5. User attempts to list high-value item without sufficient trust

## Security Considerations

### 1. Authorization

```javascript
// Verify user can only access their own points data
async function getUserPointsProfile(userId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    throw new Error('UNAUTHORIZED');
  }
  
  // Proceed with query
}
```

### 2. Points Manipulation Prevention

```javascript
// All points operations must go through server-side functions
// Never trust client-side calculations

// Use database constraints
CREATE TABLE user_points_profiles (
  current_balance INTEGER NOT NULL CHECK (current_balance >= 0),
  -- Prevent negative balance
);

// Use atomic operations
CREATE OR REPLACE FUNCTION deduct_points_atomic(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Lock row for update
  SELECT current_balance INTO v_current_balance
  FROM user_points_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct points
  UPDATE user_points_profiles
  SET current_balance = current_balance - p_amount
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 3. Rate Limiting

```javascript
// Prevent sign-in spam
const SIGNIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 1000 // 1 minute
};

// Prevent transaction spam
const TRANSACTION_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 1000
};

// Implement using Redis or in-memory cache
async function checkRateLimit(userId: string, action: string) {
  const key = `ratelimit:${action}:${userId}`;
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    await redis.expire(key, RATE_LIMITS[action].windowMs / 1000);
  }
  
  if (attempts > RATE_LIMITS[action].maxAttempts) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
}
```

### 4. Audit Trail

```javascript
// All points transactions are immutable and logged
// Never delete transaction records, only mark as voided

// Admin adjustments require reason
async function adminAdjustPoints(
  adminId: string,
  userId: string,
  amount: number,
  reason: string
) {
  // Verify admin permissions
  const isAdmin = await checkAdminPermission(adminId);
  if (!isAdmin) throw new Error('UNAUTHORIZED');
  
  // Require reason
  if (!reason || reason.length < 10) {
    throw new Error('REASON_REQUIRED');
  }
  
  // Create transaction with admin metadata
  await createTransaction({
    user_id: userId,
    type: 'admin_adjustment',
    amount: amount,
    description: `管理員調整: ${reason}`,
    created_by: adminId,
    metadata: {
      admin_id: adminId,
      reason: reason,
      timestamp: new Date().toISOString()
    }
  });
}
```

### 5. Input Validation

```javascript
// Validate all inputs
function validatePointsAmount(amount: any): number {
  if (typeof amount !== 'number') {
    throw new Error('INVALID_TYPE');
  }
  
  if (!Number.isInteger(amount)) {
    throw new Error('MUST_BE_INTEGER');
  }
  
  if (amount <= 0) {
    throw new Error('MUST_BE_POSITIVE');
  }
  
  if (amount > 1000000) {
    throw new Error('AMOUNT_TOO_LARGE');
  }
  
  return amount;
}
```

## Accessibility

1. **Screen Reader Support**
   - ARIA labels for points balance: `aria-label="當前點數 500 點"`
   - Progress bars with `role="progressbar"` and `aria-valuenow`
   - Badge icons with descriptive alt text

2. **Keyboard Navigation**
   - All interactive elements accessible via Tab
   - Enter/Space to activate buttons
   - Arrow keys for tab navigation

3. **Visual Indicators**
   - High contrast for points display
   - Color-blind friendly badge colors
   - Text alternatives for icon-only elements

4. **Focus Management**
   - Clear focus indicators
   - Focus trap in modals
   - Return focus after modal close

## Mobile Responsiveness

### Breakpoints

- **Mobile**: < 768px
  - Stack dashboard cards vertically
  - Full-width transaction list
  - Simplified badge grid (2 columns)
  
- **Tablet**: 768px - 1024px
  - Two-column dashboard layout
  - Transaction list with more details
  - Badge grid (4 columns)
  
- **Desktop**: ≥ 1024px
  - Three-column dashboard layout
  - Full transaction details
  - Badge grid (6 columns)

### Mobile-Specific Features

1. **Pull to Refresh**: Refresh points balance and transactions
2. **Swipe Gestures**: Swipe transaction items for quick actions
3. **Bottom Sheet**: Use bottom sheet for transaction details on mobile
4. **Sticky Header**: Keep points balance visible while scrolling

## Future Enhancements

1. **Referral System**: Earn points by inviting friends
2. **Points Gifting**: Transfer points to other users
3. **Seasonal Events**: Special badges and bonus points during holidays
4. **Leaderboards**: Show top earners (opt-in)
5. **Points Expiration**: Expire unused points after X months (with warnings)
6. **Premium Membership**: Spend points on platform features
7. **Charity Donations**: Convert points to real donations
8. **Mini-Games**: Simple games to earn small amounts of points
9. **Achievement Showcase**: Public profile showing badges
10. **Points Multipliers**: Temporary boosts for special events

