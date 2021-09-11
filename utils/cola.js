
// const fnc = (id) => {
// 	return new Promise( (resolve) => {
// 		setTimeout( () => {
// 			resolve(true);
// 			console.log( `Fin fnc ${id}` );
// 		}, 500 + (Math.random() * 3000));
// 	})
// };



const cola = {
	
	counter: 0,
	
	items: [],
	processingItems: [],
	concurrency: 20,
	
	onEnd: () => {
		console.log( "End of queue" );
	},
	
	
	async processNextItem() {
		
		const item = this.items.shift();
		
		if (!item) {
			if (this.processingItems.length === 1) this.onEnd();
			return;
		};
		
		
		const id = this.counter ++;
		const idx = this.processingItems;
		
		this.processingItems.push(id);
		
		await item();
		
		this.processingItems.splice(idx, 1);
		
		
		this.processNextItem();
		
	},
	
	async start() {
		
		for (let _i = 1; _i <= this.concurrency; _i ++) {
			this.processNextItem();
		};
		
	},
	
};


module.exports = cola;



// for (let _i = 1; _i <= 100; _i ++) {
// 	cola.items.push( () => fnc(_i) );
// };


// cola.start();

