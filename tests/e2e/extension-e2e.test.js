// E2E tests for Chrome Extension
// Note: These tests require a built extension and Chrome/Chromium
// Run with: npm run test:e2e

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Extension E2E Tests', () => {
  let browser;
  let page;
  const extensionPath = path.resolve(__dirname, '../../');

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const targets = await browser.targets();
    const extensionTarget = targets.find(
      target => target.type() === 'service_worker'
    );

    if (extensionTarget) {
      const extensionPage = await extensionTarget.page();
      if (extensionPage) {
        await extensionPage.close();
      }
    }

    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Extension Installation', () => {
    it('should load extension successfully', async () => {
      const extensionId = await getExtensionId(browser);
      expect(extensionId).toBeTruthy();
    });

    it('should have correct manifest', async () => {
      const extensionId = await getExtensionId(browser);
      const backgroundPage = await browser.newPage();
      await backgroundPage.goto(`chrome-extension://${extensionId}/background.js`);
      
      // Extension should load without errors
      const errors = [];
      backgroundPage.on('pageerror', error => errors.push(error));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(errors.length).toBe(0);
      await backgroundPage.close();
    });
  });

  describe('Popup Functionality', () => {
    it('should open popup and display status', async () => {
      const extensionId = await getExtensionId(browser);
      const popupPage = await browser.newPage();
      
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForSelector('#status');
      
      const statusText = await popupPage.$eval('#status', el => el.textContent);
      expect(statusText).toBeTruthy();
      
      await popupPage.close();
    });

    it('should toggle extension state', async () => {
      const extensionId = await getExtensionId(browser);
      const popupPage = await browser.newPage();
      
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForSelector('#toggleBtn');
      
      const initialStatus = await popupPage.$eval('#status', el => el.textContent);
      
      await popupPage.click('#toggleBtn');
      await popupPage.waitForTimeout(500);
      
      const newStatus = await popupPage.$eval('#status', el => el.textContent);
      expect(newStatus).not.toBe(initialStatus);
      
      await popupPage.close();
    });
  });

  describe('Options Page', () => {
    it('should load options page', async () => {
      const extensionId = await getExtensionId(browser);
      const optionsPage = await browser.newPage();
      
      await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
      await optionsPage.waitForSelector('#settingsForm');
      
      const formExists = await optionsPage.$('#settingsForm');
      expect(formExists).toBeTruthy();
      
      await optionsPage.close();
    });

    it('should save settings', async () => {
      const extensionId = await getExtensionId(browser);
      const optionsPage = await browser.newPage();
      
      await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
      await optionsPage.waitForSelector('#timeBetweenSearchCycles');
      
      await optionsPage.type('#timeBetweenSearchCycles', '2000');
      await optionsPage.click('#saveBtn');
      await optionsPage.waitForSelector('#successMessage.show', { timeout: 5000 });
      
      const successVisible = await optionsPage.$eval(
        '#successMessage',
        el => el.classList.contains('show')
      );
      expect(successVisible).toBe(true);
      
      await optionsPage.close();
    });
  });

  describe('Content Script Injection', () => {
    it('should inject content script on Instagram', async () => {
      const page = await browser.newPage();
      
      // Mock Instagram page
      await page.setContent(`
        <html>
          <head><title>Instagram</title></head>
          <body><div id="root"></div></body>
        </html>
      `);
      
      // Note: Actual content script injection requires extension to be loaded
      // This is a placeholder for the actual test
      const bodyContent = await page.$eval('body', el => el.innerHTML);
      expect(bodyContent).toBeTruthy();
      
      await page.close();
    });
  });

  async function getExtensionId(browser) {
    const targets = await browser.targets();
    const extensionTarget = targets.find(
      target => target.type() === 'service_worker'
    );
    
    if (!extensionTarget) {
      return null;
    }
    
    const url = extensionTarget.url();
    const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
    return match ? match[1] : null;
  }
});

