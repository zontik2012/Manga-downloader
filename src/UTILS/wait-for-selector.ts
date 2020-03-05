import {Page, WaitForSelectorOptions} from "puppeteer";

export async function waitForSelector(page: Page, selector: string, options: WaitForSelectorOptions = {}): Promise<void> {
    const handle = await page.waitForSelector(selector, options);
    await handle.dispose();
}