import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  // State
  const favoriteItems = ref([
    {
      id: 1,
      name: '二手 iPhone 13 Pro',
      price: 25000,
      image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Phone',
      sellerName: '王小明',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=W',
      location: '台中市西屯區',
      distance: '500m',
      postedTime: '3天前',
      status: 'available',
      favoriteDate: '2024-01-20'
    },
    {
      id: 2,
      name: '復古沙發',
      price: 5000,
      image: 'https://placehold.co/330x250/5a9d8c/ffffff?text=Sofa',
      sellerName: '李美麗',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=L',
      location: '台中市南屯區',
      distance: '1.2km',
      postedTime: '1週前',
      status: 'available',
      favoriteDate: '2024-01-19'
    },
    {
      id: 3,
      name: '二手筆記型電腦',
      price: 15000,
      image: 'https://placehold.co/330x250/4a8b7d/ffffff?text=Laptop',
      sellerName: '陳大明',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=C',
      location: '台中市北區',
      distance: '2.5km',
      postedTime: '2天前',
      status: 'sold',
      favoriteDate: '2024-01-18'
    },
    {
      id: 4,
      name: '全新運動鞋',
      price: 3000,
      image: 'https://placehold.co/330x250/3a7a6e/ffffff?text=Shoes',
      sellerName: '張小華',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=Z',
      location: '台中市西區',
      distance: '800m',
      postedTime: '5天前',
      status: 'available',
      favoriteDate: '2024-01-17'
    },
    {
      id: 5,
      name: '設計師桌燈',
      price: 1200,
      image: 'https://placehold.co/330x250/6fb8a5/ffffff?text=Lamp',
      sellerName: '林小美',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=L',
      location: '台中市南區',
      distance: '1.5km',
      postedTime: '1週前',
      status: 'available',
      favoriteDate: '2024-01-16'
    },
    {
      id: 6,
      name: '兒童玩具組',
      price: 800,
      image: 'https://placehold.co/330x250/5a9d8c/ffffff?text=Toys',
      sellerName: '黃大雄',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=H',
      location: '台中市東區',
      distance: '3km',
      postedTime: '4天前',
      status: 'available',
      favoriteDate: '2024-01-15'
    },
    {
      id: 7,
      name: '原木書桌',
      price: 4500,
      image: 'https://placehold.co/330x250/4a8b7d/ffffff?text=Desk',
      sellerName: '吳小莉',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=W',
      location: '台中市北屯區',
      distance: '2km',
      postedTime: '6天前',
      status: 'available',
      favoriteDate: '2024-01-14'
    },
    {
      id: 8,
      name: '相機鏡頭',
      price: 8000,
      image: 'https://placehold.co/330x250/3a7a6e/ffffff?text=Lens',
      sellerName: '蔡小強',
      sellerAvatar: 'https://placehold.co/32/1e1e1e/ffffff?text=C',
      location: '台中市中區',
      distance: '1.8km',
      postedTime: '3天前',
      status: 'sold',
      favoriteDate: '2024-01-13'
    }
  ])

  // Getters
  const count = computed(() => favoriteItems.value.length)

  // Actions
  function addFavorite(item) {
    if (!isFavorite(item.id)) {
      favoriteItems.value.push({
        ...item,
        favoriteDate: new Date().toISOString().split('T')[0]
      })
    }
  }

  function removeFavorite(itemId) {
    const index = favoriteItems.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      favoriteItems.value.splice(index, 1)
    }
  }

  function toggleFavorite(item) {
    if (isFavorite(item.id)) {
      removeFavorite(item.id)
    } else {
      addFavorite(item)
    }
  }

  function isFavorite(itemId) {
    return favoriteItems.value.some(item => item.id === itemId)
  }

  function clearAll() {
    favoriteItems.value = []
  }

  return {
    favoriteItems,
    count,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAll
  }
})
