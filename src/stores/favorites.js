import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMyFavoriteItems } from '../api/get_myFavoriteAPI.js'
import { addFavoriteItem } from '../api/create_favoriteAPI.js'
import { removeFavoriteItem } from '../api/delete_favoriteAPI.js'

export const useFavoritesStore = defineStore('favorites', () => {
  // State
  const favoriteItems = ref([])

  // Getters
  const count = computed(() => favoriteItems.value.length)

  // Actions
  async function loadFavorites(options = {}) {
    const data = await getMyFavoriteItems(options)
    favoriteItems.value = data || []
  }

  async function addFavorite(item) {
    if (!isFavorite(item.item_id)) {
      await addFavoriteItem(item.item_id).catch((error) => {
        console.error('(store) Failed to add favorite:', error)
      }).then(() => {
        item.favorited_at = new Date().toISOString();
        item.favorites_count += 1;
        favoriteItems.value.push(item)
      })
    }
  }

  async function removeFavorite(item) {
    if (isFavorite(item.item_id)) {
      await removeFavoriteItem(item.item_id).catch((error) => {
        console.error('(store) Failed to remove favorite:', error)
      }).then(() => {
        favoriteItems.value = favoriteItems.value.filter(favItem => favItem.item_id !== item.item_id)
        favoriteItems.value.map(favItem => {
          if (favItem.item_id === item.item_id) {
            favItem.favorited_at = null;
            favItem.favorites_count -= 1;
          }
        })
      })
    }
  }

  async function toggleFavorite(item) {
    if (isFavorite(item.item_id)) {
      await removeFavorite(item)
    } else {
      await addFavorite(item)
    }
  }

  function isFavorite(itemId) {
    // Convert both to numbers for comparison to handle string vs number mismatch
    const numericItemId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
    return favoriteItems.value.some(item => item.item_id === numericItemId);
  }

  function clearCache() {
    favoriteItems.value = []
  }

  return {
    favoriteItems,
    count,
    loadFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearCache
  }
})
