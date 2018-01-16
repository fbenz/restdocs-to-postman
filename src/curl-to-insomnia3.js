/*
 * Converts cURL commands to Insomnia export format v3
 */
'use strict';
const importers = require('insomnia-importers');
const {version} = require('../package.json');

const toFolder = (folderFn, resourceWrapper) => {
    return folderFn(resourceWrapper.path, resourceWrapper.resource.url);
};

const addFolders = (folderFn, resourceWrappers) => {
    const folderResources = [];
    if (!folderFn) {
        return folderResources;
    }
    let folderCount = 0;
    const folderNameToId = {};
    resourceWrappers.forEach(resourceWrapper => {
        const folder = toFolder(folderFn, resourceWrapper);
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
                    parentId: '__WORKSPACE_ID__',
                    metaSortKey: folderCount
                });
                resourceWrapper.resource.parentId = folderId;
                folderNameToId[folder] = folderId;
            }
        }
    });
    return folderResources;
};

/**
 *
 * @param curlCommands cURL commands separated by semicolons
 */
module.exports.toInsomniaCollection = (folderFn, curlCommands) => {
    const resourceWrappers = curlCommands.map(c => {
        return {
            path: c.path,
            resource: importers.convert(c.curl).data.resources[0]
        }
    });

    const folderResources = addFolders(folderFn, resourceWrappers);

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