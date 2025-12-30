import { describe, it, expect, vi, beforeEach } from 'vitest'
import { askRagQA } from '@/api/ragQaAPI'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}))

import { supabase } from '@/lib/supabase'

// Mock fetch
global.fetch = vi.fn()

describe('ragQaAPI', () => {
  const mockSession = {
    access_token: 'mock-access-token'
  }

  const mockResponse = {
    success: true,
    answer: '這是 AI 的回答',
    sources: ['doc1.md', 'doc2.md'],
    timestamp: '2025-01-15T10:00:00'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    global.fetch.mockReset()
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key'
  })

  describe('askRagQA', () => {
    it('should ask question successfully with session', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: mockSession }, 
        error: null 
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await askRagQA('測試問題')

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/rag-qa',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      )
    })

    it('should ask question with chat history', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: mockSession }, 
        error: null 
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const chatHistory = [
        { role: 'user', content: '之前的問題' },
        { role: 'assistant', content: '之前的回答' }
      ]

      const result = await askRagQA('新問題', chatHistory, 5)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should throw error when question is empty', async () => {
      const result = await askRagQA('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('問題不能為空')
    })

    it('should throw error when question is not a string', async () => {
      const result = await askRagQA(null)

      expect(result.success).toBe(false)
      expect(result.error).toBe('問題不能為空')
    })

    it('should use anon key when no session', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: null }, 
        error: null 
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await askRagQA('測試問題')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-anon-key'
          })
        })
      )
    })

    it('should handle API error response', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: mockSession }, 
        error: null 
      })

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error'
        })
      })

      const result = await askRagQA('測試問題')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Internal server error')
    })

    it('should handle network error', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: mockSession }, 
        error: null 
      })

      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await askRagQA('測試問題')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should trim question whitespace', async () => {
      supabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: mockSession }, 
        error: null 
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await askRagQA('  測試問題  ')

      const fetchCall = global.fetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      
      expect(body.question).toBe('測試問題')
    })
  })
})
