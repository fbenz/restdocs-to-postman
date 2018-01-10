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

const toPostmanCollection = (items) => {
    return {
        info: {
            name: 'REST Docs to Postman',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: items
    };
};

const toPostmanItem = (insomniaItem, replacements) => {
    let rawUrl = insomniaItem.url;
    const parsedUrl = url.parse(rawUrl);
    let host = parsedUrl.protocol + "//" + (parsedUrl.auth ? parsedUrl.auth : '') + parsedUrl.host;
    let header;
    if (insomniaItem.headers) {
        header = toPostmanKeyValues(insomniaItem.headers);
    }
    let query;
    if (parsedUrl.query) {
        query = parsedUrl.query.split('&').map(q => {
            const parts = q.split('=');
            if (parts.length !== 2) {
                throw new Error('Invalid query part: ' + q);
            }
            return {
                key: parts[0],
                value: parts[1],
            }
        });
    }
    if (replacements && replacements.host) {
        rawUrl = rawUrl.replace(replacements.host.before, replacements.host.after);
        host = host.replace(replacements.host.before, replacements.host.after);
    }
    return {
        name: insomniaItem.name,
        request: {
            method: insomniaItem.method,
            header: header,
            body: toPostmanBody(insomniaItem.body),
            url: {
                raw: rawUrl,
                host: [
                    host
                ],
                path: parsedUrl.pathname.split('/'),
                query: query
            },
            description: insomniaItem.description
        }
    };
};

const toPostmanBody = (insomniaBody) => {
    if (insomniaBody.text) {
        // for mime types like application/json
        return {
            mode: 'raw',
            raw: insomniaBody.text
        };
    } else if (insomniaBody.params && insomniaBody.mimeType === 'application/x-www-form-urlencoded') {
        return {
            mode: 'urlencoded',
            urlencoded: toPostmanKeyValues(insomniaBody.params)
        };
    } else if (insomniaBody.params) {
        return {
            mode: 'formdata',
            formdata: toPostmanKeyValues(insomniaBody.params)
        };
    } else {
        return null;
    }
};

const toPostmanKeyValues = (insomniaNameValues) => {
    return insomniaNameValues.map(e => {
        return {
            key: e.name,
            value: e.value
        };
    });
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
        const postmanItems = insomniaCollection.resources
            .filter(i => i._type === 'request')
            .map(i => toPostmanItem(i, replacements));
        const postmanCollection = toPostmanCollection(postmanItems);
        return JSON.stringify(postmanCollection);
    } else {
        throw new Error('Unknown export format: ' + exportFormat);
    }
};