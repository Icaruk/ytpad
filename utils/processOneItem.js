
const chalk = require("chalk");
const fs = require("fs");
const ytdl = require('ytdl-core');
const DraftLog = require('draftlog').into(console)
const ytcog = require('ytcog');
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);



function processOneItem(singleVideoId, outDir, arrIdx = [1, 1], intentos = 3) {
	
	if (intentos-- === 0) return;
	
	
	return new Promise( async (resolve) => {
		
		let info = await ytdl.getInfo(singleVideoId);
		const title = info.videoDetails.title;
		
		const fileName = (title).replace(/[^a-z0-9\-áéíúóàèìòùñ\s.'!¡]/gim, "");
		// const filePath = `${outDir}/${fileName}.mp3`;		
		
		
		
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
					chalk.yellow(`WAIT `) +
					// chalk.grey(`${arrIdx[0]} / ${arrIdx[1]} `) +
					chalk.cyan(`${title} `)
				);
				
				case "finished": return (
					chalk.dim('[') +
					chalk.green('|').repeat(units) +
					' '.repeat(50 - units) +
					chalk.dim(']') +
					chalk.green(` ${progress} % `) +
					chalk.green(`OK `) +
					// chalk.grey(`${arrIdx[0]} / ${arrIdx[1]} `) +
					chalk.cyan(`${title} `)
				);
				
				case "error": return (
					chalk.red('[') +
					chalk.red('|').repeat(units) +
					' '.repeat(50 - units) +
					chalk.red(']') +
					chalk.red(` ${progress} % `) +
					chalk.red(`ERROR `) +
					// chalk.grey(`${arrIdx[0]} / ${arrIdx[1]} `) +
					chalk.gray(`${title} `)
				);
			};
			
		};
		
		
		const barLine = console.draft("Wait...");
		barLine(ProgressBar(0));
		
		
		
		// Download
		await ytcog.dl({
			// https://github.com/gatecrasher777/ytcog/wiki/Video#Options
			id: singleVideoId,
			path: outDir,
			filename: fileName,
			container: "mp4",
			audioQuality: "highest",
			videoQuality: "none",
			progress: (prog, sizeBytes) => {
				
				prog = Math.round(prog);
				
				if (prog < 100) barLine(ProgressBar(prog));
				
			},
		}).catch( reason => {
			barLine(ProgressBar(prog, "error"));
			resolve(false);
		});
		
		
		resolve(true);
		barLine(ProgressBar(100, "finished"));
		
		
		
		// Busco el archivo
		const ourDirFiles = fs.readdirSync(outDir);
		const file = ourDirFiles.find( _x => _x.startsWith(fileName));
		
		
		
		// Convert
		if (file) {
			
			try {
				
				const route = path.join(outDir, file);
				let command = ffmpeg(route);
				
				command
				.noVideo()
				.outputFormat("mp3")
				.audioCodec("libmp3lame")
				.audioBitrate(192)
				.saveToFile( path.join(outDir, `${fileName}.mp3`) )
				.once("end", () => {
					
					if (fs.existsSync(route)) fs.unlinkSync(route);
					
					if (arrIdx[0] === arrIdx[1]) {
						console.log(chalk.greenBright("\n\nProcess ended!\n"));
					};
					
				});
				
			} catch (err) {
				console.log( err );
			};
			
		};
		
		
	});
	
};



module.exports = processOneItem;

