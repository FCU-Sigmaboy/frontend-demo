# Implementation Plan

- [ ] 1. Set up database schema and core tables
  - Create user_points_profiles table with balance, level, trust, and streak tracking
  - Create points_transactions table with immutable audit trail
  - Create user_badges table for achievement tracking
  - Create daily_signins table for streak management
  - Create level_configs and trust_level_configs configuration tables
  - Add database triggers for auto-creating points profile on user registration
  - Add indexes for performance optimization
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement core points engine functions
- [ ] 2.1 Create points transaction functions
  - Write awardPoints() function with balance updates and transaction logging
  - Write deductPoints() function with insufficient balance checking
  - Implement atomic database operations to prevent race conditions
  - Add transaction type validation and metadata support
  - _Requirements: 1.1, 3.1, 3.2, 4.1, 4.2, 8.1_

- [ ] 2.2 Create points profile management
  - Write getUserPointsProfile() function to fetch user points data
  - Implement updateTotalSalesPoints() for trust level tracking
  - Add getBalance() helper function
  - Create getTransactionStats() for badge checking
  - _Requirements: 1.2, 6.5, 9.1_

- [ ]* 2.3 Write unit tests for points engine
  - Test awardPoints with various transaction types
  - Test deductPoints with insufficient balance scenarios
  - Test atomic operations and race condition handling
  - Test balance calculation accuracy
  - _Requirements: 8.1, 8.2_

- [ ] 3. Implement level system
- [ ] 3.1 Create level progression logic
  - Write getLevelTier() function to determine level from points
  - Implement checkLevelUp() function called after earning points
  - Add level-up bonus points awarding
  - Create sendLevelUpNotification() for user feedback
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 3.2 Build level progress calculation
  - Calculate percentage progress to next level
  - Determine points needed for next level
  - Format level display data for UI components
  - _Requirements: 7.5_

- [ ]* 3.3 Write unit tests for level system
  - Test level tier determination for various point amounts
  - Test level-up detection and bonus awarding
  - Test progress calculation accuracy
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 4. Implement trust level system
- [ ] 4.1 Create trust level checking functions
  - Write checkListingPermission() to validate item price against trust level
  - Implement updateTrustLevel() called after sales completion
  - Add getTrustLevelConfig() helper function
  - Create sendTrustLevelUpNotification() for user feedback
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.2 Integrate trust checking with item listing flow
  - Add trust level validation before allowing item creation
  - Display trust level requirements in listing form
  - Show error modal when trust level insufficient
  - Provide guidance on how to increase trust level
  - _Requirements: 6.2, 6.3, 6.4_

- [ ]* 4.3 Write unit tests for trust system
  - Test listing permission checking for various price points
  - Test trust level progression through sales
  - Test sales points accumulation
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 5. Implement daily sign-in system
- [ ] 5.1 Create sign-in logic
  - Write dailySignIn() function with duplicate checking
  - Implement streak calculation (consecutive days vs reset)
  - Add calculateStreakReward() with milestone bonuses
  - Create streak badge checking (7, 30, 100 days)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.2 Build sign-in UI components
  - Create sign-in button in header or dashboard
  - Add streak display with flame icon and count
  - Implement sign-in success animation
  - Show next reward amount and milestone progress
  - _Requirements: 5.3, 5.4_

- [ ]* 5.3 Write unit tests for sign-in system
  - Test streak calculation for consecutive days
  - Test streak reset when missing a day
  - Test reward calculation for various streak days
  - Test duplicate sign-in prevention
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 6. Implement badge and achievement system
- [ ] 6.1 Create badge management functions
  - Define BADGE_DEFINITIONS constant with all badge types
  - Write checkBadges() function to evaluate badge eligibility
  - Implement awardBadgeIfNew() with duplicate checking
  - Add getUserBadges() to fetch earned badges
  - Create sendBadgeNotification() for user feedback
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6.2 Implement badge checking triggers
  - Call checkBadges() after transaction completion
  - Call checkStreakBadges() after daily sign-in
  - Implement batchCheckBadges() for periodic evaluation
  - Add badge points awarding on achievement
  - _Requirements: 7.2, 7.3_

