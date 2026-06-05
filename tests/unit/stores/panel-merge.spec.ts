import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { usePanelStore } from '@/stores/panel'
import { useTabsStore } from '@/stores/tabs'

describe('PanelStore - 面板合并', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('面板为空时应该自动关闭', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()

    // 创建分屏
    panelStore.splitPanel('panel-default', 'after', 'horizontal')
    const [panel1, panel2] = panelStore.flatPanels

    // 在 panel1 添加标签页
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    panel1.tabs = [...tabsStore.tabs]
    panel1.activeTabId = tabsStore.tabs[0].id

    // 关闭标签页
    tabsStore.closeTab(tabsStore.tabs[0].id)
    panel1.tabs = []
    panel1.activeTabId = ''

    // 关闭空面板
    panelStore.closePanel(panel1.id)

    // panel1 应该被移除，面板应该合并
    expect(panelStore.flatPanels.length).toBeLessThan(2)
  })

  it('父面板只剩一个子面板时应该合并', () => {
    const panelStore = usePanelStore()

    // 创建分屏
    panelStore.splitPanel('panel-default', 'after', 'horizontal')

    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    expect(parentPanel?.children).toHaveLength(2)

    // 关闭一个子面板
    const childPanelId = parentPanel!.children![0].id
    panelStore.closePanel(childPanelId)

    // 父面板应该被移除或只剩一个子面板
    const remainingChildren = parentPanel?.children?.length || 0
    expect(remainingChildren).toBeLessThanOrEqual(1)
  })
})
