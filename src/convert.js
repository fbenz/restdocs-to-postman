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

/**
 *
 * @param {{folder: string, exportFormat: string, replacements: ?Object, folderFn: ?function}} options
 * @return {?string}
 */
module.exports.convert = (options) => {
    let {folder, exportFormat, replacements, folderFn} = options;
    const results = utils.traverseFilesSync(folder);
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
    const insomniaCollection = curlToInsomnia.toInsomniaCollection(folderFn, allCurls);
    insomniaCollection.resources.forEach(i => {
        if (i._type === 'request') {
            shortenName(i);
        }
    });

    if (exportFormat === 'insomnia') {
        insomniaReplacements.performInsomniaReplacements(insomniaCollection, replacements);
        return JSON.stringify(insomniaCollection);
    } else if (exportFormat === 'postman') {
        const postmanCollection = insomniaToPostman.toPostmanCollection(insomniaCollection);
        postmanReplacements.performPostmanReplacements(postmanCollection, replacements);
        return JSON.stringify(postmanCollection);
    } else {
        throw new Error('Unknown export format: ' + exportFormat);
    }
};