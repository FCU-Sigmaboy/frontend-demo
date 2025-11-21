# AI Chatbot Visual Preview

## 🎨 What It Looks Like

### 1. Floating Button (Closed State)

```
                                    ┌─────┐
                                    │ 💬  │  ← Circular button
                                    │     │     60×60px
                                    └─────┘     Green gradient
                                       (3)   ← Unread badge
```

**Features:**
- Circular green button (#6FB8A5)
- Chat icon (bi-chat-dots)
- Red unread badge when new messages
- Smooth hover animation (scales to 1.1)
- Always visible in bottom-right corner

---

### 2. Chat Window (Open State - Desktop)

```
┌─────────────────────────────────────────┐
│ 🤖 AI 客服助手                [−] [✕]  │ ← Header (green gradient)
│ ● 線上服務中                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 您好！我是 AI 客服助手        │   │ ← Bot message
│  │    我可以幫您解答平台使用問題... │   │   (white bubble)
│  │    [👍] [👎]                     │   │
│  │    剛剛                          │   │
│  └─────────────────────────────────┘   │
│                                         │
│                  ┌─────────────────┐    │
│                  │ 如何搜尋商品？   │    │ ← User message
│                  │ 2 分鐘前        │    │   (green bubble)
│                  └─────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 您可以使用頂部的搜尋欄...     │   │
│  │    [查看搜尋頁面 →]              │   │ ← Link button
│  │    [👍] [👎]                     │   │
│  │    剛剛                          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [如何篩選搜尋結果?] [如何儲存搜尋?]   │ ← Suggestion chips
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────┐ 🚀 │ ← Input area
│ │ 輸入訊息...                      │    │
│ └─────────────────────────────────┘    │
│ 0/1000              [🗑️ 清除對話]      │
└─────────────────────────────────────────┘
```

**Dimensions:**
- Width: 380px
- Height: 600px
- Border radius: 16px
- Shadow: Soft drop shadow

---

### 3. Mobile View (Full-Screen)

```
┌─────────────────────┐
│ 🤖 AI 客服助手  [✕] │ ← Header
│ ● 線上服務中         │
├─────────────────────┤
│                     │
│  🤖 Bot message     │
│     [👍] [👎]       │
│                     │
│         User msg 💬 │
│                     │
│  🤖 Bot response    │
│     [Link →]        │
│     [👍] [👎]       │
│                     │
│  [Suggestion 1]     │
│  [Suggestion 2]     │
│                     │
│                     │
│                     │
├─────────────────────┤
│ [Input......]   🚀 │
│ 0/1000  [清除對話]  │
└─────────────────────┘
```

**Mobile Features:**
- Full-screen overlay (100vw × 100vh)
- No minimize button
- Larger touch targets (44px+)
- Optimized for thumb reach

---

### 4. Color Scheme

```
Primary Green:    ████ #6FB8A5 (Buttons, header)
Secondary Gray:   ████ #D9D9D9 (Borders)
Background:       ████ #F9F9F9 (Messages area)
White:            ████ #FFFFFF (Bot messages)
Text:             ████ #333333 (Main text)
Error/Badge:      ████ #FF4757 (Unread, alerts)
```

---

### 5. Message Types

#### Bot Message (Left-aligned)
```
┌─────────────────────────────────┐
│ 🤖 您可以使用頂部的搜尋欄輸入關鍵字 │
│    或點擊「所有分類」瀏覽商品。    │
│                                  │
│    [查看搜尋頁面 →]               │ ← Link button
│                                  │
│    [👍] [👎]                     │ ← Rating
│    剛剛                          │ ← Timestamp
└─────────────────────────────────┘
```

#### User Message (Right-aligned)
```
                  ┌─────────────────┐
                  │ 如何搜尋商品？   │
                  │ 2 分鐘前        │
                  └─────────────────┘
```

#### Loading State
```
┌─────────────────────────────────┐
│ 🤖 ● ● ●                         │ ← Animated dots
└─────────────────────────────────┘
```

---

### 6. Interactive Elements

#### Suggestion Chips
```
[如何篩選搜尋結果?]  [如何儲存搜尋?]  [查看我的訂單]
 ↑ Rounded pills, hover effect (lift + color change)
```

#### Link Buttons
```
┌──────────────────┐
│ 查看搜尋頁面 →   │ ← Green background on hover
└──────────────────┘
```

#### Rating Buttons
```
[👍]  [👎]  ← Circular, scale on hover
```

---

### 7. Modals

#### Clear Confirmation
```
┌─────────────────────────────────┐
│ 清除對話記錄？                   │
│                                 │
│ 此操作將清除所有對話內容，       │
│ 無法復原。                       │
│                                 │
│         [取消]  [確認清除]       │
└─────────────────────────────────┘
```

#### Escalation Options
```
┌─────────────────────────────────┐
│ 需要更多協助？                   │
│                                 │
│ 我們可以為您轉接人工客服         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📧 前往聯絡頁面              │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📨 發送郵件 (Primary)        │ │
│ └─────────────────────────────┘ │
│                                 │
│              [取消]              │
└─────────────────────────────────┘
```

#### Email Form
```
┌─────────────────────────────────┐
│ 發送郵件給客服                   │
│                                 │
│ 您的 Email                       │
│ ┌─────────────────────────────┐ │
│ │ user@example.com (disabled) │ │
│ └─────────────────────────────┘ │
│                                 │
│ 問題描述                         │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ [Textarea]                  │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│         [取消]  [發送]           │
└─────────────────────────────────┘
```

---

### 8. Animations

#### Floating Button
```
Normal:  ⚪ (60px)
Hover:   ⚪ (66px) ← Scales to 1.1
Click:   ⚪ (57px) ← Scales to 0.95
```

#### Chat Window
```
Opening:  Slides up from bottom (0.3s)
Closing:  Slides down to bottom (0.3s)
```

#### Typing Indicator
```
● ● ●  →  ● ● ●  →  ● ● ●
↑         ↑         ↑
Bouncing animation (1.4s loop)
```

#### Status Dot
```
● (Pulse: 1.0 → 0.5 → 1.0 opacity, 2s loop)
```

---

### 9. Responsive Breakpoints

```
Desktop (≥768px):
- Fixed 380px width
- Bottom-right corner
- Minimize button visible

Mobile (<768px):
- Full-screen (100vw × 100vh)
- No minimize button
- Larger touch targets
```

---

### 10. Accessibility

```
✅ ARIA labels on all buttons
✅ Keyboard navigation (Tab, Enter)
✅ High contrast colors (WCAG AA)
✅ Screen reader compatible
✅ Reduced motion support
✅ Focus indicators
```

---

## 🎯 Design Inspiration Sources

1. **Shopee** - Clean bubble design, bottom-right placement
2. **Lazada** - Suggestion chips, quick actions
3. **Amazon** - Professional color scheme, clear hierarchy
4. **Taobao** - Mobile-first approach, full-screen on mobile
5. **Intercom** - Smooth animations, friendly tone

---

## 📐 Exact Measurements

```
Floating Button:
- Size: 60×60px
- Border radius: 50% (circle)
- Position: bottom: 20px, right: 20px
- Icon size: 28px

Chat Window:
- Width: 380px (desktop), 100% (mobile)
- Height: 600px (desktop), 100vh (mobile)
- Border radius: 16px (desktop), 0 (mobile)
- Shadow: 0 8px 32px rgba(0,0,0,0.12)

Header:
- Height: ~72px
- Padding: 16px
- Avatar: 40×40px

Messages Area:
- Padding: 16px
- Gap between messages: 16px
- Max message width: 75%

Input Area:
- Padding: 12px 16px
- Input height: auto (max 120px)
- Send button: 40×40px circle

Suggestion Chips:
- Padding: 8px 16px
- Border radius: 20px
- Font size: 13px

Rating Buttons:
- Size: 28×28px circles
- Icon size: 14px
```

---

**This is what users will see!** 🎉
