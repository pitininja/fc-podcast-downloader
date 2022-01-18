import Fs from 'fs';
import Path from 'path';
import Axios from 'axios';

const Downloader = {

    async downloadEpisode(targetDir, episode) {
        const { url } = episode;
        const fileName = Downloader.buildFileName(episode);
        const filePath = Path.resolve(targetDir, fileName);
        // const { data, headers } = await Axios({
        const { data } = await Axios({
            method: 'GET',
            url,
            responseType: 'stream'
        });
        // const contentLength = parseInt(headers['content-length']);
        // data.on('data', (chunk) => {
        //     // chunk.length
        // });
        return new Promise((resolve, reject) => {
            data.on('end', () => {
                resolve();
            });
            data.on('error', (err) => {
                reject(err);
            });
            data.pipe(
                Fs.createWriteStream(filePath)
            );
        });
    },

    async controlDirWrite(targetDir) {
        try {
            const stat = await Fs.promises.stat(targetDir);
            if (!stat.isDirectory()) {
                throw new Error('Path is not a directory');
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error('Path does not exist');
            }
            throw err;
        }
        try {
            await Fs.promises.access(
                targetDir,
                Fs.constants.W_OK
            );
        } catch {
            throw new Error('Directory is not writable');
        }
        return true;
    },

    buildFileName(episodeData) {
        const { name, date, url } = episodeData;
        const ext = Downloader.getFileExtension(url);
        return `${date} - ${name}.${ext}`;
    },

    getFileExtension(file) {
        return file.split('.').pop();
    }

};

export default Downloader;
