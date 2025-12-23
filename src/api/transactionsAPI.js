import { supabase } from '@/lib/supabase';

// ===================================================================
// ### Transaction Flow APIs using Supabase SDK v2
// ===================================================================

/**
 * Create a new offer (buyer or seller)
 * @param {object} offerData - { conversation_id, amount, offered_by: 'buyer'|'seller' }
 * @returns {Promise<object>} - Created offer with example data
 */
export async function createOffer(offerData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // For now, return example data until backend is ready
  const exampleOffer = {
    id: `offer_${Date.now()}`,
    conversation_id: offerData.conversation_id,
    amount: offerData.amount,
    offered_by: offerData.offered_by,
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null
  };

  console.log('createOffer called with:', offerData);
  console.log('Returning example offer:', exampleOffer);

  return exampleOffer;
}

/**
 * Respond to an offer (accept, decline, counter)
 * @param {string} offerId - The offer ID
 * @param {string} action - 'accept', 'decline', or 'counter'
 * @param {number} counterAmount - Amount for counter offer (only if action is 'counter')
 * @returns {Promise<object>} - Updated offer
 */
export async function respondToOffer(offerId, action, counterAmount = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleResponse = {
    id: offerId,
    status: action === 'counter' ? 'countered' : action + 'ed',
    responded_at: new Date().toISOString(),
    counter_offer: action === 'counter' ? {
      id: `offer_${Date.now()}`,
      amount: counterAmount,
      offered_by: 'seller',
      status: 'pending',
      created_at: new Date().toISOString()
    } : null
  };

  console.log('respondToOffer called with:', { offerId, action, counterAmount });
  console.log('Returning example response:', exampleResponse);

  return exampleResponse;
}

/**
 * Create order request (buyer initiates)
 * @param {object} orderData - { conversation_id, item_id, agreed_price }
 * @returns {Promise<object>} - Created order request
 */
export async function createOrderRequest(orderData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleOrderRequest = {
    id: `order_${Date.now()}`,
    conversation_id: orderData.conversation_id,
    item_id: orderData.item_id,
    agreed_price: orderData.agreed_price,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  console.log('createOrderRequest called with:', orderData);
  console.log('Returning example order request:', exampleOrderRequest);

  return exampleOrderRequest;
}

/**
 * Respond to order request (seller accepts/declines)
 * @param {string} orderId - The order request ID
 * @param {string} action - 'accept' or 'decline'
 * @returns {Promise<object>} - Updated order request
 */
export async function respondToOrderRequest(orderId, action) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleResponse = {
    id: orderId,
    status: action === 'accept' ? 'accepted' : 'declined',
    responded_at: new Date().toISOString()
  };

  console.log('respondToOrderRequest called with:', { orderId, action });
  console.log('Returning example response:', exampleResponse);

  return exampleResponse;
}

/**
 * Get transaction confirmation details
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} - Transaction details with item and user balance
 */
export async function getTransactionConfirmation(conversationId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // Example data for testing
  const exampleData = {
    transaction: {
      id: `trans_${Date.now()}`,
      conversation_id: conversationId,
      item_id: 'item_123',
      agreed_price: 450,
      status: 'buyer_confirmed'
    },
    item: {
      id: 'item_123',
      title: 'IKEA 檯燈',
      cover_image_url: 'https://placehold.co/130x130/6fb8a5/ffffff?text=Lamp',
      location: '台北市北投區',
      price: 500
    },
    user: {
      id: user.id,
      balance: 500
    }
  };

  console.log('getTransactionConfirmation called with:', conversationId);
  console.log('Returning example data:', exampleData);

  return exampleData;
}

/**
 * Confirm transaction (buyer confirms order)
 * @param {string} transactionId - The transaction ID
 * @param {object} deliveryData - { delivery_location, delivery_notes }
 * @returns {Promise<object>} - Updated transaction
 */
export async function confirmTransaction(transactionId, deliveryData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleResponse = {
    id: transactionId,
    status: 'buyer_confirmed',
    delivery_location: deliveryData.delivery_location,
    delivery_notes: deliveryData.delivery_notes,
    buyer_confirmed_at: new Date().toISOString()
  };

  console.log('confirmTransaction called with:', { transactionId, deliveryData });
  console.log('Returning example response:', exampleResponse);

  return exampleResponse;
}

