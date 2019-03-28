const _ = require('lodash');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const kafka = require('../utils/kafka');
const request = require('request');

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
	const pageSelector = decodeURIComponent(req.query.selector || 'body').replace(/\$/g, '#');
	const loadExtraTime = req.query.time || 3000;
	const deepResults = req.query.deep || false;
	const completeResults = req.query.complete || false;
	const timeStart = Date.now();

	scrapeHelper(pageUrl, pageSelector, loadExtraTime, deepResults, completeResults, timeStart)
		.then(resultsObj => {
			const timeFinish = Date.now();
			res.json({ time: (timeFinish - timeStart), results: resultsObj });
		})
		.catch(err => {
			console.error('Error:', err);
			res.status(400).json({ error: err });
		});
};

export const scrapeUWFeds = function(req, res, next) {
	const pageUrl = 'https://feds.ca/event';
	const pageSelector =
		decodeURIComponent(req.query.selector ||
			'.uw-site-main--content .views-row .date,' +
			'.uw-site-main--content .views-row > .views-field-title,' +
			'.uw-site-main--content .views-row > .views-field-body')
			.replace(/\$/g, '#');

	const loadExtraTime = req.query.time || 3000;
	const deepResults = req.query.deep || false;
	const completeResults = req.query.complete || false;
	const timeStart = Date.now();

	scrapeHelper(pageUrl, pageSelector, loadExtraTime, deepResults, completeResults, timeStart)
		.then(resultsObj => {
			const timeFinish = Date.now();
			constructEventObject(resultsObj);
			res.json({ time: (timeFinish - timeStart), results: resultsObj });
		})
		.catch(err => {
			console.error('Error:', err);
			res.status(400).json({ error: err });
		});
};

export const sendEvent = function(data) {
	const eventMessage = {
		type: 'ADD',
		data: data,
	};

	const message = [
		{ topic: 'Events', messages:  JSON.stringify(eventMessage), partition: 0 },
	];

	const producer = kafka.getProducer();

	producer.send(message, function () {
		console.log('sent');
	});
};


export const constructEventObject = function(eventsArray) {
	const eventsTime = eventsArray[0].events;
	const eventsTitle = eventsArray[1].events;
	const eventsDescription = eventsArray[2].events;

	eventsTime.forEach((time, i) => {
		const event = {};
		event['Date'] = time;
		event['Title'] = eventsTitle[i];
		event['Description'] = eventsDescription[i];

		request.post({
			headers: {'content-type': 'application/json'},
			url: 'http://localhost:7890/api/classify/events',
			form: event,
		}, function(error, response, body) {
			event['tag'] = JSON.parse(response.body).category;
			sendEvent(event);
		});

	});
};

export const scrapeHelper = function(pageUrl, pageSelector, loadExtraTime, deepResults, completeResults) {
	console.log(`Scrape DOM: "${pageUrl}"`, { pageSelector, loadExtraTime });

	return fetchPageWithPuppeteer(pageUrl, { loadExtraTime, bodyOnly: true })
		.then(documentHTML => {
			const selectorsArray = pageSelector.split(',');
			const resultsObj = selectorsArray.map((selector) => {
				const events = parseDOM(documentHTML, selector, completeResults, deepResults);
				return { selector, count: events.length, events };
			});
			return resultsObj;
		});
};