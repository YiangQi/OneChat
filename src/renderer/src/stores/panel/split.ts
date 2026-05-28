import { getRootSplitDirection, getRootSplitInsertPosition, splitSizesForNewChild } from './layout'
import { isLeafPanel, replaceChild } from './tree'
import { createLeafPanel, type Panel } from './types'

interface SplitPanelArgs {
  targetPanelId: string
  position: 'before' | 'after'
  direction: 'horizontal' | 'vertical'
  rootPanel: Panel
  canCreateNewPanel: () => boolean
  createPanelId: (prefix?: string) => string
  ensureCompatTabs: (panel: Panel) => void
  findPanel: (panelId: string) => Panel | undefined
  findParentPanel: (panelId: string) => Panel | undefined
  setRootPanel: (panel: Panel) => void
}

interface SplitRootPanelArgs {
  position: 'left' | 'right' | 'top' | 'bottom'
  rootPanel: Panel
  canCreateNewPanel: () => boolean
  createPanelId: (prefix?: string) => string
  ensureCompatTabs: (panel: Panel) => void
  setRootPanel: (panel: Panel) => void
}

function createParentPanel(
  id: string,
  direction: 'horizontal' | 'vertical',
  children: Panel[]
): Panel {
  return {
    id,
    tabIds: [],
    activeTabId: '',
    direction,
    children,
    sizes: [50, 50]
  }
}

export function splitPanelInTree(args: SplitPanelArgs): string | null {
  if (!args.canCreateNewPanel()) return null

  const targetPanel = args.findPanel(args.targetPanelId)
  if (!targetPanel || !isLeafPanel(targetPanel)) return null

  const newPanel = createLeafPanel(args.createPanelId())
  args.ensureCompatTabs(targetPanel)
  args.ensureCompatTabs(newPanel)

  const parent = args.findParentPanel(args.targetPanelId)
  if (parent?.children) {
    if (parent.direction === args.direction) {
      const targetIndex = parent.children.findIndex(child => child.id === args.targetPanelId)
      const insertIndex = args.position === 'before' ? targetIndex : targetIndex + 1
      const nextSizes = splitSizesForNewChild(parent.sizes, parent.children.length, targetIndex, insertIndex)

      parent.children.splice(insertIndex, 0, newPanel)
      parent.sizes = nextSizes
    } else {
      const nestedParent = createParentPanel(
        args.createPanelId('panel-parent'),
        args.direction,
        args.position === 'before'
          ? [newPanel, targetPanel]
          : [targetPanel, newPanel]
      )

      replaceChild(parent, args.targetPanelId, nestedParent)
    }
  } else {
    if (args.rootPanel.id !== args.targetPanelId) return null

    args.setRootPanel(createParentPanel(
      args.createPanelId('panel-parent'),
      args.direction,
      args.position === 'before'
        ? [newPanel, targetPanel]
        : [targetPanel, newPanel]
    ))
  }

  return newPanel.id
}

export function splitRootPanel(args: SplitRootPanelArgs): string | null {
  if (!args.canCreateNewPanel()) return null

  const direction = getRootSplitDirection(args.position)
  const insertPosition = getRootSplitInsertPosition(args.position)
  if (!direction || !insertPosition) return null

  const newPanel = createLeafPanel(args.createPanelId())
  args.ensureCompatTabs(newPanel)

  args.setRootPanel(createParentPanel(
    args.createPanelId('panel-parent'),
    direction,
    insertPosition === 'before'
      ? [newPanel, args.rootPanel]
      : [args.rootPanel, newPanel]
  ))

  return newPanel.id
}
