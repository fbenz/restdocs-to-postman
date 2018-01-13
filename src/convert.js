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
const path = require('path');
const url = require('url');
const importers = require('insomnia-importers');
const insomniaToPostman = require('./insomnia3-to-postman21');

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

const traverseFilesSync = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    for (let i in list) {
        const relativeFile = list[i];
        if (relativeFile) {
            const absoluteFile = path.join(dir, relativeFile);
            const stat = fs.statSync(absoluteFile);
            if (stat && stat.isDirectory()) {
                traverseFilesSync(absoluteFile).forEach(f => results.push(f));
            } else {
                results.push(absoluteFile);
            }
        }
    }
    return results;
};

const insomniaReplaceHost = (insomniaCollection, hostReplacement) => {
    insomniaCollection.resources.forEach(r => r.url = r.url.replace(hostReplacement.before, hostReplacement.after));
};

const caseInsensitiveEquals = (stringA, stringB) => {
    return stringA.toUpperCase() === stringB.toUpperCase();
};

const insomniaReplaceHeaders = (insomniaCollection, headerReplacements) => {
    insomniaCollection.resources.forEach(r => {
        r.headers.forEach(h => {
            headerReplacements.forEach(hr => {
                // HTTP header names are case insensitive
                if (caseInsensitiveEquals(h.name, hr.name)) {
                    h.value = hr.newValue;
                }
            });
        });
    });
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

module.exports.convert = (folder, exportFormat, replacements) => {
    const results = traverseFilesSync(folder);
    if (!results) {
        return;
    }
    let allCurls = '';
    results.forEach(r => {
        if (r.endsWith('curl-request.adoc') || r.endsWith('curl-request.md')) {
            const extractedCurl = curlFromRestDocsFile(r);
            if (extractedCurl !== null) {
                allCurls += extractedCurl + ';';
            }
        }
    });
    const insomniaCollection = importers.convert(allCurls).data;
    insomniaCollection.resources.forEach(i => shortenName(i));

    if (replacements && replacements.headers) {
        // This causes no issues when doing the conversion to Postman and can thus be done before.
        insomniaReplaceHeaders(insomniaCollection, replacements.headers);
    }

    if (exportFormat === 'insomnia') {
        if (replacements && replacements.host) {
            insomniaReplaceHost(insomniaCollection, replacements.host);
        }
        return JSON.stringify(insomniaCollection);
    } else if (exportFormat === 'postman') {
        return JSON.stringify(insomniaToPostman.toPostmanCollection(insomniaCollection, replacements));
    } else {
        throw new Error('Unknown export format: ' + exportFormat);
    }
};