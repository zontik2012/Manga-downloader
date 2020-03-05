import {Page} from "puppeteer";

export abstract class AbstractWebsite {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    public async init(mangaURL: string): Promise<void> {
        await this.gotoMangaPage(this.extractMangaUrl(mangaURL));
    };

    public async abstract getMangaTitle(): Promise<string>;

    public async abstract chapters(): Promise<boolean>;

    public async abstract getChapterAmount(): Promise<number>;

    public async abstract gotoChapter(chapter: number): Promise<void>;

    public async abstract getChapterName(): Promise<string>;

    public async abstract getImagesUrls(): Promise<string[]>;

    protected abstract extractMangaUrl(mangaURL: string): string;

    protected async abstract gotoMangaPage(mangaURL: string): Promise<void>;
}