import type { Tab } from '../tabs'

export interface Panel {
  id: string
  tabIds: string[]
  activeTabId: string
  tabs?: Tab[]
  direction?: 'horizontal' | 'vertical'
  children?: Panel[]
  size?: number
  sizes?: number[]
}

export interface DragPreview {
  visible: boolean
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null
  targetPanelId: string | null
  targetScope?: 'panel' | 'container'
  blocked?: boolean
  message?: string
  panelBounds?: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
}

export function createLeafPanel(id: string): Panel {
  return {
    id,
    tabIds: [],
    activeTabId: ''
  }
}
