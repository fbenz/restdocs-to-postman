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
const path = require('path');
const folderFunctions = require('../folder-functions');

// This function ensures that the tests work across systems.
const toSystemPath = (filePath) => {
    return filePath.replace('/', path.sep);
};

describe('secondLastFolder should convert a given path to', () => {
    it('to the second last folder if sufficient many folders are given', () => {
        const givenPath = toSystemPath('generated-snippets/items/get/curl-request.adoc');
        const actual = folderFunctions.secondLastFolder(givenPath);
        expect(actual).toEqual('items');
    });

    it('to null if insufficient many folders are given', () => {
        const givenPath = toSystemPath('get/curl-request.adoc');
        const actual = folderFunctions.secondLastFolder(givenPath);
        expect(actual).toBeNull();
    });
});

describe('nameToFunction should convert', () => {
    it('the known function secondLastFolder', () => {
        const actual = folderFunctions.nameToFunction('secondLastFolder');
        expect(actual).toEqual(folderFunctions.secondLastFolder);
    });

    it('an unknown name to an error', () => {
        const actual = () => folderFunctions.nameToFunction('unknownFunction');
        expect(actual).toThrow('Unknown folder function: unknownFunction');
    });
});