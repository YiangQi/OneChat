import type { Panel } from './types'

export function flattenLeafPanels(rootPanel: Panel): Panel[] {
  const result: Panel[] = []

  function flatten(panel: Panel) {
    if (panel.children?.length) {
      for (const child of panel.children) {
        flatten(child)
      }
      return
    }

    result.push(panel)
  }

  flatten(rootPanel)
  return result
}

export function findPanelInTree(rootPanel: Panel, panelId: string): Panel | undefined {
  if (rootPanel.id === panelId) return rootPanel

  for (const child of rootPanel.children ?? []) {
    const found = findPanelInTree(child, panelId)
    if (found) return found
  }

  return undefined
}

export function findParentPanelInTree(rootPanel: Panel, panelId: string): Panel | undefined {
  if (!rootPanel.children?.length) return undefined

  if (rootPanel.children.some(child => child.id === panelId)) {
    return rootPanel
  }

  for (const child of rootPanel.children) {
    const found = findParentPanelInTree(child, panelId)
    if (found) return found
  }

  return undefined
}

export function isLeafPanel(panel: Panel): boolean {
  return !panel.children?.length
}

export function replaceChild(parent: Panel, childId: string, replacement: Panel) {
  if (!parent.children) return

  const index = parent.children.findIndex(child => child.id === childId)
  if (index === -1) return

  parent.children.splice(index, 1, replacement)
}
