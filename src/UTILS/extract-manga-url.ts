import {MangaWebsite} from "./manga-website-list";
import {ErrorUnsupportedWebsite} from "./Errors/error-unsupported-website";

export function extractMangaUrl(mangaURL: string, website: MangaWebsite): string {
    switch (website) {
        case MangaWebsite["readmanga.me"]: {
            const regexpResult = mangaURL.match(/readmanga.me\/([^\/]\w+)/);
            if (!regexpResult || !regexpResult[1]) {
                throw new Error();
            }
            return `${new URL(mangaURL).origin}/${regexpResult[1]}`;
        }
        case MangaWebsite["mintmanga.com"]: {
            const regexpResult = mangaURL.match(/mintmanga.com\/([^\/]\w+)/);
            if (!regexpResult || !regexpResult[1]) {
                throw new Error();
            }
            return `${new URL(mangaURL).origin}/${regexpResult[1]}`;
        }
        default: {
            throw new ErrorUnsupportedWebsite(website);
        }
    }
}