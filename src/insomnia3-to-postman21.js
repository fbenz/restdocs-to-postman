/*
 * Copyright 2018 the original author or authors.
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

/**
 * Create an object to hold the name and array of items for the Postman collection.  This method will place the folder
 * object in the folderMap based on its _id, and also place push it into the item array of its parent if applicable.
 * The folderMap can then be used to access any folder by its id, and later when the insomniaResource is converted in
 * toPostmanItem, the reference to the object in the parent's item array will also be updated.
 * @param {Object} insomniaRequestGroup The request group object from the Insomnia collection created in curl-to-insomnia3
 * @param {Object} folderMap The map of folder object, keyed off of the folderId
 * @param {Object} topLevelItems The map of folders at the top level of the collection
 */
const toPostmanFolder = (insomniaRequestGroup, folderMap, topLevelItems) => {
    var folder = {
        name: insomniaRequestGroup.name,
        item: []
    }

    if (folderMap[insomniaRequestGroup.parentId]) {
        folderMap[insomniaRequestGroup.parentId].item.push(folder);
    } else {
        topLevelItems[insomniaRequestGroup._id] = folder;
    }

    folderMap[insomniaRequestGroup._id] = folder;
};

/**
 * Extracts the number from the FolderId so it can be compared as an integer instead of a string (solving 1 vs 10 comparison issues)
 * @param {String} folderId __FOLDER_1__
 * @returns {Number} For __FOLDER_1__, returns 1
 */
const getFolderNumberFromId = (folderId) => {
    const folderRegex = /^__FOLDER_([0-9]*)__/g;
    var match = folderRegex.exec(folderId);

    if (match) {
        return match[1];
    }
    return -1;
}

/**
 * Recursively sort folders by their name
 * @param {Object} folders Initially the top level folders, then any subFolder item arrays
 * @returns {Array<Object>} sorted array of folders
 */
const sortFolders = (folders) => {
    folders = Object.values(folders)
        .sort((a, b) => {
            a.name.localeCompare(b.name)
        });
    folders.forEach(folder => {
        if (folder.item && folder.item.length > 0) {
            folder.item = sortFolders(folder.item);
        }
    });
    return folders;
}

module.exports.toPostmanCollection = (insomniaCollection) => {

    //First sort all resources by folder id, so that the logic below to create the folders will be guaranteed to create
    //parent level folders before child folders.
    const allResourcesSortedById = Object.values(insomniaCollection.resources)
        .filter(r => r._type === 'request_group')
        .sort((a, b) => parseInt(getFolderNumberFromId(a._id), 10) - parseInt(getFolderNumberFromId(b._id), 10));

    const folderMap = {};
    var topLevelItems = {}
    allResourcesSortedById
        .filter(r => r._type === 'request_group')
        .forEach(r => toPostmanFolder(r, folderMap, topLevelItems));

    // Folders come first and are sorted by name.
    topLevelItems = sortFolders(topLevelItems);

    insomniaCollection.resources
        .filter(r => r._type === 'request')
        .forEach(r => {
            if (folderMap[r.parentId]) {
                folderMap[r.parentId].item.push(toPostmanItem(r));
            } else {
                topLevelItems.push(toPostmanItem(r))
            }
        });
    return {
        info: {
            name: 'REST Docs to Postman',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: topLevelItems
    };
};
