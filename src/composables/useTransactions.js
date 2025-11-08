import { ref } from 'vue';
import {
  createOffer,
  respondToOffer,
  createOrderRequest,
  respondToOrderRequest,
  getTransactionConfirmation,
  confirmTransaction,
  completeTransaction,
  getMyTransactions,
  getTransactionById,
  createReview,
  updateReview,
  getReviewByTransaction
} from '@/api/transactionsAPI';

export function useTransactions() {
  const loading = ref(false);
  const error = ref(null);

  // Make an offer
  async function makeOffer(conversationId, amount, offeredBy = 'buyer') {
    loading.value = true;
    error.value = null;

    try {
      const offer = await createOffer({
        conversation_id: conversationId,
        amount,
        offered_by: offeredBy
      });
      return offer;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Accept an offer
  async function acceptOffer(offerId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await respondToOffer(offerId, 'accept');
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Counter an offer
  async function counterOffer(offerId, amount) {
    loading.value = true;
    error.value = null;

    try {
      const result = await respondToOffer(offerId, 'counter', amount);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Decline an offer
  async function declineOffer(offerId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await respondToOffer(offerId, 'decline');
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Request an order
  async function requestOrder(conversationId, itemId, agreedPrice) {
    loading.value = true;
    error.value = null;

    try {
      const orderRequest = await createOrderRequest({
        conversation_id: conversationId,
        item_id: itemId,
        agreed_price: agreedPrice
      });
      return orderRequest;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Accept order request
  async function acceptOrderRequest(orderId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await respondToOrderRequest(orderId, 'accept');
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Decline order request
  async function declineOrderRequest(orderId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await respondToOrderRequest(orderId, 'decline');
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Get transaction confirmation details
  async function getConfirmationDetails(conversationId) {
    loading.value = true;
    error.value = null;

    try {
      const details = await getTransactionConfirmation(conversationId);
      return details;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Confirm transaction (buyer)
  async function confirmOrder(transactionId, deliveryData) {
    loading.value = true;
    error.value = null;

    try {
      const result = await confirmTransaction(transactionId, deliveryData);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Complete transaction (seller)
  async function completeOrder(transactionId) {
    loading.value = true;
    error.value = null;

    try {
      const result = await completeTransaction(transactionId);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch user transactions
  async function fetchMyTransactions(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      const transactions = await getMyTransactions(filters);
      return transactions;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch transaction details
  async function fetchTransactionDetails(transactionId) {
    loading.value = true;
    error.value = null;

    try {
      const transaction = await getTransactionById(transactionId);
      return transaction;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Add review
  async function addReview(transactionId, rating, comment) {
    loading.value = true;
    error.value = null;

    try {
      const review = await createReview({
        transaction_id: transactionId,
        rating,
        comment
      });
      return review;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Edit review
  async function editReview(reviewId, rating, comment) {
    loading.value = true;
    error.value = null;

    try {
      const review = await updateReview(reviewId, { rating, comment });
      return review;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch review for transaction
  async function fetchTransactionReview(transactionId) {
    loading.value = true;
    error.value = null;

    try {
      const review = await getReviewByTransaction(transactionId);
      return review;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    makeOffer,
    acceptOffer,
    counterOffer,
    declineOffer,
    requestOrder,
    acceptOrderRequest,
    declineOrderRequest,
    getConfirmationDetails,
    confirmOrder,
    completeOrder,
    fetchMyTransactions,
    fetchTransactionDetails,
    addReview,
    editReview,
    fetchTransactionReview
  };
}
