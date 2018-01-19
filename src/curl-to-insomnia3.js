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

/**
 * @param {function(path: string, url: string): ?string} determineFolder
 * @param {{path: string, resource: Object}} resourceWrapper
 * @return {?string} optional folder name
 */
const toFolder = (determineFolder, resourceWrapper) => {
    return determineFolder(resourceWrapper.path, resourceWrapper.resource.url);
};

/**
 * @param {function(path: string, url: string): ?string} determineFolder
 * @param {Array<{path: string, resource: Object}>} resourceWrappers
 * @return {Array<Object>} Array of Insomnia resources representing all folders
 */
const addFolders = (determineFolder, resourceWrappers) => {
    const folderResources = [];
    if (!determineFolder) {
        return folderResources;
    }
    let folderCount = 0;
    const folderNameToId = {};
    resourceWrappers.forEach(resourceWrapper => {
        const folder = toFolder(determineFolder, resourceWrapper);
        if (folder) {
            if (folderNameToId[folder]) {
                resourceWrapper.resource.parentId = folderNameToId[folder];
            } else {
                folderCount++;
                const folderId = `__FOLDER_${folderCount}__`;
                folderResources.push({
                    _type: 'request_group',
                    _id: `__FOLDER_${folderCount}__`,
                    name: folder,
                    parentId: '__WORKSPACE_ID__'
                });
                resourceWrapper.resource.parentId = folderId;
                folderNameToId[folder] = folderId;
            }
        }
    });
    folderResources
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((resource, index) => resource.metaSortKey = index);
    return folderResources;
};

/**
 * @param {function(path: string, url: string): ?string} determineFolder
 * @param {Array<{path: string, curl: string}>} curlCommands
 */
module.exports.toInsomniaCollection = (determineFolder, curlCommands) => {
    const resourceWrappers = curlCommands.map(c => {
        return {
            path: c.path,
            resource: importers.convert(c.curl).data.resources[0]
        }
    });

    const folderResources = addFolders(determineFolder, resourceWrappers);

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