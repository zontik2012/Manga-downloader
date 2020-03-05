import {MangaWebsite} from "./manga-website-list";

export function getMangaWebsite(mangaURL: string) {
    if (mangaURL.includes("readmanga.me")) {
        return MangaWebsite["readmanga.me"]
    } else if (mangaURL.includes("mintmanga.com")) {
        return MangaWebsite["mintmanga.com"]
    } else {
        throw new Error(`Could not parse url: ${mangaURL}. This website might be unsupported. Yet.`)
    }
}