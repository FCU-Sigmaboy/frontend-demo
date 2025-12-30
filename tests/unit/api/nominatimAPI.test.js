import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  geocodeAddress, 
  reverseGeocode, 
  autocomplete 
} from '@/api/nominatimAPI'

// Mock openStreetMapLoader
vi.mock('@/utils/openStreetMapLoader', () => ({
  nominatimSearch: vi.fn(),
  nominatimReverse: vi.fn()
}))

import { nominatimSearch, nominatimReverse } from '@/utils/openStreetMapLoader'

describe('nominatimAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('geocodeAddress', () => {
    it('should geocode address successfully', async () => {
      const mockResults = [
        {
          lat: '25.0330',
          lon: '121.5654',
          display_name: '台北市信義區',
          place_id: '12345',
          type: 'administrative',
          address: {
            city: '台北市',
            district: '信義區'
          }
        },
        {
          lat: '24.1477',
          lon: '120.6736',
          display_name: '台中市西屯區',
          place_id: '67890',
          type: 'administrative',
          address: {
            city: '台中市',
            district: '西屯區'
          }
        }
      ]

      nominatimSearch.mockResolvedValueOnce(mockResults)

      const result = await geocodeAddress('台北市')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        latitude: 25.0330,
        longitude: 121.5654,
        formatted_address: '台北市信義區',
        place_id: '12345',
        type: 'administrative',
        address_components: mockResults[0].address
      })
      expect(nominatimSearch).toHaveBeenCalledWith('台北市', {
        limit: 10,
        countrycodes: 'tw',
        'accept-language': 'zh-TW'
      })
    })

    it('should throw error when geocoding fails', async () => {
      nominatimSearch.mockRejectedValueOnce(new Error('API error'))

      await expect(geocodeAddress('invalid'))
        .rejects.toThrow('地址搜索失敗')
    })

    it('should return empty array for empty results', async () => {
      nominatimSearch.mockResolvedValueOnce([])

      const result = await geocodeAddress('不存在的地址')

      expect(result).toEqual([])
    })
  })

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates successfully', async () => {
      const mockResult = {
        display_name: '台北市信義區市府路1號',
        place_id: '12345',
        address: {
          road: '市府路',
          suburb: '信義區',
          city: '台北市'
        }
      }

      nominatimReverse.mockResolvedValueOnce(mockResult)

      const result = await reverseGeocode(25.0330, 121.5654)

      expect(result).toEqual({
        latitude: 25.0330,
        longitude: 121.5654,
        formatted_address: '台北市信義區市府路1號',
        place_id: '12345',
        address_components: mockResult.address
      })
      expect(nominatimReverse).toHaveBeenCalledWith(25.0330, 121.5654)
    })

    it('should throw error when reverse geocoding fails', async () => {
      nominatimReverse.mockRejectedValueOnce(new Error('API error'))

      await expect(reverseGeocode(0, 0))
        .rejects.toThrow('位置查詢失敗')
    })
  })

  describe('autocomplete', () => {
    beforeEach(() => {
      nominatimSearch.mockReset()
    })

    it('should return autocomplete suggestions', async () => {
      const mockResults = [
        {
          display_name: '台北市信義區',
          place_id: '12345',
          lat: '25.0330',
          lon: '121.5654'
        },
        {
          display_name: '台北市大安區',
          place_id: '67890',
          lat: '25.0267',
          lon: '121.5436'
        }
      ]

      nominatimSearch.mockResolvedValueOnce(mockResults)

      const result = await autocomplete('台北')

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('台北市信義區')
      expect(result[0].value).toBe('12345')
    })

    it('should return empty array for query less than 3 characters', async () => {
      const result = await autocomplete('台')

      expect(result).toEqual([])
      expect(nominatimSearch).not.toHaveBeenCalled()
    })

    it('should return empty array for empty query', async () => {
      const result = await autocomplete('')

      expect(result).toEqual([])
      expect(nominatimSearch).not.toHaveBeenCalled()
    })

    it('should return empty array when autocomplete fails', async () => {
      nominatimSearch.mockRejectedValueOnce(new Error('API error'))

      const result = await autocomplete('台北市')

      expect(result).toEqual([])
    })
  })
})
