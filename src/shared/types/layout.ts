export type SplitDirection = 'horizontal' | 'vertical'

export interface LayoutConfig {
  settings: {
    showPopoutIcon: boolean
    showMaximiseIcon: boolean
    showCloseIcon: boolean
    hasHeaders: boolean
    tabControlOffset: number
    reorderEnabled: boolean
    splitMode: SplitDirection
  }
  dimensions: {
    borderWidth: number
    minimumPixelWidth: number
    minimumPixelHeight: number
    headerHeight: number
  }
}
