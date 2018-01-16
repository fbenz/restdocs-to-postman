/*
 * Converts cURL commands to Insomnia export format v3
 */
'use strict';
const importers = require('insomnia-importers');
const {version} = require('../package.json');

/**
 *
 * @param curlCommands cURL commands separated by semicolons
 */
module.exports.toInsomniaCollection = (curlCommands) => {
    const resourceWrappers = curlCommands.map(c => {
        return {
            path: c.path,
            resource: importers.convert(c.curl).data.resources[0]
        }
    });
    return {
        _type: 'export',
        __export_format: 3,
        __export_date: new Date().toISOString(),
        __export_source: 'restdocs-to-postman:v' + version,
        resources: resourceWrappers.map((resourceWrapper, index) => {
            resourceWrapper.resource._id = `__REQ_${index + 1}__`;
            return resourceWrapper.resource;
        })
    };
};