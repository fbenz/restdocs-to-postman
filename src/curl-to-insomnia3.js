/*
 * Converts cURL commands to Insomnia export format v3
 */
const importers = require('insomnia-importers');

/**
 *
 * @param curlCommands cURL commands separated by semicolons
 */
module.exports.toInsomniaCollection = (curlCommands) => {
    return importers.convert(curlCommands).data;
};