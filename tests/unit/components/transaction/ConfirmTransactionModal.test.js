// ConfirmTransactionModal 組件測試
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import ConfirmTransactionModal from '@/components/transaction/ConfirmTransactionModal.vue'

describe('ConfirmTransactionModal 組件', () => {
  let wrapper

  const mockTransaction = {
    transaction_id: 'txn-001',
    item_title: '二手書籍',
    item_price: 100,
    other_user_nickname: '賣家小明',
    giver_note: '請在下午3點後取貨'
  }

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應該在 modelValue 為 true 時顯示彈窗', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.modal-container').exists()).toBe(true)
    })

    it('應該在 modelValue 為 false 時隱藏彈窗', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: false,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('應該顯示彈窗標題', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.modal-title').text()).toContain('確認交易')
    })
  })

  describe('交易資訊顯示', () => {
    it('應該顯示商品名稱', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const itemTitle = infoItems.find(item => item.find('.info-label').text() === '商品名稱')
      expect(itemTitle.find('.info-value').text()).toBe('二手書籍')
    })

    it('應該顯示交易金額', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const priceItem = infoItems.find(item => item.find('.info-label').text() === '交易金額')
      expect(priceItem.find('.info-value').text()).toBe('100 點')
    })

    it('應該顯示賣家名稱', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const sellerItem = infoItems.find(item => item.find('.info-label').text() === '賣家')
      expect(sellerItem.find('.info-value').text()).toBe('賣家小明')
    })

    it('應該顯示賣家備註當存在時', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const noteItem = infoItems.find(item => item.find('.info-label').text() === '賣家備註')
      expect(noteItem).toBeTruthy()
      expect(noteItem.find('.info-value').text()).toBe('請在下午3點後取貨')
    })

    it('應該隱藏賣家備註當不存在時', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: { ...mockTransaction, giver_note: null }
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const noteItem = infoItems.find(item => 
        item.find('.info-label').exists() && 
        item.find('.info-label').text() === '賣家備註'
      )
      expect(noteItem).toBeFalsy()
    })
  })

  describe('警告區塊', () => {
    it('應該顯示警告區塊', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.warning-box').exists()).toBe(true)
    })

    it('應該顯示重要提醒標題', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.warning-content h4').text()).toBe('重要提醒')
    })

    it('應該顯示扣除點數提醒', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const warningText = wrapper.find('.warning-content').text()
      expect(warningText).toContain('100 點')
    })
  })

  describe('備註輸入', () => {
    it('應該顯示備註輸入區塊', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.note-section').exists()).toBe(true)
      expect(wrapper.find('.note-input').exists()).toBe(true)
    })

    it('應該顯示字數計數器', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.note-counter').text()).toBe('0/200')
    })

    it('應該更新字數計數器當輸入時', async () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.note-input').setValue('測試備註')
      expect(wrapper.find('.note-counter').text()).toBe('4/200')
    })
  })

  describe('按鈕互動', () => {
    it('應該顯示取消按鈕', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.btn-cancel').exists()).toBe(true)
      expect(wrapper.find('.btn-cancel').text()).toBe('取消')
    })

    it('應該顯示確認按鈕', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.btn-confirm').exists()).toBe(true)
      expect(wrapper.find('.btn-confirm').text()).toContain('確認交易')
    })

    it('應該在點擊取消按鈕時發送 update:modelValue 事件', async () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.btn-cancel').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('應該在點擊確認按鈕時發送 confirm 事件', async () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.btn-confirm').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
    })

    it('應該在確認時傳遞備註內容', async () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.note-input').setValue('我的備註')
      await wrapper.find('.btn-confirm').trigger('click')

      expect(wrapper.emitted('confirm')[0]).toEqual(['我的備註'])
    })

    it('應該在點擊關閉按鈕時關閉彈窗', async () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.close-btn').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })
  })

  describe('遮罩互動', () => {
    it('應該在點擊遮罩時關閉彈窗', async () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.modal-overlay').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })
  })

  describe('邊界情況', () => {
    it('應該處理 null transaction', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: null
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })

    it('應該處理缺少欄位的 transaction', () => {
      wrapper = mountVueComponent(ConfirmTransactionModal, {
        props: {
          modelValue: true,
          transaction: {
            item_title: '測試商品'
          }
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })
  })
})