- [ ]* 6.3 Write unit tests for badge system
  - Test badge eligibility checking for various conditions
  - Test duplicate badge prevention
  - Test badge points awarding
  - Test multiple badge unlocking scenarios
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 7. Integrate points system with transaction flow
- [ ] 7.1 Add points processing to transaction completion
  - Call processTransactionPoints() when transaction completes
  - Deduct points from buyer with purchase_spending type
  - Award points to seller with sale_earning type
  - Update seller's total_sales_points for trust tracking
  - _Requirements: 3.1, 3.2, 4.1, 6.5, 8.1_

- [ ] 7.2 Add points validation to transaction confirmation
  - Check buyer has sufficient balance before confirming order
  - Display clear error message if insufficient points
  - Show current balance and required amount
  - Provide link to dashboard to earn more points
  - _Requirements: 4.1, 4.4_

- [ ] 7.3 Trigger gamification checks after transaction
  - Call checkLevelUp() for seller after earning points
  - Call updateTrustLevel() for seller after sale
  - Call checkBadges() for both buyer and seller
  - Display level-up, trust-up, and badge notifications
  - _Requirements: 7.2, 7.3, 6.5, 8.1_

- [ ]* 7.4 Write integration tests for transaction points flow
  - Test complete transaction with points transfer
  - Test insufficient balance prevention
  - Test level-up triggering from transaction
  - Test trust level progression from sales
  - _Requirements: 3.1, 3.2, 4.1, 6.5, 8.1_

- [ ] 8. Build User Dashboard page
- [ ] 8.1 Create dashboard route and main layout
  - Set up /dashboard route in Vue Router
  - Create UserDashboard.vue main component
  - Implement dashboard state management with Pinia store
  - Add loading and error states
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 8.2 Build Points Balance Card component
  - Display current points balance prominently
  - Show monthly earnings and spending breakdown
  - Add animated number transitions
  - Implement click to view detailed breakdown
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 8.3 Build Daily Streak component
  - Display flame icon with streak count
  - Show progress bar to next milestone
  - Add sign-in button if not signed in today
  - Implement celebration animation on milestone
  - Display next reward amount
  - _Requirements: 5.3, 5.4_

- [ ] 8.4 Build Level Progress component
  - Display current level tier with icon and name
  - Show progress bar with percentage to next level
  - Display points needed for next level
  - Implement level-up animation with confetti
  - _Requirements: 7.4, 7.5_

- [ ] 8.5 Build Trust Level component
  - Display trust tier with shield icon
  - Show current listing limit
  - Display progress to next trust tier
  - Add tooltip explaining trust system
  - _Requirements: 6.4, 6.5_

- [ ] 8.6 Build Badges & Achievements component
  - Display earned badges in grid layout
  - Show badge icons with rarity color coding
  - Add hover tooltips with badge details
  - Display recent achievements section
  - Implement badge detail modal
  - _Requirements: 7.4_

- [ ] 8.7 Build Transaction History component
  - Display transaction list with type icons and colors
  - Implement tab filtering (All, Income, Spending, Rewards)
  - Add date range picker for filtering
  - Implement infinite scroll pagination
  - Add export to CSV functionality
  - Create transaction detail modal
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 8.8 Write component tests for dashboard
  - Test Points Balance Card displays correct values
  - Test Daily Streak component shows correct status
  - Test Level Progress calculates percentage correctly
  - Test Transaction History filtering works
  - Test badge grid displays earned badges
  - _Requirements: 2.4, 5.4, 7.5, 9.1_

- [ ] 9. Add points display to header navigation
- [ ] 9.1 Create header points display component
  - Add points balance next to profile icon in header
  - Implement click to navigate to dashboard
  - Add animated number changes on balance update
  - Show tooltip with recent change
  - Add badge notification dot for new achievements
  - _Requirements: 2.1, 2.2_

- [ ] 9.2 Integrate with points store for real-time updates
  - Subscribe to points store changes
  - Update header display when balance changes
  - Implement optimistic updates for better UX
  - Add cache invalidation after points operations
  - _Requirements: 2.1, 2.2_

