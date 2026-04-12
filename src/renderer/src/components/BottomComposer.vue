<template>
  <div
    v-show="!collapsed || isTransitioning"
    class="bottom-composer"
    :class="{ 'is-collapsed': collapsed, 'is-resizing': isResizing }"
    :style="{ height: collapsed ? '0px' : `${height}px` }"
    data-testid="bottom-composer"
  >
    <div
      class="composer-resize-handle"
      @mousedown="startResize"
      data-testid="composer-resize-handle"
    >
      <div class="resize-handle-bar"></div>
    </div>

    <div class="composer-content">
      <div class="composer-panel">
        <div class="composer-top-row">
          <div class="composer-tool-group" aria-label="Composer controls">
            <button
              class="tool-button"
              type="button"
              title="登录"
              aria-label="登录"
              @click="handleLogin"
            >
              <el-icon :size="16"><User /></el-icon>
            </button>
            <button
              class="tool-button"
              :class="{ active: websiteSidebarVisible }"
              type="button"
              :title="websiteSidebarVisible ? '隐藏网页侧边栏' : '展开网页侧边栏'"
              :aria-label="websiteSidebarVisible ? '隐藏网页侧边栏' : '展开网页侧边栏'"
              @click="toggleWebsiteSidebar"
            >
              <el-icon :size="16"><Menu /></el-icon>
            </button>
            <button
              class="tool-button"
              :class="{ active: websiteInputVisible }"
              type="button"
              :title="websiteInputVisible ? '隐藏网页输入框' : '展开网页输入框'"
              :aria-label="websiteInputVisible ? '隐藏网页输入框' : '展开网页输入框'"
              @click="toggleWebsiteInput"
            >
              <el-icon :size="16"><View /></el-icon>
            </button>
            <button
              class="tool-button"
              type="button"
              title="新建对话"
              aria-label="新建对话"
              @click="startNewConversation"
            >
              <el-icon :size="16"><ChatLineRound /></el-icon>
            </button>
            <button
              class="tool-button"
              type="button"
              title="展开输入框"
              aria-label="展开输入框"
              @click="increaseHeight"
            >
              <el-icon :size="16"><ArrowUp /></el-icon>
            </button>
            <button
              class="tool-button"
              type="button"
              title="收起输入框"
              aria-label="收起输入框"
              @click="toggleCollapse"
            >
              <el-icon :size="16"><ArrowDown /></el-icon>
            </button>
          </div>

          <label class="target-control">
            <span>Send to:</span>
            <select
              v-model="targetModeValue"
              class="target-select"
              aria-label="选择发送目标"
              data-testid="composer-target-select"
            >
              <option value="active-tab">Active Tab</option>
              <option value="all-tabs">All Tabs</option>
            </select>
          </label>
        </div>

        <textarea
          v-model="draftText"
          placeholder="向 OneChat 提问..."
          class="composer-textarea"
          @input="handleTextInput"
          @keydown.enter.exact.prevent="send"
          data-testid="composer-textarea"
        ></textarea>

        <div class="composer-hint">使用 CTRL+ENTER 换行。</div>

        <div class="composer-actions">
          <button
            class="action-button"
            type="button"
            title="添加图片"
            aria-label="添加图片"
            @click="selectImage"
          >
            <el-icon :size="18"><Picture /></el-icon>
          </button>
          <button
            class="action-button"
            type="button"
            title="添加文件"
            aria-label="添加文件"
            @click="selectFile"
          >
            <el-icon :size="18"><FolderOpened /></el-icon>
          </button>
          <button
            class="send-button"
            type="button"
            :disabled="!canSend"
            title="发送"
            aria-label="发送"
            @click="send"
          >
            <el-icon :size="22"><Promotion /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-show="collapsed"
    class="composer-collapsed-bar"
    @click="toggleCollapse"
    data-testid="composer-collapsed-bar"
  >
    <div class="resize-handle-bar"></div>
    <span class="collapsed-text">展开输入框</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useComposerStore } from '@/stores/composer'