/**
 * Complete transaction (seller final acceptance)
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<object>} - Completed transaction with new balances
 */
export async function completeTransaction(transactionId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleResponse = {
    success: true,
    message: '交易完成',
    transaction_id: transactionId,
    status: 'completed',
    completed_at: new Date().toISOString(),
    buyer_new_balance: 50,
    seller_new_balance: 1450
  };

  console.log('completeTransaction called with:', transactionId);
  console.log('Returning example response:', exampleResponse);

  return exampleResponse;
}

/**
 * Get user's transaction history
 * @param {object} filters - { role: 'buyer'|'seller'|'all', status, page, size }
 * @returns {Promise<Array>} - List of transactions
 */
export async function getMyTransactions(filters = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // Example data
  const exampleTransactions = [
    {
      id: 'trans_1',
      type: 'purchase',
      status: 'completed',
      date: '2025-01-15T10:30:00',
      amount: 450,
      item: {
        id: 'item_1',
        title: 'IKEA 檯燈',
        image: 'https://placehold.co/80x80/6fb8a5/ffffff?text=Lamp'
      },
      otherParty: {
        id: 'user_2',
        name: 'Joseph'
      },
      review: null
    },
    {
      id: 'trans_2',
      type: 'sale',
      status: 'completed',
      date: '2025-01-10T14:20:00',
      amount: 800,
      item: {
        id: 'item_2',
        title: '登山背包',
        image: 'https://placehold.co/80x80/5a9d8c/ffffff?text=Bag'
      },
      otherParty: {
        id: 'user_3',
        name: 'Amber'
      },
      review: {
        rating: 5,
        comment: '很棒的買家'
      }
    }
  ];

  console.log('getMyTransactions called with filters:', filters);
  console.log('Returning example transactions:', exampleTransactions);

  return exampleTransactions;
}

/**
 * Get transaction details by ID
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<object>} - Transaction details
 */
export async function getTransactionById(transactionId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleTransaction = {
    id: transactionId,
    type: 'purchase',
    status: 'completed',
    date: '2025-01-15T10:30:00',
    amount: 450,
    delivery_method: '面交',
    delivery_location: '台北市北投區',
    delivery_notes: '捷運站出口見',
    item: {
      id: 'item_1',
      title: 'IKEA 檯燈',
      image: 'https://placehold.co/130x130/6fb8a5/ffffff?text=Lamp',
      price: 500
    },
    buyer: {
      id: 'user_1',
      name: '您'
    },
    seller: {
      id: 'user_2',
      name: 'Joseph'
    },
    review: null
  };

  console.log('getTransactionById called with:', transactionId);
  console.log('Returning example transaction:', exampleTransaction);

  return exampleTransaction;
}

/**
 * Create a review for a transaction
 * @param {object} reviewData - { transaction_id, rating, comment }
 * @returns {Promise<object>} - Created review
 */
export async function createReview(reviewData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleReview = {
    id: `review_${Date.now()}`,
    transaction_id: reviewData.transaction_id,
    reviewer_id: user.id,
    rating: reviewData.rating,
    comment: reviewData.comment,
    created_at: new Date().toISOString()
  };

  console.log('createReview called with:', reviewData);
  console.log('Returning example review:', exampleReview);

  return exampleReview;
}

/**
 * Update an existing review
 * @param {string} reviewId - The review ID
 * @param {object} reviewData - { rating, comment }
 * @returns {Promise<object>} - Updated review
 */
export async function updateReview(reviewId, reviewData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  const exampleReview = {
    id: reviewId,
    rating: reviewData.rating,
    comment: reviewData.comment,
    updated_at: new Date().toISOString()
  };

  console.log('updateReview called with:', { reviewId, reviewData });
  console.log('Returning example review:', exampleReview);

  return exampleReview;
}

/**
 * Get review for a transaction
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<object|null>} - Review if exists
 */
export async function getReviewByTransaction(transactionId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('使用者未登入');

  // Return null if no review exists
  console.log('getReviewByTransaction called with:', transactionId);
  console.log('Returning null (no review)');

  return null;
}
