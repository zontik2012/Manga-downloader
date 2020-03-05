import {MangaDownloader} from "../lib/manga-downloader";


const main = async () => {
    const mangaDownloader = new MangaDownloader("https://readmanga.me/noragami__A1b916d/vol19/76?mtr=", "D:/Manga", {from: 81, to: 82});
    await mangaDownloader.init();
    await mangaDownloader.downloadManga();
};

main().catch(reason => console.error(reason));