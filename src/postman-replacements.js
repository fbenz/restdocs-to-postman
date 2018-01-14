const utils = require('./utils');

const replaceHeaders = (postmanCollection, headerReplacements) => {
    postmanCollection.item.forEach(postmanItem => {
        postmanItem.request.header.forEach(postmanHeader => {
            headerReplacements.forEach(replacementHeader => {
                // HTTP header names are case insensitive
                if (utils.caseInsensitiveEquals(postmanHeader.key, replacementHeader.name)) {
                    postmanHeader.value = replacementHeader.newValue;
                }
            });
        });
    });
};

const replaceHost = (postmanCollection, hostReplacement) => {
    postmanCollection.item.forEach(postmanItem => {
        const postmanUrl = postmanItem.request.url;
        postmanUrl.raw = postmanUrl.raw.replace(hostReplacement.before, hostReplacement.after);
        postmanUrl.host[0] = postmanUrl.host[0].replace(hostReplacement.before, hostReplacement.after);
    });
};

module.exports.performPostmanReplacements = (postmanCollection, replacements) => {
    if (!replacements) {
        return;
    }
    if (replacements.headers) {
        replaceHeaders(postmanCollection, replacements.headers);
    }
    if (replacements.host) {
        replaceHost(postmanCollection, replacements.host);
    }
};