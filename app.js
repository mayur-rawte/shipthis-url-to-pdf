/*
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
'use strict';
const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

const helper = '{\n' +
    '\'type\': \'html\' | \'url\',\n' +
    '\'html\': html_string, // only if type is html\n' +
    '\'url\': url, // only if type is url\n' +
    '\n' +
    'pdf: {\n' +
    '    "orientation": "landscape" | "portrait", // default is portrait if not specified\n' +
    '    "width": width // full width default,\n' +
    '    "height": height // full height default,\n' +
    '    "printBackground": true // default false,\n' +
    '    "format": \'A4\' | \'Letter\' // \'letter; by default,\n' +
    '    "margin: {"top": \'height in px\', "left": "", "bottom": "", "right":""}\n' +
    '    }\n' +
    '}';

// for reference https://pptr.dev/#?product=Puppeteer&version=v1.5.0&show=api-pagepdfoptions

/*

{
'type': 'html' | 'url',
'html': html_string, // only if type is html
'url': url, // only if type is url

pdf: {
    "orientation": "landscape" | "portrait", // default is portrait if not specified
    "width": width // full width default,
    "height": height // full height default,
    "printBackground": true // default false,
    "format": 'A4' | 'Letter' // 'letter; by default,
    "margin: {"top": 'height in px', "left": "", "bottom": "", "right":""}
    }
}

For Url

{'type': 'url', 'url': url,
"pdf": {"landscape": (orientation == "landscape"), "width": width, "height": height}}

 */

app.use(async (req, res) => {
    const requestBody = req.body;
    console.log(requestBody.content);

    if (!requestBody.type) {
        return res.send('Operation type not specified please provide valid params <br />' + helper);
    }

    // [START browser]
    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    // [END browser]
    const page = await browser.newPage();
    page.setJavaScriptEnabled(true);


    if (requestBody.type === 'url') {
        if (!requestBody.url) {
            return res.send('Please provide valid URL in post parameter');
        } else {
            await page.goto(requestBody.url, {waitUntil: ['networkidle0', 'load', 'domcontentloaded','networkidle2']});
            await page.waitFor(1000);
        }
    } else if (requestBody.type === 'html') {
        if (!requestBody.content) {
            return res.send('Please provide valid html content in post parameter');
        } else {
            await page.goto(`data:text/html, <html content> <meta charset="utf-8">${requestBody.content}`, { waitUntil: ['networkidle0', 'load', 'domcontentloaded'] });
        }
    } else {
        return res.send('type is not a valid parameter');
    }

    const pdfOptions = {};
    if (requestBody.pdf) {
        if (requestBody.pdf.orientation) {
            pdfOptions['landscape'] = requestBody.pdf.orientation === 'landscape';
        }
        if (requestBody.pdf.width) {
            pdfOptions['width'] = requestBody.pdf.width;
        }
        if (requestBody.pdf.height) {
            pdfOptions['height'] = requestBody.pdf.height;
        }

        if (requestBody.pdf.printBackground) {
            //default false
            pdfOptions['printBackground'] = requestBody.pdf.printBackground;
        }


        // page format

        if (requestBody.pdf.format) {
            // Letter is default | A4
            pdfOptions['format'] = requestBody.pdf.format;
        }

        // set margin
        if (requestBody.pdf.margin) {
            pdfOptions['margin'] = {};
            if (requestBody.pdf.margin.top) {
                pdfOptions['margin']['top'] = requestBody.pdf.margin.top;
            }
            if (requestBody.pdf.margin.bottom) {
                pdfOptions['margin']['bottom'] = requestBody.pdf.margin.bottom;
            }
            if (requestBody.pdf.margin.left) {
                pdfOptions['margin']['left'] = requestBody.pdf.margin.left;
            }
            if (requestBody.pdf.margin.right) {
                pdfOptions['margin']['right'] = requestBody.pdf.margin.right;
            }
        }

    }


    const pdfBuffer = await page.pdf(pdfOptions);
    browser.close();
    console.log(pdfBuffer);
    res.set('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
});

const server = app.listen(process.env.PORT || 8080, err => {
    if (err) return console.error(err);
    const port = server.address().port;
    console.info(`App listening on port ${port}`);
});
// [END full_sample]

module.exports = app;

