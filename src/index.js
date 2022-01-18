import Inquirer from 'inquirer';

import Scrapper from './services/scrapper.js';
import Downloader from './services/downloader.js';

const podcasts = await Scrapper.getPodcasts();

const { podcastUrl, targetDir } = await Inquirer.prompt([{
    type: 'list',
    name: 'podcastUrl',
    message: 'Select a podcast',
    choices: podcasts.map(({ name, url }) => ({
        name,
        value: url
    })),
    pageSize: 20
}, {
    type: 'input',
    name: 'targetDir',
    message: 'Enter a target directory',
    validate: async (dir) => (
        Downloader.controlDirWrite(dir)
    )
}]);

const episodes = await Scrapper.getAllEpisodes(podcastUrl);

const { confirm } = await Inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Start download of ${episodes.length} episodes in ${targetDir} ?`
}]);

if (confirm) {
    const ui = new Inquirer.ui.BottomBar();
    for (let i = 0; i < episodes.length; i += 1) {
        const episode = episodes[i];
        ui.updateBottomBar(`Downloading episode ${i + 1} / ${episodes.length}`);
        // eslint-disable-next-line no-await-in-loop
        await Downloader.downloadEpisode(targetDir, episode);
    }
    ui.updateBottomBar('All episode have been downloaded');
    ui.close();
}
