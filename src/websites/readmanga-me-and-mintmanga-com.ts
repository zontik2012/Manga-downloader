import {AbstractWebsite} from "./abstract-website";
import {waitForSelector} from "../UTILS/wait-for-selector";

export class ReadmangaMeAndMintmangaCom extends AbstractWebsite {

    public async getMangaTitle(): Promise<string> {
        return this.page.evaluate(() => document.querySelector(".manga-link")!.textContent!.trim());
    }

    public async chapters(): Promise<boolean> {
        return true;
    }

    public async getChapterAmount(): Promise<number> {
        return this.page.evaluate(() => document.querySelectorAll("div.top-block div.topControl select#chapterSelectorSelect option").length);
    }

    public async gotoChapter(chapter: number): Promise<void> {
        const chapterSelectValue = await this.page.evaluate((chapters) => document.querySelector<HTMLOptionElement>(`div.top-block div.topControl select#chapterSelectorSelect option:nth-child(${chapters})`)!.value, await this.getChapterAmount() - chapter);
        const currentChapterValue = await this.page.evaluate(() => document.querySelector<HTMLOptionElement>(`div.top-block div.topControl select#chapterSelectorSelect option[selected]`)!.value);
        if (chapterSelectValue === currentChapterValue) {
            return;
        } else {
            await Promise.all([
                this.page.select(`div.top-block div.topControl select#chapterSelectorSelect`, chapterSelectValue),
                this.page.waitForNavigation({waitUntil: "domcontentloaded"})
            ]);
        }
    }

    public async getChapterName(): Promise<string> {
        return this.page.evaluate(() => document.querySelector("select#chapterSelectorSelect option[selected]")!.textContent!.trim())
    }

    public async getImagesUrls(): Promise<string[]> {
        const pages = await this.page.evaluate(() => document.querySelectorAll("div.top-block select.page-selector.form-control:not(.pages-count-title) option").length);
        const result: string[] = [];
        for (let i = 0; i < pages; i++) {
            await this.page.select("div.top-block select.page-selector.form-control:not(.pages-count-title)", String(i));
            result.push(await this.page.evaluate(() => document.querySelector<HTMLImageElement>("img#mangaPicture")!.src));
        }
        return result;
    }

    protected extractMangaUrl(mangaURL: string): string {
        const regexResult = mangaURL.match(/([\w]{1,5}:\/\/)(readmanga\.me|mintmanga\.com)\/([\w\d]*)/);
        if (!regexResult || !regexResult[1] || !regexResult[2]) {
            throw new Error(`Couldn't parse manga URL: ${mangaURL}`);
        }
        return `${regexResult[1]}${regexResult[2]}/${regexResult[3]}`;
    }

    protected async gotoMangaPage(mangaURL: string): Promise<void> {
        const selector_readManga = "a.btn-primary";
        const selector_mangaPageImage = "#mangaPicture";

        await this.page.goto(mangaURL, {waitUntil: "domcontentloaded"});
        await waitForSelector(this.page, selector_readManga, {visible: true});
        await this.page.click(selector_readManga);
        await waitForSelector(this.page, selector_mangaPageImage);
    }
}