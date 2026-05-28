import { normalizeSizes } from './layout'
import { replaceChild } from './tree'
import type { Panel } from './types'

interface CleanupEmptyPanelsArgs {
  rootPanel: Panel
  flatPanels: Panel[]
  findParentPanel: (panelId: string) => Panel | undefined
  closePanel: (panelId: string) => void
}

interface ClosePanelArgs {
  panelId: string
  rootPanel: Panel
  findPanel: (panelId: string) => Panel | undefined
  findParentPanel: (panelId: string) => Panel | undefined
  mergePanel: (parentPanel: Panel) => void
}

interface MergePanelArgs {
  parentPanel: Panel
  rootPanel: Panel
  findParentPanel: (panelId: string) => Panel | undefined
  setRootPanel: (panel: Panel) => void
}

export function cleanupEmptyPanels(args: CleanupEmptyPanelsArgs) {
  const leafPanels = [...args.flatPanels]
  for (const panel of leafPanels) {
    if (panel.tabIds.length > 0) continue

    const isRootLeaf = panel.id === args.rootPanel.id && !args.findParentPanel(panel.id)
    if (isRootLeaf) continue

    args.closePanel(panel.id)
  }
}

export function closePanelInTree(args: ClosePanelArgs) {
  const panel = args.findPanel(args.panelId)
  const parent = args.findParentPanel(args.panelId)
  if (!panel || panel.children?.length || panel.tabIds.length > 0) return

  if (parent?.children) {
    parent.children = parent.children.filter(child => child.id !== args.panelId)
    parent.sizes = parent.children.length > 0
      ? normalizeSizes(parent.sizes, parent.children.length)
      : []

    if (parent.children.length === 1) {
      args.mergePanel(parent)
    }
    return
  }

  if (args.rootPanel.id === args.panelId) return
}

export function mergeSingleChildPanel(args: MergePanelArgs) {
  const { parentPanel } = args
  if (!parentPanel.children || parentPanel.children.length !== 1) return

  const onlyChild = parentPanel.children[0]
  const grandParent = args.findParentPanel(parentPanel.id)

  if (grandParent?.children) {
    replaceChild(grandParent, parentPanel.id, onlyChild)
    if (grandParent.children.length > 0) {
      grandParent.sizes = normalizeSizes(grandParent.sizes, grandParent.children.length)
    }
    return
  }

  if (args.rootPanel.id === parentPanel.id) {
    args.setRootPanel(onlyChild)
  }
}
