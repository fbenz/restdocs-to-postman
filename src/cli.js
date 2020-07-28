/*
 * Copyright 2017 the original author or authors.
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
const program = require('commander');
const converter = require('./convert');
const folderFunctions = require('./folder-functions');
const {version} = require('../package.json');

module.exports.go = function () {

    program
        .version(version, '-v, --version')
        .option('-i, --input [folder]', 'folder to recursively scan for REST Docs curl-request.adoc/md files', '.')
        .option('-e, --export-format [format]', 'export format', 'postman')
        .option('-o, --output [file]', 'output file')
        .option('-r, --replacements [file]', 'optional JSON file with replacements')
        .option('-f, --determine-folder [function name]', 'optional function to structure requests into folders')
        .option('-t, --attachments [file]', 'optional JSON file with attachments')
        .option('-c, --collection-name [name]', 'title of the collection', 'REST Docs to Postman')
        .parse(process.argv);

    let replacements, attachments;
    if (program.replacements) {
        replacements = JSON.parse(fs.readFileSync(program.replacements, 'utf8'));
    }
    if (program.attachments) {
        attachments = JSON.parse(fs.readFileSync(program.attachments, 'utf8'));
    }

    // Conversion
    const result = converter.convert({
        folderToScan: program.input,
        exportFormat: program.exportFormat,
        replacements: replacements,
        attachments: attachments,
        determineFolder: folderFunctions.nameToFunction(program.determineFolder),
        collectionName: program.collectionName
    });
    // Output/write result
    if (program.output) {
        const fullOutputPath = path.resolve(program.output);
        if (fullOutputPath) {
            fs.writeFileSync(fullOutputPath, result);
        } else {
            console.log('No cURL commands were found.');
        }
    } else {
        console.log(result);
    }
};