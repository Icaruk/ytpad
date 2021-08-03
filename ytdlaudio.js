

const { once } = require("events");
const fs = require("fs");
const readline = require('readline');
const ytdl = require('ytdl-core');
var ytpl = require('ytpl');


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
	// Link
	// ***********************************************************
	
	let link = await doQuestion("\n[1/3] Escribe el link o id de la playlist >>> ", res => !res);
	link = link.trim();
	
	let playlistId;
	
	if (link.includes("?list=")) { // https://www.youtube.com/playlist?list=PLt7bG0K25iXj49pWeyf3A8H-9TGWq1oTB
		playlistId = link.split("?list=")[1];
		console.log( `    ID de la playlist detectada:    ${playlistId}` );
	} else {
		playlistId = link;
	};
	
	
	
	
	// ***********************************************************
	// Limit
	// ***********************************************************
	
	let limit = +await doQuestion("\n[2/3] Escribe cuántos ítems quieres descargar (pulsa intro para no poner límite) >>> ", res => {
		if ( Number.isNaN(parseInt(res)) && res !== "" ) {
			console.log("Número no válido");
			return true;
		};
		
		return false;
	})
	
	
	if (!limit) limit = Infinity;
	console.log( `    Límite: ${limit}` );
	
	
	
	// ***********************************************************
	// Nombre carpeta
	// ***********************************************************
	
	let outFolderName = await doQuestion("\n[3/3] Escribe el nombre de la carpeta de salida (pulsa intro para omitir) >>> ")
	if (!outFolderName) outFolderName = playlistId;
	
	
	
	// ***********************************************************
	// Obtengo ítems de la playlist
	// ***********************************************************
	
	console.log( "\n*** Obteniendo ítems de la playlist..." );
	
	// const playlistId = "PLd-AUhUZLc2lsbl0DOz0CKOv6AS75vfjf"; // fr
	// const playlistId = "PLd-AUhUZLc2mPtFqzCRQMu5ebO9vRbxZ6"; // colores
	
	const playlist = await ytpl(playlistId, {
		limit: limit,
	});
	const playlistItems = playlist.items;
	const totalItems = playlistItems.length;
	
	console.log( `    ${totalItems} ítems encontrados.` );
	
	
	
	// ***********************************************************
	// Preparo carpeta out
	// ***********************************************************
	const outDir = `./out/${outFolderName}`;
	if (! fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});	
	
	
	
	// ***********************************************************
	// Descarga
	// ***********************************************************
	
	console.log( "\n*** Descargando..." );
	
	
	
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
			console.log( `    [ERR] ${_x.title} no está disponible.` );
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
				if (fallados.length > 0) console.log(`Han quedado ${fallados.length} por descargar`);
				else console.log( "*** Todo descargado" );
				
				await doQuestion("Pulsa intro para salir");
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
