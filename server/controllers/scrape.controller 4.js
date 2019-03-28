const _ = require('lodash');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const compactString = str => str.replace(/[\n\t]/g, '').replace(/\s+/g, ' ').trim();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const getBrowser = () => IS_PRODUCTION
	? puppeteer.connect({ browserWsEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}` })
	: puppeteer.launch({
		args: [
			'--disable-dev-shm-usage',
			'--disable-gpu',
			'--disable-setuid-sandbox',
			'--headless',
			'--no-sandbox',
			'--single-process',
		],
		ignoreHTTPSErrors: true,
	});

const fetchPageWithPuppeteer = function(pageUrl, { loadExtraTime, bodyOnly }) {
	console.log(`Fetch page with Puppeteer: "${pageUrl}"`, { loadExtraTime, bodyOnly });

	return new Promise(async function(resolve, reject) {
		try {
			const browser = await getBrowser(); // await browserPool.acquire()
			const page = await browser.newPage();

			if (['networkidle0'].includes(loadExtraTime)) {
				await page.goto(pageUrl, { waitUntil: loadExtraTime });
			} else {
				await page.goto(pageUrl);
				await page.waitFor(loadExtraTime);
			}

			// await page.content(), document.body.innerHTML, document.documentElement.outerHTML
			const documentHTML = bodyOnly
				? await page.evaluate(() => document.body.outerHTML)
				: await page.evaluate(() => document.documentElement.outerHTML);

			// await browserPool.release(browser)
			resolve(documentHTML);
		} catch (err) {
			reject(err);
		}
	});
};

const parseDOM = (domString, pageSel, complete, deep) => {
	// Use _ instead of . and $ instead of # to allow for easier JavaScript parsing
	const getElementReference = $element => ($element[0].name) + ($element.attr('class') ? '_' + $element.attr('class').replace(/ /g, '_') : '') + ($element.attr('id') ? '$' + $element.attr('id') : '');

	const traverseChildren = function(parentObj, obj, i, elem) {
		const $node = $(elem);
		const nodeRef = getElementReference($node);
		// Has children
		if ($node.children().length > 0) {
			obj[nodeRef] = obj[nodeRef] || {};
			// Has children AND text: use '.$text='
			if ($node.text().length > 0) {
				obj[nodeRef].$text = compactString($node.text());
			}
			// Traverse the children
			$node.children().each(traverseChildren.bind(undefined, obj, obj[nodeRef]));
		} else {
			// Has only text
			obj[nodeRef] = compactString($node.text());
		}
		// Delete parent.$text if same as this
		if ($node.text() === _.get(parentObj, '$text')) {
			delete parentObj.$text;
		}
	};

	const $ = cheerio.load(domString);
	const resultArray = $(pageSel).map(function(i, el) {
		// this === el
		if (complete) {
			// Complete DOM nodes
			return compactString($(this).toString());
		} else if (deep) {
			// Deep objects
			let deepObj = {};
			traverseChildren(undefined, deepObj, undefined, this);
			return deepObj;
		} else {
			// Shallow text
			return compactString($(this).text());
		}
	}).get();
	return _.compact(resultArray);
};

export const scrapePage = function(req, res, next) {
	const pageUrl = decodeURIComponent(req.query.url);
	// Use $ instead of # to allow for easier URL parsing
	const pageSelector = decodeURIComponent(req.query.selector || 'body').replace(/\$/g, '#');
	const loadExtraTime = req.query.time || 3000;
	const deepResults = req.query.deep || false;
	const completeResults = req.query.complete || false;
	const timeStart = Date.now();

	console.log(`Scrape DOM: "${pageUrl}"`, { pageSelector, loadExtraTime });

	fetchPageWithPuppeteer(pageUrl, { loadExtraTime, bodyOnly: true })
		.then(documentHTML => {
			const selectorsArray = pageSelector.split(',');
			const resultsObj = selectorsArray.map((selector) => {
				const items = parseDOM(documentHTML, selector, completeResults, deepResults);
				return { selector, count: items.length, items };
			});
			return resultsObj;
		})
		.then(resultsObj => {
			const timeFinish = Date.now();
			res.json({ time: (timeFinish - timeStart), results: resultsObj });
		})
		.catch(err => {
			console.error('Error:', err);
			res.status(400).json({ error: err });
		});
};
