import { Page, Locator } from '@playwright/test'

export class LayoutTestHelper {
  constructor(private page: Page) {}

  async openTab(modelId: string) {
    await this.page.click(`[data-testid="ai-model-${modelId}"]`)
    await this.page.waitForTimeout(100)
  }

  async splitTab(tabId: string, direction: 'horizontal' | 'vertical') {
    const tab = this.page.locator(`[data-testid="tab-${tabId}"]`)
    await tab.click({ button: 'right' })
    await this.page.click(`[data-testid="split-${direction}"]`)
    await this.page.waitForTimeout(200)
  }

  async dragTab(tabId: string, target: string) {
    const tab = this.page.locator(`[data-testid="tab-${tabId}"]`)
    const targetEl = this.page.locator(target)
    await tab.dragTo(targetEl)
    await this.page.waitForTimeout(200)
  }

  async getPaneCount(): Promise<number> {
    return await this.page.locator('[data-testid^="pane-"]').count()
  }

  async getTabCount(): Promise<number> {
    return await this.page.locator('[data-testid^="tab-"]').count()
  }

  async waitForLayoutReady() {
    await this.page.waitForSelector('.lm_goldenlayout', { timeout: 5000 })
  }

  async getActiveTab(): Promise<Locator> {
    return this.page.locator('[data-testid^="tab-"].active')
  }

  async closeTab(tabId: string) {
    const tab = this.page.locator(`[data-testid="tab-${tabId}"]`)
    await tab.locator('.tab-close').click()
    await this.page.waitForTimeout(100)
  }
}
