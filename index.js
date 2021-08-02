
const ytlist = require("youtube-playlist");

const url = "https://www.youtube.com/playlist?list=PLd-AUhUZLc2lsbl0DOz0CKOv6AS75vfjf";



const { chromium } = require('playwright');

(async () => {
	
	const browser = await chromium.launch({
		headless: false,
		// slowMo: 50,
	});
	await page.goto(url);
	
	
	
	
	await browser.close();
	
})();
