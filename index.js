
const usetube = require('usetube')
const fs = require("fs");
const ytdl = require('ytdl-core');
var ytpl = require('ytpl');



(async() => {
	

	console.log( "\n*** Proceso iniciado ***\n" );
	
	
	// ***********************************************************
	// Obtengo ítems de la playlist
	// ***********************************************************
	
	console.log( "Obteniendo ítems de la playlist (puede tardar unos minutos)..." );
	
	// const playlistId = "PLd-AUhUZLc2lsbl0DOz0CKOv6AS75vfjf"; // fr
	const playlistId = "PLd-AUhUZLc2mPtFqzCRQMu5ebO9vRbxZ6"; // colores
	// const playlist = await usetube.getPlaylistVideos(playlistId);
	
	const playlist = await ytpl(playlistId, {
		limit: Infinity,
	});
	const playlistItems = playlist.items;
	const totalItems = playlistItems.length;
	
	console.log( `    ${totalItems} ítems encontrados.` );
	
	
	
	// ***********************************************************
	// Preparo carpeta out
	// ***********************************************************
	const outDir = `./out/${playlistId}`;
	if (! fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});	
	
	
	
	// ***********************************************************
	// Descarga
	// ***********************************************************
	
	console.log( "Descargando..." );
	
	
	
	let n = 1;
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
			console.log( `    [ERR] ${_x.title} no está disponible.` );
			continue;
		};
		
		
		const fileName = (_x.title).replace(/[^a-z0-9\-áéíúóàèìòùñ\s.'!¡]/gim, "");
		const filePath = `${outDir}/${fileName}.mp3`;
		
		
		// await new Promise( resolve => {
			
			ytdl(`https://youtube.com/watch?v=${_x.id}`, {
				filter: "audioonly"
			})
			.on("finish", () => {
				console.log( `    (${n}/${totalItems}) ${_x.title}` );
				n ++;
				// resolve(true);
			})
			.on("error", err => {
				console.log( err );
				fallados.push(_x);
				// resolve(true);
			})
			.pipe(fs.createWriteStream(filePath))
			
		// });
		
	};
	
	
	
	process.on("beforeExit", () => {
		if (fallados.length > 0) console.log(`Han quedado ${fallados.length} por descargar`);
		else console.log( "Todo descargado" );
	});
	
	
	
})();
