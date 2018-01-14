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

module.exports.traverseFilesSync = traverseFilesSync;

module.exports.caseInsensitiveEquals = (stringA, stringB) => {
    return stringA.toUpperCase() === stringB.toUpperCase();
};