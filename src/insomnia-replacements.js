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

const isRequest = (insomniaResource) => {
    return insomniaResource._type === 'request';
};

const replaceHeaders = (insomniaCollection, headerReplacements) => {
    insomniaCollection.resources
        .filter(isRequest)
        .forEach(insomniaResource => {
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
    insomniaCollection.resources
        .filter(isRequest)
        .forEach(insomniaResource => {
            insomniaResource.url = insomniaResource.url.replace(hostReplacement.before, hostReplacement.after);
        });
};

const replacePathVariables = (insomniaCollection, pathReplacements) => {
    insomniaCollection.resources
        .filter(isRequest)
        .forEach(insomniaResource => {
            pathReplacements.forEach(pathReplacement => {
                insomniaResource.url = utils.replacePathPartInUrl(insomniaResource.url, pathReplacement);
                insomniaResource.name = utils.replacePathPartInUrl(insomniaResource.name, pathReplacement);
            });
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

    if (replacements.pathReplacements) {
        replacePathVariables(insomniaCollection, replacements.pathReplacements)
    }
};
