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

const fixturesPath = path.join(__dirname, './fixtures');
const snippetsPath = path.join(__dirname, './input-snippets');

const extractResources = (insomniaCollectionString) => {
    return JSON.stringify(JSON.parse(insomniaCollectionString).resources);
};

const exampleReplacements = {
    host: {
        before: 'http://localhost:8080',
        after: '{{host}}'
    },
    headers: [
        {
            name: 'Authorization',
            newValue: '{{oauth2Token}}'
        }
    ]
};

describe('Should convert Spring REST Docs cURL snipptes to', () => {
    it('an Insomnia collection', () => {
        const expectedOutput = fs.readFileSync(path.join(fixturesPath, 'insomnia.json'), 'utf8');
        const actualOutput = converter.convert(snippetsPath, 'insomnia');
        expect(extractResources(actualOutput)).toEqual(extractResources(expectedOutput));
    });

    it('a Postman collection', () => {
        const expectedOutput = fs.readFileSync(path.join(fixturesPath, 'postman.json'), 'utf8');
        const actualOutput = converter.convert(snippetsPath, 'postman');
        expect(actualOutput).toEqual(expectedOutput);
    });

    it('an Insomnia collection with replacements', () => {
        const expectedOutput = fs.readFileSync(path.join(fixturesPath, 'insomnia-with-replacements.json'), 'utf8');
        const actualOutput = converter.convert(snippetsPath, 'insomnia', exampleReplacements);
        expect(extractResources(actualOutput)).toEqual(extractResources(expectedOutput));
    });

    it('a Postman collection with replacements', () => {
        const expectedOutput = fs.readFileSync(path.join(fixturesPath, 'postman-with-replacements.json'), 'utf8');
        const actualOutput = converter.convert(snippetsPath, 'postman', exampleReplacements);
        expect(actualOutput).toEqual(expectedOutput);
    });
});