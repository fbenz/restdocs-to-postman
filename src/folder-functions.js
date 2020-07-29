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
const path = require('path');

module.exports.secondLastFolder = (filePath, url, folderToScan) => {
    const parts = filePath.split(path.sep);
    if (parts.length >= 3) {
        var folderName = parts[parts.length - 3];
        return folderName;
    } else {
        return null;
    }
};

/**
 * Returns a string delimited by "/" of folders for endpoints.
 * @param filePath  Absolute file path to curl resource (i.e. /project-directory/generated-snippets/name/get/curl-request.adoc
 * @param url Unused, but the URL in the curl request
 * @param folderToScan Original source folder to scan for restdocs.  Used as the string to determine top level folder in filePath (i.e. generated-snippets).
 * @returns {*}
 */
module.exports.nestedFolders = (filePath, url, folderToScan) => {
    const parts = filePath.split(path.sep);
    if (parts.length >= 3) {
        const folderToScanParts = folderToScan.split(path.sep);
        const lastFolderIndex = parts.length - 3;
        var nestedFolderParts = [];
        parts.forEach(function (part, index) {
            if (part === folderToScanParts[folderToScanParts.length - 1]) {
                nestedFolderParts = parts.splice(index + 1, (lastFolderIndex - index));
            }
        });

        return nestedFolderParts.join("/");
    } else {
        return null;
    }
};

/**
 * @param {?string} name
 * @return {?function}
 */
module.exports.nameToFunction = (name) => {
    if (!name) {
        return null;
    }
    switch (name) {
        case 'secondLastFolder':
            return module.exports.secondLastFolder;
        case 'nestedFolders':
            return module.exports.nestedFolders;
        default:
            throw new Error('Unknown folder function: ' + name);
    }
};
