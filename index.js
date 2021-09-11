
//! TEST --> https://github.com/gatecrasher777/ytcog



const fs = require("fs");
const readline = require('readline');
const ytpl = require('ytpl');
const chalk = require('chalk');
const processOneItem = require("./utils/processOneItem");
const cola = require("./utils/cola");



const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});



async function doQuestion(question, checkRepeat) {
	
	const response = await new Promise( resolve => {
		
		rl.question(question, (data) => {
			resolve(data);
		});
		
	});
	
	
	if (checkRepeat) {
		if (checkRepeat(response)) return doQuestion(question, checkRepeat);
	};
	
	
	return response;
	
};



(async() => {
	
	// ***********************************************************
	// Intro
	// ***********************************************************
	
	console.log(`
                                                                
8b        d8  888888888888  88888888ba      db         88888888ba,    
 Y8,    ,8P        88       88      "8b    d88b        88      \`"8b   
  Y8,  ,8P         88       88      ,8P   d8'\`8b       88        \`8b  
   "8aa8"          88       88aaaaaa8P'  d8'  \`8b      88         88  
    \`88'           88       88""""""'   d8YaaaaY8b     88         88  
     88            88       88         d8""""""""8b    88         8P  
     88            88       88        d8'        \`8b   88      .a8P   
     88            88       88       d8'          \`8b  88888888Y"'    

  (Youtube playlist audio downloader) By: Icaruk
  
	`);
	
	
	
	// ***********************************************************
	// Tipo
	// ***********************************************************
	
	/** @type {1 | 2} Options are: (1) Playlist. (2) Video */
	let type = +await doQuestion(chalk.green.bold("\nType of download:\n  1: Playlist\n  2: Video\n  Write 1 or 2 >>> "), res => {
		if ( ![1, 2].includes(+res) ) {
			console.log("Options available are 1 or 2.");
			return true;
		};
		
		return false;
	});
	
	
	
	// ***********************************************************
	// Link
	// ***********************************************************
	
	let link = await doQuestion(chalk.green.bold("\nLink/id >>> "), res => !res);
	link = link.trim();
	
	let playlistId;
	const queryId = type === 1 ? "?list=" : "watch?v=";
	
	if (link.includes(queryId)) { // https://www.youtube.com/playlist?list=PLt7bG0K25iXj49pWeyf3A8H-9TGWq1oTB
		playlistId = link.split(queryId)[1];
		console.log( `    ID:    ${playlistId}` );
	} else {
		playlistId = link;
	};
	
	
	
	// ***********************************************************
	// Limit
	// ***********************************************************
	
	let limit = 0;
	
	if (type === 1) {
		
		limit = +await doQuestion(chalk.green.bold("\nNumber of items to download (write 0 for unlimited) >>> "), res => {
			if ( Number.isNaN(parseInt(res)) ) {
				console.log("Invalid number");
				return true;
			};
			
			return false;
		})
		
		
		if (limit <= 0) limit = Infinity;
		console.log( `    Limit: ${limit}` );
		
	};
	
	
	
	// ***********************************************************
	// Nombre carpeta
	// ***********************************************************
	
	let outFolderName = await doQuestion(chalk.green.bold("\nOutput folder name (press enter to skip) >>> "))
	if (!outFolderName) outFolderName = playlistId;
	
	
	
	// ***********************************************************
	// Obtengo ítems de la playlist
	// ***********************************************************
	
	let playlistItems;
	let totalItems;
	
	
	if (type === 2) {
		
		playlistItems = [playlistId];
		totalItems = 1;
		
	} else {
	
		console.log( chalk.yellow("\nGetting playlist items...") );
		
		// const playlistId = "PLd-AUhUZLc2lsbl0DOz0CKOv6AS75vfjf"; // fr
		// const playlistId = "PLd-AUhUZLc2mPtFqzCRQMu5ebO9vRbxZ6"; // colores
		
		
		try {
			
			let playlist = await ytpl(playlistId, {
				limit: limit,
			});
			playlistItems = playlist.items;
			totalItems = playlistItems.length;
			
			console.log( `    ${totalItems} items found.` );
			
		} catch (err) {
			
			console.log( chalk.red("Playlist not found.") );
			await doQuestion( chalk.green.bold("Press enter to exit...") );
			process.exit();	
			
		};
	
	};
	
	
	
	// ***********************************************************
	// Preparo carpeta out
	// ***********************************************************
	const outDir = `./${outFolderName}`;
	if (! fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});	
	
	
	
	// ***********************************************************
	// Descarga
	// ***********************************************************
	
	console.log( chalk.yellow("\nDownloading...") );
	console.log( chalk.magentaBright("If the progress bar gets out of sight it will stop updating, but don't worry, the download is still in progress.") );
	
	
	
	let procesados = 1;
	let fallados = [];
	
	
	
	if (type === 2) {
		
		const singleVideoId = playlistItems[0];
		await processOneItem(singleVideoId, outDir, [1, 1]);
		
	} else {
		
		cola.concurrency = 25;
		cola.onEnd = async () => {
			// console.log("All downloads finished.");
			// await doQuestion( chalk.green.bold("Press enter to exit...") );
			// process.exit();			
		};
		
		
		// Creo un array de IDs únicas (descarto repes)
		const arrIds = [...new Set (playlistItems.map( _x => _x.id) )];
		
		// Meto a la cola
		arrIds.forEach( async (_id, _idx) => {
			
			cola.items.push( () => processOneItem(_id, outDir, [_idx + 1, arrIds.length]) );
			// processOneItem(_id, outDir, [_idx + 1, arrIds.length]);
		});
		
		// Inicio
		cola.start();
		
	};
	
	
})();
