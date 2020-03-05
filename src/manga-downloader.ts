import Puppeteer, {Browser, Page} from "puppeteer";
import fs from "fs";
import {MangaWebsite} from "./UTILS/manga-website-list";
import {getMangaWebsite} from "./UTILS/get-manga-website";
import {ErrorUnsupportedWebsite} from "./UTILS/Errors/error-unsupported-website";
import {waitForSelector} from "./UTILS/wait-for-selector";
import {ReadmangaMeAndMintmangaCom} from "./websites/readmanga-me-and-mintmanga-com";
import {AbstractWebsite} from "./websites/abstract-website";

export class MangaDownloader {
    public bot!: Browser;
    public mainPage!: Page;
    private mangaTitle: string | undefined;
    private chapterNames: Set<string>;
    private website: MangaWebsite;
    private websiteTool!: AbstractWebsite;
    private readonly mangaURL: string;
    private readonly downloadDirectory: string;
    private readonly fromChapter: number;
    private readonly toChapter: number;

    constructor(mangaURL: string, downloadDirectory: string, chapters?: { from?: number, to?: number }) {
        this.mangaURL = mangaURL;
        this.downloadDirectory = downloadDirectory;
        if (chapters) {
            if (chapters.from) {
                this.fromChapter = chapters.from;
            } else {
                this.fromChapter = 1;
            }
            if (chapters.to) {
                this.toChapter = chapters.to;
            } else {
                this.toChapter = Infinity;
            }
        } else {
            this.fromChapter = 1;
            this.toChapter = Infinity;
        }
        this.chapterNames = new Set<string>();
        this.website = MangaWebsite.none;
    }

    public async init(): Promise<void> {
        this.bot = await Puppeteer.launch({headless: false});
        this.mainPage = (await this.bot.pages())[0];
        this.website = getMangaWebsite(this.mangaURL);
        this.websiteTool = await this.initWebsiteTool();
        this.mangaTitle = await this.websiteTool.getMangaTitle();
        this.makeMangaDirectory();
    }

    public async downloadManga(): Promise<void> {
        try {
            if (await this.websiteTool.chapters()) {
                let chaptersAmount = await this.websiteTool.getChapterAmount();
                if (this.toChapter) {
                    if (this.toChapter < chaptersAmount) {
                        chaptersAmount = this.toChapter;
                    } else {
                        console.log("toChapter is bigger than or equal to chapter amount");
                    }
                }
                for (let i = this.fromChapter; i <= Math.min(chaptersAmount, this.toChapter); i++) {
                    await this.websiteTool.gotoChapter(i - 1);
                    await waitForSelector(this.mainPage, "img#mangaPicture");
                    const chapterName = this.correctChapterName(await this.websiteTool.getChapterName());
                    await this.downloadChapter(chapterName);
                }
            } else {
                const urls = await this.websiteTool.getImagesUrls();
                await Promise.all(
                    urls.map(async (url) =>
                        await this.downloadImage(
                            url,
                            urls.indexOf(url) + 1
                        )
                    )
                )
            }
        } catch (e) {
            console.error(e);
        } finally {
            await this.bot.close();
        }
    }

    private async downloadChapter(chapterName: string) {
        await this.createChapterDirectory(chapterName);
        const urls = await this.websiteTool.getImagesUrls();
        await Promise.all(
            urls.map(async (url) =>
                await this.downloadImage(
                    url,
                    urls.indexOf(url) + 1,
                    chapterName
                )
            )
        );
    }

    private async downloadImage(imageUrl: string, pageNumber: number, chapterName?: string) {
        const imagePage = await this.bot.newPage();
        try {
            const viewSource = await imagePage.goto(imageUrl, {timeout: 0});
            const extension = imageUrl.match(/[\w\W]+\.[0-9a-z]+(?=\?)?/)![0].match(/\.[0-9a-z]+$/)![0];
            if (!extension) {
                throw new Error("couldn't get image extension");
            }
            let directory: string;
            if (chapterName) {
                directory = `${this.downloadDirectory}/${this.mangaTitle}/${chapterName}/${pageNumber}${extension}`;
            } else {
                directory = `${this.downloadDirectory}/${this.mangaTitle}/${pageNumber}${extension}`;
            }
            fs.writeFile(directory, await viewSource!.buffer(), err => {
                if (err) {
                    throw new Error(err.message);
                }
            });
        } catch (e) {
            console.error(imageUrl);
            throw e;
        } finally {
            await imagePage.close();
        }
    }

    private async initWebsiteTool() {
        let websiteTool;
        switch (this.website) {
            case MangaWebsite["readmanga.me"]:
            case MangaWebsite["mintmanga.com"]: {
                websiteTool = new ReadmangaMeAndMintmangaCom(this.mainPage);
                break;
            }
            default: {
                throw new ErrorUnsupportedWebsite(this.website);
            }
        }
        await websiteTool.init(this.mangaURL);
        return websiteTool;
    }

    private async createChapterDirectory(chapterName: string) {
        if (!fs.existsSync(`${this.downloadDirectory}/${this.mangaTitle}/${chapterName}`)) {
            fs.mkdirSync(`${this.downloadDirectory}/${this.mangaTitle}/${chapterName}`);
        }
    }

    private makeMangaDirectory(): void {
        if (!this.mangaTitle) {
            throw new Error("No manga title");
        }
        if (fs.existsSync(`${this.downloadDirectory}/${this.mangaTitle}`)) {
            throw new Error("directory already exists");
        }
        switch (process.platform) {
            case "win32": {
                const path = this.downloadDirectory.split("/");
                let currentPosition = path[0];
                for (let i = 1; i < path.length; i++) {
                    const currentStep = `${currentPosition}/${path[i]}`;
                    if (!fs.existsSync(currentPosition)) {
                        fs.mkdirSync(currentPosition);
                    }
                    currentPosition = currentStep;
                }
                break;
            }
            default: {
                throw new Error(`${process.platform} is not supported yet`);
            }
        }
        fs.mkdirSync(`${this.downloadDirectory}/${this.mangaTitle}`);
    }

    private correctChapterName(chapterTitle: string) {
        if (!chapterTitle) {
            throw new Error("Couldn't get Chapter Title");
        }
        chapterTitle = chapterTitle.replace(/[/\\?%*:|"<>.]/g, "");
        let chapterName = chapterTitle;
        for (let i = 2; this.chapterNames.has(chapterName); i++) {
            chapterName = `${chapterTitle} (${i})`;
        }
        this.chapterNames.add(chapterName);
        return chapterName;
    }
}