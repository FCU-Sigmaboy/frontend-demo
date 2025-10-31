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
        favoriteItems.value.push(item)
      })
    }
  }

  async function removeFavorite(itemId) {
    if (isFavorite(itemId)) {
      await removeFavoriteItem(itemId).catch((error) => {
        console.error('(store) Failed to remove favorite:', error)
      }).then(() => {
        favoriteItems.value = favoriteItems.value.filter(item => item.item_id !== itemId)
        favoriteItems.value.map(item => {
          if (item.item_id === itemId) {
            item.favorited_at = undefined;
          }
        })
      })
    }
  }

  async function toggleFavorite(item) {
    if (isFavorite(item.item_id)) {
      await removeFavorite(item.item_id)
    } else {
      await addFavorite(item)
    }
  }

  function isFavorite(itemId) {
    return favoriteItems.value.some(item => item.item_id === itemId)
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
