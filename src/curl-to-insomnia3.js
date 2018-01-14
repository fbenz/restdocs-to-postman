/*
 * Converts cURL commands to Insomnia export format v3
 */
'use strict';
const importers = require('insomnia-importers');

/**
 *
 * @param curlCommands cURL commands separated by semicolons
 */
module.exports.toInsomniaCollection = (curlCommands) => {
    return importers.convert(curlCommands).data;
};