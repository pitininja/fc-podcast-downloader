import Axios from 'axios';
import { JSDOM } from 'jsdom';

const Scrapper = {

    baseUrl: 'https://www.franceculture.fr',
    podcastListRoute: '/emissions',

    async getPodcasts() {
        const { data: html } = await Axios.get(
            new URL(
                Scrapper.podcastListRoute,
                Scrapper.baseUrl
            ).href
        );
        const dom = new JSDOM(html);
        const { document } = dom.window;
        return Array.from(
            document.querySelectorAll(
                '.emissions .list .concept-item'
            )
        ).map((row) => (
            Scrapper.getPodcastData(row)
        ));
    },

    getPodcastData(row) {
        const name = Scrapper.getPodcastName(row);
        const url = Scrapper.getPodcastUrl(row);
        return { name, url };
    },

    getPodcastName(row) {
        return row.querySelector(
            'span.title.name'
        ).textContent;
    },

    getPodcastUrl(row) {
        const route = row.querySelector(
            'a.content[href]'
        ).getAttribute('href');
        return new URL(
            route,
            Scrapper.baseUrl
        ).href;
    },

    async getAllEpisodes(podcastUrl) {
        const { data: html } = await Axios.get(
            Scrapper.cleanUrl(podcastUrl)
        );
        const dom = new JSDOM(html);
        const { document } = dom.window;
        const pageCount = await Scrapper.getPageCount(document);
        const allPageUrls = Scrapper.getAllPageUrls(podcastUrl, pageCount);
        const allPageEpisodes = await Promise.all(
            allPageUrls.map((pageUrl) => (
                Scrapper.getPageEpisodes(pageUrl)
            ))
        );
        return allPageEpisodes.flat();
    },

    async getPageEpisodes(pageUrl) {
        const { data: html } = await Axios.get(pageUrl);
        const dom = new JSDOM(html);
        const { document } = dom.window;
        return Scrapper.getEpisodeRows(
            document
        ).map((row) => (
            Scrapper.getEpisodeData(row)
        )).filter((data) => !!data);
    },

    getEpisodeRows(document) {
        return Array.from(
            document.querySelectorAll(
                '.teasers-list .teaser.teaser-row'
            )
        );
    },

    getEpisodeData(row) {
        const name = Scrapper.getEpisodeName(row);
        const date = Scrapper.getEpisodeDate(row);
        const url = Scrapper.getEpisodeUrl(row);
        return url ? (
            { name, date, url }
        ) : null;
    },

    getEpisodeName(row) {
        return row.querySelector(
            'span.teaser-text-title-wrapper'
        ).textContent;
    },

    getEpisodeDate(row) {
        const frDateText = row.querySelector(
            '.teaser-text-date > span'
        ).textContent;
        return Scrapper.parseDate(frDateText);
    },

    getEpisodeUrl(row) {
        const button = row.querySelector(
            'button.replay-button[data-url]'
        );
        return button ? (
            button.getAttribute('data-url')
        ) : null;
    },

    getPageCount(document) {
        const lastPageUrl = document.querySelector(
            '.pager > .pager-item.last > a'
        ).getAttribute('href');
        const queryParams = lastPageUrl.split('?').pop();
        const pageQueryParam = queryParams.split('&').find((param) => (
            param.startsWith('p=')
        ));
        return parseInt(
            pageQueryParam.split('=').pop()
        );
    },

    parseDate(frDateText) {
        const regex = /(\d{2}\/\d{2}\/\d{4})/;
        const match = frDateText.match(regex);
        const frDate = match.pop();
        return frDate.split('/').reverse().join('-');
    },

    cleanUrl(url) {
        return url.split('?').shift();
    },

    getAllPageUrls(pageUrl, pageCount) {
        const cleanUrl = Scrapper.cleanUrl(pageUrl);
        return Array.from(
            Array(pageCount).keys()
        ).map((i) => (
            i + 1
        )).map((pageNumber) => (
            `${cleanUrl}?p=${pageNumber}`
        ));
    }

};

export default Scrapper;
