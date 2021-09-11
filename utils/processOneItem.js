
const chalk = require("chalk");
const fs = require("fs");
const ytdl = require('ytdl-core');
const DraftLog = require('draftlog').into(console)



function processOneItem(singleVideoId, outDir, arrIdx = [1, 1], intentos = 3) {
	
	if (intentos-- === 0) return;
	
	
	return new Promise( async (resolve) => {
		
		let info = await ytdl.getInfo(singleVideoId);
		const title = info.videoDetails.title;
		
		const fileName = (title).replace(/[^a-z0-9\-áéíúóàèìòùñ\s.'!¡]/gim, "");
		const filePath = `${outDir}/${fileName}.mp3`;		
		
		
		
		// Input progess goes from 0 to 100
		function ProgressBar(progress, status = "progress") {
			
			// Make it 50 characters length
			progress = Math.min(100, progress)
			let units = Math.round(progress / 2)
			
			
			switch (status) {
				
				case "progress": return (
					chalk.dim('[') +
					chalk.yellow('|').repeat(units) +
					' '.repeat(50 - units) +
					chalk.dim(']') +
					chalk.yellow(` ${progress} % `) +
					chalk.cyan(`${title} `)
				);
				
				case "finished": return (
					chalk.dim('[') +
					chalk.green('|').repeat(units) +
					' '.repeat(50 - units) +
					chalk.dim(']') +
					chalk.green(` ${progress} % `) +
					chalk.cyan(`${title} `)
				);
				
				case "error": return (
					chalk.red('[') +
					chalk.red('|').repeat(units) +
					' '.repeat(50 - units) +
					chalk.red(']') +
					chalk.red(` ${progress} % `) +
					chalk.gray(`${title} `)
				);
			};
			
		};
		
		
		const barLine = console.draft("Wait...");
		let progreso = 0;
		
		let lastChunkReceived = Date.now();
		
		barLine(ProgressBar(progreso));
		
		
		
		const stream = ytdl(`https://youtube.com/watch?v=${singleVideoId}`, {
			filter: "audioonly"
		});
		
		
		stream
		.on("progress", (chunkLengh, totalBytesDownloadad, totalBytes) => {
			
			progreso = Math.round(totalBytesDownloadad * 100 / totalBytes);
			
			// if (progreso > 5) {
			// 	const dif = Date.now() - lastChunkReceived;
			// 	if (dif > 4000) return stream.destroy("error");
			// };
			
			// ultimoProgreso = progreso;
			
			barLine(ProgressBar(progreso));
			
		})
		.on("finish", async () => {
			
			const existe = fs.existsSync(filePath);
			if (!existe) return processOneItem(...arguments);
			
			let valido = fs.statSync(filePath).size > 0;
			if (!valido) return processOneItem(...arguments);
			
			
			barLine(ProgressBar(progreso, "finished"), chalk.green('OK'))
			
			resolve(true);
			
		})
		.on("error", err => {
			
			const existe = fs.existsSync(filePath);
			let valido = existe && fs.statSync(filePath).size > 0;
			
			if (existe && valido) return; // falso error
			if (existe && !valido) {
				fs.unlinkSync(filePath);
			};
			
			barLine(ProgressBar(progreso, "error"), chalk.red(`ERROR (ID ${singleVideoId})`))
			return processOneItem(...arguments);
			
		})
		.pipe(fs.createWriteStream(filePath));
		
	});
	
};



module.exports = processOneItem;