import type { ComposerTargetMode } from '@/stores/composer'
import { useWebviewDispatch } from '@/composables/useWebviewDispatch'
import {
  ArrowDown,
  ArrowUp,
  Menu,
  View,
  ChatLineRound,
  User,
  Picture,
  FolderOpened,
  Promotion
} from '@element-plus/icons-vue'

const composerStore = useComposerStore()
const webviewDispatch = useWebviewDispatch()

// State
const isResizing = ref(false)
const isTransitioning = ref(false)
const startY = ref(0)
const startHeight = ref(0)
const disabledPointerTargets: Array<{ element: HTMLElement, pointerEvents: string }> = []

// Computed
const draftText = computed({
  get: () => composerStore.draftText,
  set: (value) => composerStore.setDraftText(value)
})

const height = computed(() => composerStore.height)
const collapsed = computed(() => composerStore.collapsed)
const targetMode = computed(() => composerStore.targetMode)
const websiteSidebarVisible = computed(() => composerStore.websiteSidebarVisible)
const websiteInputVisible = computed(() => composerStore.websiteInputVisible)

const targetModeValue = computed({
  get: () => targetMode.value,
  set: (mode: ComposerTargetMode) => setTargetMode(mode)
})

const canSend = computed(() => draftText.value.trim().length > 0 && webviewDispatch.targetTabs.value.length > 0)

// Methods
function setTargetMode(mode: ComposerTargetMode) {
  composerStore.setTargetMode(mode)
}

function toggleWebsiteSidebar() {
  const newValue = !websiteSidebarVisible.value
  composerStore.setWebsiteSidebarVisible(newValue)
  webviewDispatch.dispatchSidebarVisibleChanged(newValue)
}

function toggleWebsiteInput() {
  const newValue = !websiteInputVisible.value
  composerStore.setWebsiteInputVisible(newValue)
  webviewDispatch.dispatchInputBoxVisibleChanged(newValue)
}

function startNewConversation() {
  webviewDispatch.dispatchChatNewButtonClicked()
}

function handleLogin() {
  webviewDispatch.dispatchLoginButtonClicked()
}

async function selectImage() {
  try {
    const result = await window.electronAPI.openImageDialog()
    if (result) {
      webviewDispatch.dispatchAddImageButtonClicked(result)
    }
  } catch (error) {
    console.error('[BottomComposer] Error selecting image:', error)
  }
}

async function selectFile() {
  try {
    const result = await window.electronAPI.openFileDialog()
    if (result) {
      webviewDispatch.dispatchAddFileButtonClicked(result)
    }
  } catch (error) {
    console.error('[BottomComposer] Error selecting file:', error)
  }
}

function handleTextInput() {
  // Task 2.3: Dispatch text change to webview
  webviewDispatch.dispatchInputTextChanged(draftText.value)
}

function send() {
  if (!canSend.value) return
  // Task 2.4: Dispatch text change and send to webview
  webviewDispatch.dispatchInputTextChanged(draftText.value)
  webviewDispatch.dispatchInputTextSended()
  composerStore.clearDraft()
}

