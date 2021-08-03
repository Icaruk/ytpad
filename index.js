

const fs = require("fs");
const readline = require('readline');
const ytdl = require('ytdl-core');
var ytpl = require('ytpl');
const chalk = require('chalk');



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

  By: Icaruk
	`);
	
	
	
	// ***********************************************************
	// Link
	// ***********************************************************
	
	let link = await doQuestion(chalk.cyan("[1/3] Playlist link/id >>> "), res => !res);
	link = link.trim();
	
	let playlistId;
	
	if (link.includes("?list=")) { // https://www.youtube.com/playlist?list=PLt7bG0K25iXj49pWeyf3A8H-9TGWq1oTB
		playlistId = link.split("?list=")[1];
		console.log( `    Playlist ID:    ${playlistId}` );
	} else {
		playlistId = link;
	};
	
	
	
	
	// ***********************************************************
	// Limit
	// ***********************************************************
	
	let limit = +await doQuestion(chalk.cyan("\n[2/3] Number of items to download (write 0 for unlimited) >>> "), res => {
		if ( Number.isNaN(parseInt(res)) ) {
			console.log("Invalid number");
			return true;
		};
		
		return false;
	})
	
	
	if (limit <= 0) limit = Infinity;
	console.log( `    Límite: ${limit}` );
	
	
	
	// ***********************************************************
	// Nombre carpeta
	// ***********************************************************
	
	let outFolderName = await doQuestion(chalk.cyan("\n[3/3] Output folder name (press enter to skip) >>> "))
	if (!outFolderName) outFolderName = playlistId;
	
	
	
	// ***********************************************************
	// Obtengo ítems de la playlist
	// ***********************************************************
	
	console.log( chalk.yellow("\nGetting playlist items...") );
	
	// const playlistId = "PLd-AUhUZLc2lsbl0DOz0CKOv6AS75vfjf"; // fr
	// const playlistId = "PLd-AUhUZLc2mPtFqzCRQMu5ebO9vRbxZ6"; // colores
	
	let playlist;
	let playlistItems;
	let totalItems;
	
	try {
		
		playlist = await ytpl(playlistId, {
			limit: limit,
		});
		playlistItems = playlist.items;
		totalItems = playlistItems.length;
		
		console.log( `    ${totalItems} items found.` );
		
	} catch (err) {
		
		console.log( chalk.red("Playlist not found.") );
		await doQuestion( chalk.cyan("Press enter to exit...") );
		process.exit();	
			
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
	console.log( chalk.magentaBright("Some items could take more time than expected. If it takes too long restart the process.") );
	
	
	
	let procesados = 1;
	let fallados = [];
	
	for await (const _x of playlistItems) {
		
		/*{
			id: 'X0P23leg5Lw',
			original_title: 'Alonzo - Assurance vie',
			title: 'Assurance vie',
			artist: 'Alonzo',
			duration: 0,
			publishedAt: 2019-03-01T21:54:22.000Z
		}*/
		
		
		if (!_x.isPlayable) {
			console.log( `    [ERR] ${_x.title} is unavailable.` );
			continue;
		};
		
		
		const fileName = (_x.title).replace(/[^a-z0-9\-áéíúóàèìòùñ\s.'!¡]/gim, "");
		const filePath = `${outDir}/${fileName}.mp3`;
		
		
		
		ytdl(`https://youtube.com/watch?v=${_x.id}`, {
			filter: "audioonly"
		})
		.on("finish", async () => {
			console.log( `    (${procesados}/${totalItems}) ${_x.title}` );
			procesados ++;
			
			if (procesados > totalItems) {
				if (fallados.length > 0) console.log( chalk.red(`There are ${fallados.length} missing downloads.`) );
				else console.log( chalk.green("All items have been downloaded") );
				
				await doQuestion( chalk.cyan("Press enter to exit...") );
				process.exit();
				
			};				
			
		})
		.on("error", err => {
			// console.log( err );
			console.log( `    [ERR] (${procesados}/${totalItems}) ${_x.title}` );
			fallados.push(_x);
			procesados ++;
			
		})
		.pipe(fs.createWriteStream(filePath))
		
	};
	
	
})();
