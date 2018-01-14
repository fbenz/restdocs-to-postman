'use strict';
const utils = require('./utils');

const replaceHeaders = (insomniaCollection, headerReplacements) => {
    insomniaCollection.resources.forEach(insomniaResource => {
        insomniaResource.headers.forEach(insomniaHeader => {
            headerReplacements.forEach(replacementHeader => {
                // HTTP header names are case insensitive
                if (utils.caseInsensitiveEquals(insomniaHeader.name, replacementHeader.name)) {
                    insomniaHeader.value = replacementHeader.newValue;
                }
            });
        });
    });
};

const replaceHost = (insomniaCollection, hostReplacement) => {
    insomniaCollection.resources.forEach(insomniaResource => {
        insomniaResource.url = insomniaResource.url.replace(hostReplacement.before, hostReplacement.after);
    });
};

module.exports.performInsomniaReplacements = (insomniaCollection, replacements) => {
    if (!replacements) {
        return;
    }
    if (replacements.headers) {
        replaceHeaders(insomniaCollection, replacements.headers);
    }
    if (replacements.host) {
        replaceHost(insomniaCollection, replacements.host);
    }
};