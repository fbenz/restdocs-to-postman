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
 * Converts cURL commands to Insomnia export format v3
 */
'use strict';
const importers = require('insomnia-importers');
const {version} = require('../package.json');

const TOP_LEVEL = "topLevel";

/**
 * @param {function(path: string, url: string): ?string} determineFolder
 * @param {{path: string, resource: Object}} resourceWrapper
 * @param {?string} Original --input argument value
 * @return {?string} optional folder name
 */
const toFolder = (determineFolder, resourceWrapper, folderToScan) => {
    return determineFolder(resourceWrapper.path, resourceWrapper.resource.url, folderToScan);
};

/**
 * @param {function(path: string, url: string): ?string} determineFolder
 * @param {Array<{path: string, resource: Object}>} resourceWrappers
 * @return {Array<Object>} Array of Insomnia resources representing all folders
 */
const addFolders = (determineFolder, resourceWrappers, folderToScan) => {

    const folderResources = [];

    if (!determineFolder) {
        return folderResources;
    }
    let folderCount = 0;
    const folderNameToId = {};
    folderNameToId[TOP_LEVEL] = '__WORKSPACE_ID__';

    resourceWrappers.forEach(resourceWrapper => {
        var folderName = toFolder(determineFolder, resourceWrapper, folderToScan);
        if (folderName) {
            //If a / character is in the string from the folder function, then there are nested folders that need to be created
            if (folderName.includes("/")) {
                folderCount = createNestedFolders(folderName, folderNameToId, folderResources, resourceWrapper, folderCount);
            } else {
                folderCount = createFolder(folderName, folderNameToId, folderResources, resourceWrapper, TOP_LEVEL, folderCount);
            }
        }
    });
    folderResources
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((resource, index) => resource.metaSortKey = index);
    return folderResources;
};

/**
 * Loop through the parts of a folder name delimited by "/", and create a folder in the appropriate location in the tree
 * of folders for each part.
 * @param {String} nestedFolderPath Complete path of the nested folder (i.e. top-level-folder/documentation-test)
 * @param {String} folderNameToId The map of folder names to their folderIds.
 * @param {Array<Object>} folderResources Array of folderResource objects used to create the Insomnia collection
 * @param {Object} resourceWrapper The resourceWrapper object that was created for each curl command in toInsomniaCollection
 * @param {Number} folderCount The ongoing counter of folders, used to ensure unique folderId for each one created.
 * @returns {Number} The updated folder count after all nested folders have been created.
 */
const createNestedFolders = (nestedFolderPath, folderNameToId, folderResources, resourceWrapper, folderCount) => {
    var currentParentFolderName = TOP_LEVEL;

    const subFolders = nestedFolderPath.split("/");
    subFolders.forEach(function(subFolder) {
        folderCount = createFolder(subFolder, folderNameToId, folderResources, resourceWrapper, currentParentFolderName, folderCount);

        currentParentFolderName += subFolder;
        resourceWrapper.resource.parentId = folderNameToId[currentParentFolderName];
    });

    return folderCount;
};

/**
 * Create a folderResource object and push it into the folderResources array.  This is only done if the folder with the
 * given name has not already been created.
 * @param {String} folderName Complete path of the nested folder (i.e. top-level-folder/documentation-test)
 * @param {String} folderNameToId The map of folder names to their folderIds.
 * @param {Array<Object>} folderResources Array of folderResource objects used to create the Insomnia collection
 * @param {Object} resourceWrapper The resourceWrapper object that was created for each curl command in toInsomniaCollection
 * @param {String} parentFolderName The name of the parent folder, used to maintain the folder hierarchy
 * @param {Number} folderCount The ongoing counter of folders, used to ensure unique folderId for each one created.
 * @returns {Number} the updated folder count after this folder has been created.
 */
const createFolder = (folderName, folderNameToId, folderResources, resourceWrapper, parentFolderName, folderCount) => {

    //Concatenate the folder name onto the parent name to use as the key in the folderNameToId map so that if a sub folder
    //name exactly matches another sub folder in a different parent, it is still created below and placed in the proper
    //location in the tree.  For example,  the "items" folder below needs to be created under both search and store folders:
    //   topLevel/search/items
    //   topLevel/store/items
    const folderNameWithParentNames = parentFolderName + folderName;

    if (folderNameToId[folderNameWithParentNames]) {
        resourceWrapper.resource.parentId = folderNameToId[folderNameWithParentNames];
    } else {
        folderCount++;
        const folderId = `__FOLDER_${folderCount}__`;
        var folderResource = {
            _type: 'request_group',
            _id: folderId,
            name: folderName,
            parentId: folderNameToId[parentFolderName]
        };

        folderResources.push(folderResource);
        folderNameToId[folderNameWithParentNames] = resourceWrapper.resource.parentId = folderResource._id;
    }

    return folderCount;
};

/**
 * @param {function(path: string, url: string): ?string} determineFolder
 * @param {Array<{path: string, curl: string}>} curlCommands
 */
module.exports.toInsomniaCollection = (determineFolder, curlCommands, folderToScan) => {
    const resourceWrappers = curlCommands.map(c => {
        return {
            path: c.path,
            resource: importers.convert(c.curl).data.resources[0]
        }
    });

    const folderResources = addFolders(determineFolder, resourceWrappers, folderToScan);

    const requestResources = resourceWrappers.map((resourceWrapper, index) => {
        resourceWrapper.resource._id = `__REQ_${index + 1}__`;
        return resourceWrapper.resource;
    });

    return {
        _type: 'export',
        __export_format: 3,
        __export_date: new Date().toISOString(),
        __export_source: 'restdocs-to-postman:v' + version,
        resources: folderResources.concat(requestResources)
    };
};
