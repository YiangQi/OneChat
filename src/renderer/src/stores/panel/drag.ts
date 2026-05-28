import { canSplitWithinBounds } from './layout'
import type { DragPreview } from './types'

const SPLIT_BLOCKED_MESSAGE = '空间太小，无法继续分屏'

export function getPanelDropPosition(
  clientX: number,
  clientY: number,
  rect: { left: number, top: number, width: number, height: number }
): DragPreview['position'] {
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < rect.width / 3) return 'left'
  if (x > rect.width - rect.width / 3) return 'right'
  if (y < rect.height / 3) return 'top'
  if (y > rect.height - rect.height / 3) return 'bottom'

  return 'center'
}

export function createPanelDragPreview(
  event: DragEvent,
  targetPanelId: string,
  rect: DOMRect,
  containerRect: { left: number, top: number }
): DragPreview {
  const position = getPanelDropPosition(event.clientX, event.clientY, rect)
  const blocked = !canSplitWithinBounds(position ?? 'center', {
    width: rect.width,
    height: rect.height
  })

  return {
    visible: true,
    position,
    targetPanelId,
    targetScope: 'panel',
    blocked,
    message: blocked ? SPLIT_BLOCKED_MESSAGE : undefined,
    panelBounds: {
      left: rect.left - containerRect.left,
      top: rect.top - containerRect.top,
      right: rect.right - containerRect.left,
      bottom: rect.bottom - containerRect.top,
      width: rect.width,
      height: rect.height
    }
  }
}

export function createContainerDragPreview(
  position: 'left' | 'right' | 'top' | 'bottom',
  rect: DOMRect
): DragPreview {
  const blocked = !canSplitWithinBounds(position, {
    width: rect.width,
    height: rect.height
  })

  return {
    visible: true,
    position,
    targetPanelId: null,
    targetScope: 'container',
    blocked,
    message: blocked ? SPLIT_BLOCKED_MESSAGE : undefined,
    panelBounds: {
      left: 0,
      top: 0,
      right: rect.width,
      bottom: rect.height,
      width: rect.width,
      height: rect.height
    }
  }
}

export function createHiddenDragPreview(targetScope: DragPreview['targetScope'] = 'panel'): DragPreview {
  return {
    visible: false,
    position: null,
    targetPanelId: null,
    targetScope,
    blocked: false,
    message: undefined
  }
}
