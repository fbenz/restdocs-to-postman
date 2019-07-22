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
'use strict';
const utils = require('./utils');

const isRequest = (postmanItem) => {
    // Only requests have a request field.
    return postmanItem.request;
};

const isFolder = (postmanItem) => {
    // Only folders have sub items.
    return postmanItem.item;
};

const replaceHeaders = (postmanCollection, headerReplacements) => {
    postmanCollection.item.forEach(postmanItem => {
        if (isRequest(postmanItem)) {
            postmanItem.request.header.forEach(postmanHeader => {
                headerReplacements.forEach(replacementHeader => {
                    // HTTP header names are case insensitive
                    if (utils.caseInsensitiveEquals(postmanHeader.key, replacementHeader.name)) {
                        postmanHeader.value = replacementHeader.newValue;
                    }
                });
            });
        } else if (isFolder(postmanItem)) {
            replaceHeaders(postmanItem, headerReplacements);
        }
    });
};

const replaceHost = (postmanCollection, hostReplacement) => {
    postmanCollection.item.forEach(postmanItem => {
        if (isRequest(postmanItem)) {
            const postmanUrl = postmanItem.request.url;
            postmanUrl.raw = postmanUrl.raw.replace(hostReplacement.before, hostReplacement.after);
            postmanUrl.host[0] = postmanUrl.host[0].replace(hostReplacement.before, hostReplacement.after);
        } else if (isFolder(postmanItem)) {
            replaceHost(postmanItem, hostReplacement);
        }
    });
};

const replacePathVariables = (postmanCollection, pathReplacements) => {
    postmanCollection.item.forEach(postmanItem => {
        if (isRequest(postmanItem)) {
            pathReplacements.forEach(pathReplacement => {
                const postmanUrl = postmanItem.request.url;
                postmanItem.name = utils.replacePathPartInUrl(postmanItem.name, pathReplacement);
                postmanUrl.raw = utils.replacePathPartInUrl(postmanUrl.raw, pathReplacement);
                postmanUrl.path =  utils.replacePathPartInPathArray(postmanUrl.path, pathReplacement);
            });
        } else if (isFolder(postmanItem)) {
            replacePathVariables(postmanItem, pathReplacements);
        }
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
    if (replacements.pathReplacements) {
        replacePathVariables(postmanCollection, replacements.pathReplacements)
    }
};
