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
const fs = require('fs');
const path = require('path');

const traverseFilesSync = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    for (let i in list) {
        const relativeFile = list[i];
        if (relativeFile) {
            const absoluteFile = path.join(dir, relativeFile);
            const stat = fs.statSync(absoluteFile);
            if (stat && stat.isDirectory()) {
                traverseFilesSync(absoluteFile).forEach(f => results.push(f));
            } else {
                results.push(absoluteFile);
            }
        }
    }
    return results;
};

const replacePathPartInUrl = (url, pathReplacement) => {
    var urlParts = url.split("/");
    urlParts = replacePathPartInPathArray(urlParts, pathReplacement);
    return urlParts.join("/");
};

const replacePathPartInPathArray = (urlParts, pathReplacement) => {
    const oldValueRegex = new RegExp(pathReplacement.oldValueRegex);
    var indexOfPart = urlParts.indexOf(pathReplacement.part);
    if (indexOfPart != -1 && indexOfPart != urlParts.length - 1 && oldValueRegex.test(urlParts[indexOfPart + 1])) {
        urlParts.splice(
            urlParts.indexOf(pathReplacement.part) + 1,
            1, pathReplacement.newValue);
    }

    return urlParts;
}

module.exports.traverseFilesSync = traverseFilesSync;

module.exports.caseInsensitiveEquals = (stringA, stringB) => {
    return stringA.toUpperCase() === stringB.toUpperCase();
};

module.exports.replacePathPartInUrl = replacePathPartInUrl;

module.exports.replacePathPartInPathArray = replacePathPartInPathArray;
