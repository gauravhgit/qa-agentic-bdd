import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // Run the actual test steps
    await use(page);

    // Capture DOM snapshot only if test failed
    if (testInfo.status !== testInfo.expectedStatus) {
      try {
        const rawBody = await page.locator('body').innerHTML();
        
        // Strip scripts, styles, SVGs and truncate to prevent context window overflow
        const cleanDom = rawBody
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
          .replace(/\s+/g, ' ')
          .slice(0, 15000); // Cap at ~15k characters for token efficiency

        const snapshotPath = path.join(process.cwd(), 'tests', 'generated', 'failure_dom.txt');
        fs.writeFileSync(snapshotPath, cleanDom, 'utf-8');
      } catch (err) {
        console.error('Failed to capture failure DOM snapshot:', err);
      }
    }
  },
});

export { expect } from '@playwright/test';