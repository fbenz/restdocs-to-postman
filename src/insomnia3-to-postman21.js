/*
 * Converts Insomnia export format v3 to Postman Collection Format v2.1.0
 */
'use strict';
const url = require('url');

const toPostmanKeyValues = (insomniaNameValues) => {
    return insomniaNameValues.map(e => {
        return {
            key: e.name,
            value: e.value
        };
    });
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

const toPostmanItem = (insomniaItem) => {
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

module.exports.toPostmanCollection = (insomniaCollection) => {
    const postmanItems = insomniaCollection.resources
        .filter(i => i._type === 'request')
        .map(toPostmanItem);
    return {
        info: {
            name: 'REST Docs to Postman',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: postmanItems
    };
};
