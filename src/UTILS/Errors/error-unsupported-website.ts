import {MangaWebsite} from "../manga-website-list";

export class ErrorUnsupportedWebsite extends Error{
    constructor(website: MangaWebsite) {
        super(`Website ${website} is not supported. Yet.`);

        Object.setPrototypeOf(this, ErrorUnsupportedWebsite.prototype);
    }
}