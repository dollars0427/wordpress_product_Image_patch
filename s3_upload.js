const fs = require('fs');
const { readdirSync } = require('fs');
const AWS = require('aws-sdk');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const getDirectories = source =>
readdirSync(source, { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

const getFiles = source =>
readdirSync(source, { withFileTypes: true })
.map(dirent => dirent.name);

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const s3 = new AWS.S3();