function toggleCollapse() {
  isTransitioning.value = true
  composerStore.toggleCollapsed()
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

function increaseHeight() {
  composerStore.setHeight(height.value + 48)
}

function startResize(e: MouseEvent) {
  if (collapsed.value) return

  isResizing.value = true
  startY.value = e.clientY
  startHeight.value = height.value
  disableWebviewPointerEvents()

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  window.addEventListener('blur', stopResize)
  e.preventDefault()
}

function onResize(e: MouseEvent) {
  if (!isResizing.value) return

  const deltaY = startY.value - e.clientY
  const newHeight = startHeight.value + deltaY
  composerStore.setHeight(newHeight)
}

function stopResize() {
  if (!isResizing.value) return

  isResizing.value = false
  restoreWebviewPointerEvents()
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('blur', stopResize)
}

function disableWebviewPointerEvents() {
  restoreWebviewPointerEvents()

  const targets = document.querySelectorAll<HTMLElement>('.webview-container, webview')
  targets.forEach(element => {
    disabledPointerTargets.push({
      element,
      pointerEvents: element.style.pointerEvents
    })
    element.style.pointerEvents = 'none'
  })
}

function restoreWebviewPointerEvents() {
  while (disabledPointerTargets.length > 0) {
    const target = disabledPointerTargets.pop()
    if (target) {
      target.element.style.pointerEvents = target.pointerEvents
    }
  }
}

onUnmounted(() => {
  restoreWebviewPointerEvents()
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('blur', stopResize)
})
</script>

<style scoped>
.bottom-composer {
  display: flex;
  flex-direction: column;
  background: transparent;
  transition: height 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
}

.bottom-composer.is-collapsed {
  height: 0 !important;
  min-height: 0;
  padding: 0;
  border: none;
}

.bottom-composer.is-resizing {
  transition: none;
}

.composer-resize-handle {
  height: 5px;
  background: transparent;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.composer-resize-handle:hover {
  background: var(--accent-color);
}

.resize-handle-bar {
  width: 48px;
  height: 2px;
  background: #cfcfcf;
  border-radius: 1px;
}

.composer-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 0px 15px 15px 15px;
}

.composer-panel {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #cdcdcd;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  overflow: hidden;
}

.composer-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 38px;
  padding: 8px 8px 2px 10px;
  flex-shrink: 0;
}

.composer-tool-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.tool-button,
.action-button,
.send-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #dddddd;
  background: #ffffff;
  color: #1f1f1f;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
}

.tool-button:hover,
.action-button:hover,
.send-button:hover:not(:disabled) {
  background: #f3f7fb;
  border-color: #b5d2ec;
  color: var(--accent-color);
}

.tool-button.active {
  border-color: #c5d8ea;
  background: #eef6ff;
  color: var(--accent-color);
}

.target-control {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #222222;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
}

.target-select {
  min-width: 260px;
  height: 30px;
  padding: 0 34px 0 10px;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
  background: #ffffff;
  color: #111111;
  font: inherit;
  outline: none;
}

.target-select:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.12);
}

.composer-textarea {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 4px 12px 0;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: #111111;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
}

.composer-textarea::placeholder {
  color: #7b7f86;
}

.composer-hint {
  padding: 2px 12px 0;
  color: #7b7f86;
  font-size: 14px;
  line-height: 20px;
  flex-shrink: 0;
  user-select: none;
}

.composer-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-button {
  width: 40px;
  height: 40px;
  color: #111111;
}

.send-button {
  width: 48px;
  height: 48px;
  border-color: #bde2ca;
  background: #ecfff1;
  color: #3ac465;
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  background: #f6f6f6;
  color: #9a9a9a;
  border-color: #dedede;
}

.composer-collapsed-bar {
  height: 34px;
  background: #f7f7f7;
  border-top: 1px solid #d7d7d7;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.composer-collapsed-bar:hover {
  background: #eeeeee;
}

.collapsed-text {
  font-size: 12px;
  color: #666666;
  user-select: none;
}

.theme-dark .bottom-composer,
.theme-dark .composer-collapsed-bar {
  background: #252526;
  border-top-color: #444444;
}

.theme-dark .composer-resize-handle {
  background: #2d2d30;
  border-bottom-color: #3d3d3d;
}

.theme-dark .composer-panel,
.theme-dark .target-select,
.theme-dark .tool-button,
.theme-dark .action-button {
  background: #1f1f1f;
  border-color: #444444;
  color: var(--text-primary);
}

.theme-dark .composer-textarea {
  color: var(--text-primary);
}

.theme-dark .composer-hint,
.theme-dark .target-control,
.theme-dark .composer-textarea::placeholder,
.theme-dark .collapsed-text {
  color: var(--text-secondary);
}

.theme-dark .tool-button.active {
  background: rgba(0, 122, 204, 0.18);
  border-color: var(--accent-color);
  color: #8fd0ff;
}

@media (max-width: 760px) {
  .composer-top-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .target-control {
    width: 100%;
  }

  .target-select {
    min-width: 0;
    flex: 1;
  }
}
</style>
