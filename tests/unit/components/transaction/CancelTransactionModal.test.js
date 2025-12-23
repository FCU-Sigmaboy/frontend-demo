// CancelTransactionModal 組件測試
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import CancelTransactionModal from '@/components/transaction/CancelTransactionModal.vue'

describe('CancelTransactionModal 組件', () => {
  let wrapper

  const mockTransaction = {
    transaction_id: 'txn-001',
    item_title: '二手書籍',
    item_price: 100,
    other_user_nickname: '買家小華',
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
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.modal-container').exists()).toBe(true)
    })

    it('應該在 modelValue 為 false 時隱藏彈窗', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: false,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('應該顯示彈窗標題', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.modal-title').text()).toContain('撤回交易')
    })
  })

  describe('交易資訊顯示', () => {
    it('應該顯示商品名稱', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
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
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const priceItem = infoItems.find(item => item.find('.info-label').text() === '交易金額')
      expect(priceItem.find('.info-value').text()).toBe('100 點')
    })

    it('應該顯示買家名稱', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const buyerItem = infoItems.find(item => item.find('.info-label').text() === '買家')
      expect(buyerItem.find('.info-value').text()).toBe('買家小華')
    })

    it('應該顯示賣家備註當存在時', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const infoItems = wrapper.findAll('.info-item')
      const noteItem = infoItems.find(item => 
        item.find('.info-label').exists() && 
        item.find('.info-label').text() === '賣家備註'
      )
      expect(noteItem).toBeTruthy()
      expect(noteItem.find('.info-value').text()).toBe('請在下午3點後取貨')
    })

    it('應該隱藏賣家備註當不存在時', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
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
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.warning-box').exists()).toBe(true)
    })

    it('應該顯示撤回提醒訊息', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      const warningText = wrapper.find('.warning-box p').text()
      expect(warningText).toContain('撤回後商品將重新上架')
    })
  })

  describe('按鈕互動', () => {
    it('應該顯示取消按鈕', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.btn-cancel').exists()).toBe(true)
      expect(wrapper.find('.btn-cancel').text()).toBe('取消')
    })

    it('應該顯示確認撤回按鈕', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      expect(wrapper.find('.btn-confirm').exists()).toBe(true)
      expect(wrapper.find('.btn-confirm').text()).toContain('確認撤回')
    })

    it('應該在點擊取消按鈕時發送 update:modelValue 事件', async () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
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
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.btn-confirm').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
    })

    it('應該在點擊確認按鈕後關閉彈窗', async () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: mockTransaction
        }
      })

      await wrapper.find('.btn-confirm').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('應該在點擊關閉按鈕時關閉彈窗', async () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
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
      wrapper = mountVueComponent(CancelTransactionModal, {
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
      wrapper = mountVueComponent(CancelTransactionModal, {
        props: {
          modelValue: true,
          transaction: null
        }
      })

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })

    it('應該處理缺少欄位的 transaction', () => {
      wrapper = mountVueComponent(CancelTransactionModal, {
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
