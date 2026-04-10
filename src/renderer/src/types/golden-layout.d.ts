/**
 * Golden Layout Type Declarations
 *
 * This file provides TypeScript type definitions for Golden Layout 2.6.0.
 * Golden Layout includes built-in types, but this declaration file provides
 * a simplified interface for common use cases in this project.
 */

declare module 'golden-layout' {
  export interface LayoutConfig {
    settings?: {
      showPopoutIcon?: boolean
      showMaximiseIcon?: boolean
      showCloseIcon?: boolean
    }
    content?: Array<{
      type: 'row' | 'column' | 'stack' | 'component'
      content?: any[]
      width?: number
      height?: number
      componentName?: string
      componentState?: any
      title?: string
      id?: string
    }>
  }

  export interface BoundedItem {
    id: string
    isComponent?: boolean
    isRow?: boolean
    isColumn?: boolean
    isStack?: boolean
    parent?: ItemContainer
    element?: HTMLElement
    [key: string]: any
  }

  export interface ItemContainer {
    type: string
    contentItems?: BoundedItem[]
    element?: HTMLElement
    addChild(item: any, index?: number): void
    removeChild(item: any): void
    [key: string]: any
  }

  export interface ComponentContainer {
    id: string
    element?: HTMLElement
    parent?: ItemContainer
    getState(): any
    setState(state: any): void
    title: string
    [key: string]: any
  }

  export interface DragSource {
    id: string
    element?: HTMLElement
    [key: string]: any
  }

  export class GoldenLayout {
    constructor(config?: LayoutConfig, container?: HTMLElement)
    init(): void
    destroy(): void
    registerComponent(name: string, component: any): void
    registerComponentConstructor(name: string, constructor: any): void
    getContentItem(componentId: string): any
    createContentItem(config: any, parent: any): any
    removeContentItem(item: any): void
    clear(): void
    loadLayout(config: LayoutConfig): void
    toConfig(): LayoutConfig
    on(eventName: string, callback: (...args: any[]) => void): void
    off(eventName: string, callback: (...args: any[]) => void): void
    root: ItemContainer | null
    container: HTMLElement
    isInitialised: boolean
    extend(key: string, value: any): void
    size: number
  }

  export const LayoutConfig: {
    isRoot(item: any): boolean
    minimiseToTabs: (config: LayoutConfig) => LayoutConfig
    resolve: (config: LayoutConfig) => LayoutConfig
  }
}
