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
const converter = require('../../index');
const folderFunctions = require('../folder-functions');

const fixturesPath = path.join(__dirname, 'fixtures');
const snippetsPath = path.join(__dirname, 'input-snippets');
const nestedSnippetsPath = path.join(__dirname, 'nested-input-snippets');

const exampleReplacements = {
    host: {
        before: 'http://localhost:8080',
        after: '{{host}}'
    },
    headers: [
        {
            name: 'Authorization',
            newValue: 'Bearer {{oauth2Token}}'
        }
    ],
    pathReplacements: [
        {
            part: 'items',
            oldValueRegex: '^\\d+$',
            newValue: '{{itemId}}'
        }
    ]
};

const loadFixture = (fileName) => {
    return JSON.parse(fs.readFileSync(path.join(fixturesPath, fileName), 'utf8'));
};

describe('Should convert Spring REST Docs cURL snippets to', () => {
    it('an Insomnia collection', () => {
        const expectedOutput = loadFixture('insomnia.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'insomnia'
        }));
        expect(actualOutput.resources).toEqual(expectedOutput.resources);
    });

    it('a Postman collection', () => {
        const expectedOutput = loadFixture('postman.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'postman'
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('an Insomnia collection with replacements', () => {
        const expectedOutput = loadFixture('insomnia-with-replacements.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'insomnia',
            replacements: exampleReplacements
        }));
        expect(actualOutput.resources).toEqual(expectedOutput.resources);
    });

    it('a Postman collection with replacements', () => {
        const expectedOutput = loadFixture( 'postman-with-replacements.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'postman',
            replacements: exampleReplacements
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('an Insomnia collection with folders', () => {
        const expectedOutput = loadFixture('insomnia-with-folders.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'insomnia',
            determineFolder: folderFunctions.secondLastFolder
        }));
        expect(actualOutput.resources).toEqual(expectedOutput.resources);
    });

    it('an Insomnia collection with nested folders', () => {
        const expectedOutput = loadFixture('insomnia-with-nested-folders.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'insomnia',
            determineFolder: folderFunctions.nestedFolders
        }));
        expect(actualOutput.resources).toEqual(expectedOutput.resources);
    });

    it('an Insomnia collection with nested folders with matching names', () => {
        const expectedOutput = loadFixture('insomnia-with-nested-matching-folders.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: nestedSnippetsPath,
            exportFormat: 'insomnia',
            determineFolder: folderFunctions.nestedFolders
        }));
        expect(actualOutput.resources).toEqual(expectedOutput.resources);
    });

    it('a Postman collection with folders', () => {
        const expectedOutput = loadFixture('postman-with-folders.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'postman',
            determineFolder: folderFunctions.secondLastFolder
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('an Insomnia collection with folders and replacements', () => {
        const expectedOutput = loadFixture('insomnia-with-folders-and-replacements.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'insomnia',
            determineFolder: folderFunctions.secondLastFolder,
            replacements: exampleReplacements
        }));
        expect(actualOutput.resources).toEqual(expectedOutput.resources);
    });

    it('a Postman collection with folders and replacements', () => {
        const expectedOutput = loadFixture('postman-with-folders-and-replacements.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'postman',
            determineFolder: folderFunctions.secondLastFolder,
            replacements: exampleReplacements
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('a Postman collection with attachments', () => {
        const expectedOutput = loadFixture('postman-with-attachments.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'postman',
            attachments: {
                info: {
                    someInfo: 42
                },
                auth: {
                    someAuth: true
                },
                event: [
                    'someEvent'
                ],
                variable: [
                    {
                        a: 'b'
                    }
                ]
            }
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('a Postman collection with nested folders ', () => {
        const expectedOutput = loadFixture('postman-with-nested-folders.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: snippetsPath,
            exportFormat: 'postman',
            determineFolder: folderFunctions.nestedFolders
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('a Postman collection with nested matching folders ', () => {
        const expectedOutput = loadFixture('postman-with-nested-matching-folders.json');
        const actualOutput = JSON.parse(converter.convert({
            folderToScan: nestedSnippetsPath,
            exportFormat: 'postman',
            determineFolder: folderFunctions.nestedFolders
        }));
        expect(actualOutput).toEqual(expectedOutput);
    });
});
