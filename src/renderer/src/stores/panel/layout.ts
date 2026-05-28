import { MIN_PANEL_HEIGHT, MIN_PANEL_WIDTH } from './constants'

export function normalizeSizes(sizes: number[] | undefined, childCount: number): number[] {
  if (childCount <= 0) return []

  const fallbackSize = 100 / childCount
  const normalized = Array.from({ length: childCount }, (_, index) => {
    const size = sizes?.[index]
    return typeof size === 'number' && Number.isFinite(size) && size > 0
      ? size
      : fallbackSize
  })

  const total = normalized.reduce((sum, size) => sum + size, 0)
  if (total <= 0) {
    return normalized.map(() => fallbackSize)
  }

  return normalized.map(size => (size / total) * 100)
}

export function splitSizesForNewChild(
  sizes: number[] | undefined,
  childCountBefore: number,
  targetIndex: number,
  insertIndex: number
): number[] {
  const baseSizes = normalizeSizes(sizes, childCountBefore)
  const targetSize = baseSizes[targetIndex] ?? (100 / (childCountBefore + 1))
  const splitSize = targetSize / 2
  const nextSizes = [...baseSizes]

  nextSizes[targetIndex] = splitSize
  nextSizes.splice(insertIndex, 0, splitSize)

  return normalizeSizes(nextSizes, childCountBefore + 1)
}

export function canSplitWithinBounds(position: string, bounds?: { width: number, height: number }): boolean {
  if (!bounds) return true

  if (position === 'left' || position === 'right') {
    return bounds.width / 2 >= MIN_PANEL_WIDTH
  }

  if (position === 'top' || position === 'bottom') {
    return bounds.height / 2 >= MIN_PANEL_HEIGHT
  }

  return true
}

export function getRootSplitDirection(position: string): 'horizontal' | 'vertical' | null {
  if (position === 'left' || position === 'right') return 'vertical'
  if (position === 'top' || position === 'bottom') return 'horizontal'
  return null
}

export function getRootSplitInsertPosition(position: string): 'before' | 'after' | null {
  if (position === 'left' || position === 'top') return 'before'
  if (position === 'right' || position === 'bottom') return 'after'
  return null
}

export function getContainerEdgePosition(
  clientX: number,
  clientY: number,
  rect: { left: number, top: number, width: number, height: number }
): 'left' | 'right' | 'top' | 'bottom' | null {
  const x = clientX - rect.left
  const y = clientY - rect.top
  const edgeWidth = Math.min(96, rect.width / 4)
  const edgeHeight = Math.min(96, rect.height / 4)

  if (x < edgeWidth) return 'left'
  if (x > rect.width - edgeWidth) return 'right'
  if (y < edgeHeight) return 'top'
  if (y > rect.height - edgeHeight) return 'bottom'

  return null
}
