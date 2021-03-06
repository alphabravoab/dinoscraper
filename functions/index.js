const functions = require('firebase-functions');
const cors = require('cors')({ origin: true});

const puppeteer = require('puppeteer');

const cheerio = require('cheerio');
const getUrls = require('get-urls');
const fetch = require('node-fetch');

// to do code clean up and faster run time.


const scrapeImages = async(dino) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://dinosaurpictures.org/${dino}-pictures`)

    const images = await page.evaluate(() => {
        const images = document.querySelectorAll(`img`)
        const imageArray = Array.from(images).map(v => v.src)
        return imageArray[0]
    }) 
    return images
}

const scrapeDino = async(dino) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`https://www.nhm.ac.uk/discover/dino-directory/${dino}.html`)
   
    const data = await page.evaluate(()=> {
        const doc = document
        const info = doc.querySelectorAll('.dinosaur--info');
        const pronunciation = doc.querySelectorAll('.dinosaur--pronunciation');
        const meaning = doc.querySelectorAll('.dinosaur--meaning');
        const description = doc.querySelectorAll('.dinosaur--description');

        const feed = Array.from(info).map(v => v.innerText)[0].split('\n');
        const desc = Array.from(description).map(v => v.innerText)[0].split('\n');
       
        const data = {
            diet: feed[1],
            lived: feed[3],
            found: feed[5],
            pronunciation: pronunciation[0].innerText,
            meaning: meaning[0].innerText,
            Type: desc[1],
            length: desc[3],
            weight: desc[5]
        }
        return data
    })

    return data

}

exports.scraper = functions.https.onRequest( async (request, response) => {
    const dino = request.query.dino

    if (!dino) {
        response.status(400).send('no dino')
    }
    const data = await scrapeDino(dino)
    const images = await scrapeImages(dino)

    data.images = images
    response.send(data)

});
