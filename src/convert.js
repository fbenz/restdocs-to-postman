/*
 * Copyright 2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
const fs = require('fs');
const url = require('url');
const utils = require('./utils');
const curlToInsomnia = require('./curl-to-insomnia3');
const insomniaToPostman = require('./insomnia3-to-postman21');
const insomniaReplacements = require('./insomnia-replacements');
const postmanReplacements = require('./postman-replacements');
const postmanAttachments = require('./postman-attachments');

const curlFromRestDocsFile = filename => {
    const data = fs.readFileSync(filename, 'utf8');
    // File ends with ---- for Asciidoc or ``` for Markdown
    const regex = new RegExp('(curl(.|\\s)*)(----|```)');
    const extractedCurl = regex.exec(data);
    if (extractedCurl !== null && extractedCurl.length > 1) {
        return extractedCurl[1];
    } else {
        return null;
    }
};

/* By default the name is the full URL, e.g. http://localhost:8080/items/1/process?command=increase
 *  and this function shortens it to just the pathname, e.g. items/1/process
 */
const shortenName = (insomniaItem) => {
    const parsedUrl = url.parse(insomniaItem.url);
    if (parsedUrl && parsedUrl.pathname) {
        let pathname = parsedUrl.pathname.substring(1);
        if (pathname.length === 0) {
            pathname = 'index';
        }
        insomniaItem.name = pathname;
    }
};

const beautifyName = (insomniaItem) => {
    var newName = insomniaItem.name;
    var badChars = newName.match(/[^a-zA-Z0-9\s]/g);

    while (badChars && badChars.length > 0) {
        newName = newName.replace(badChars[0], " ");
        badChars.shift();
    }

    newName = newName[0].toUpperCase() + newName.substring(1);
    insomniaItem.name = newName;
}

/**
 *
 * @param {{folderToScan: string, exportFormat: string, replacements: ?Object, determineFolder: ?function}} options
 * @return {?string}
 */
module.exports.convert = (options) => {
    let { folderToScan, exportFormat, replacements, attachments, determineFolder, collectionName, namingConvention, beautify } = options;
    const results = utils.traverseFilesSync(folderToScan);
    if (!results) {
        return null;
    }
    let allCurls = [];
    results.forEach(filePath => {
        if (filePath.endsWith('curl-request.adoc') || filePath.endsWith('curl-request.md')) {
            const extractedCurl = curlFromRestDocsFile(filePath);
            if (extractedCurl !== null) {
                allCurls.push({
                    path: filePath,
                    curl: extractedCurl
                });
            }
        }
    });
    const insomniaCollection = curlToInsomnia.toInsomniaCollection(determineFolder, allCurls, folderToScan, namingConvention);

    if (namingConvention) {
        switch (namingConvention) {
            case 'shortPath':
                insomniaCollection.resources.forEach(i => {
                    if (i._type === 'request') {
                        shortenName(i);
                    }
                });
                break;

            case 'dir':
                break;

            default:
                throw new Error('Unknown naming convention: ' + beautify);
        }
    }

    if (beautify) {
        var type = null;

        switch (beautify) {
            case 'requests':
                if (namingConvention === 'shortPath') console.log(`The beautify option \'${beautify}\' is incompatible with the naming convention \'${namingConvention}\'`);
                type = 'request';
                break;

            case 'folders':
                if (!determineFolder) console.log('Folders cannot be beautified as the determineFolder option was not specified');
                type = 'request_group';
                break;

            case 'all':
                if (namingConvention === 'shortPath') console.log(`The beautify option \'${beautify}\' is only compatible with the naming convention \'${namingConvention}\' for \'folders\'`);
                if (!determineFolder) console.log('Only requests can be beautified as the determineFolder option was not specified');
                type = 'all';
                break;

            default:
                if (beautify === true) {
                    throw new Error('No beautify target specified');
                } else {
                    throw new Error('Unknown beautify target: ' + beautify);
                }
        }

        if (namingConvention === 'dir') {
            if (type) {
                insomniaCollection.resources.forEach(i => {
                    if (i._type === type || type === 'all') {
                        beautifyName(i);
                    }
                });
            }
        }
    }

    if (exportFormat) {
        console.log(`Converting ${allCurls.length} cURL commands to \'${exportFormat}\' collection format...`);

        var collection = null;

        switch (exportFormat) {
            case 'insomnia':
                insomniaReplacements.performInsomniaReplacements(insomniaCollection, replacements);
                collection = insomniaCollection;
                break;

            case 'postman':
                const postmanCollection = insomniaToPostman.toPostmanCollection(insomniaCollection, collectionName);
                postmanReplacements.performPostmanReplacements(postmanCollection, replacements, namingConvention);
                postmanAttachments.performPostmanAttachments(postmanCollection, attachments);
                collection = postmanCollection;
                break;

            default:
                throw new Error('Unknown export format: ' + exportFormat);
        }

        return JSON.stringify(collection);
    }
};