- [ ] 10. Create API endpoints
- [ ] 10.1 Implement points profile API
  - Create GET /api/points/profile endpoint
  - Add authorization checking
  - Return complete user points profile
  - _Requirements: 1.2, 2.1, 2.2_

- [ ] 10.2 Implement points transactions API
  - Create GET /api/points/transactions endpoint
  - Add filtering by type, date range
  - Implement pagination
  - Return transaction list with metadata
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 10.3 Implement daily sign-in API
  - Create POST /api/gamification/signin endpoint
  - Add duplicate checking
  - Implement streak calculation
  - Return points awarded and streak info
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10.4 Implement badges API
  - Create GET /api/gamification/badges endpoint
  - Return user's earned badges
  - Add badge metadata
  - _Requirements: 7.4_

- [ ] 10.5 Implement trust level checking API
  - Create GET /api/trust/check-listing/:itemPrice endpoint
  - Validate listing permission
  - Return current and required trust levels
  - Calculate sales needed for next tier
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 10.6 Write API integration tests
  - Test all endpoints with valid requests
  - Test authorization and error handling
  - Test rate limiting
  - Test concurrent request handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 11. Implement notifications and feedback
- [ ] 11.1 Create notification system
  - Build toast notification component
  - Implement notification queue management
  - Add different notification types (success, error, info)
  - Create notification animations
  - _Requirements: 7.3, 10.1, 10.2, 10.3_

- [ ] 11.2 Add gamification notifications
  - Create level-up notification with confetti animation
  - Create badge earned notification with badge icon
  - Create trust level-up notification
  - Create daily sign-in success notification
  - _Requirements: 7.3_

- [ ] 11.3 Add transaction feedback
  - Show points earned notification after sale
  - Show points spent notification after purchase
  - Display insufficient points error clearly
  - Add success animations for points operations
  - _Requirements: 3.1, 3.2, 4.1, 4.4_

- [ ] 12. Add admin tools for points management
- [ ] 12.1 Create admin adjustment API
  - Create POST /api/admin/points/adjust endpoint
  - Add admin permission checking
  - Require reason for all adjustments
  - Log all admin actions with metadata
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 12.2 Build admin dashboard for points
  - Create admin view for user points profiles
  - Add search and filter for users
  - Implement points adjustment form
  - Display audit trail of admin actions
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 13. Implement security and performance optimizations
- [ ] 13.1 Add security measures
  - Implement rate limiting for sign-in and transactions
  - Add input validation for all points operations
  - Use atomic database operations for points transfers
  - Add authorization checks to all endpoints
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 13.2 Add performance optimizations
  - Implement points profile caching in Pinia store
  - Add optimistic UI updates for better UX
  - Create database indexes for common queries
  - Implement transaction history pagination
  - Add batch badge checking
  - _Requirements: 9.4_

- [ ] 13.3 Add monitoring and logging
  - Log all points transactions for audit
  - Add error tracking for failed operations
  - Monitor points balance consistency
  - Track gamification engagement metrics
  - _Requirements: 8.4_

- [ ] 14. Mobile responsiveness and accessibility
- [ ] 14.1 Implement responsive layouts
  - Make dashboard responsive for mobile, tablet, desktop
  - Adjust component layouts for different screen sizes
  - Implement mobile-specific features (pull to refresh, swipe)
  - Test on various devices and screen sizes
  - _Requirements: 2.4, 9.1, 10.4_

- [ ] 14.2 Add accessibility features
  - Add ARIA labels for screen readers
  - Implement keyboard navigation for all interactive elements
  - Ensure color contrast meets WCAG standards
  - Add focus indicators
  - Test with screen readers
  - _Requirements: 2.4, 9.1, 10.4_

- [ ] 15. Documentation and configuration
- [ ] 15.1 Create configuration system
  - Make point values configurable (sign-in rewards, level bonuses)
  - Make level and trust tier thresholds configurable
  - Add admin interface for configuration management
  - _Requirements: 8.3_

- [ ] 15.2 Write user documentation
  - Create help page explaining points system
  - Document how to earn points
  - Explain level and trust systems
  - Add FAQ section
  - _Requirements: 6.4, 7.4, 10.1_
