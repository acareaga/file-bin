'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');

const async = require('async');
const RSVP = require('rsvp');

const filterOutDirectories = require('./lib/filter-out-directories');

function FileBin(baseDirectory, validExtensions) {
  if (!(this instanceof FileBin)) {
    throw new Error('Must be instantiated with the "new" keyword.');
  }

  this.base = baseDirectory || process.cwd();
  this.validExtensions = validExtensions || [];
};

FileBin.prototype.find = function (fileName) {
  return new RSVP.Promise((resolve, reject) => {
    fs.readFile(path.join(this.base, fileName), (error, file) => {
      if (error) { return reject(error); }
      return resolve(formatFile(fileName, file));
    });
  });
};

FileBin.prototype.list = function () {
  return new RSVP.Promise((resolve, reject) => {
    fs.readdir(this.base, (error, files) => {
      if (error) { return reject(error); }

      files = filterInvalidExtensions(this, files);

      return filterOutDirectories(this.base, files).then(resolve);
    });
  });
};

FileBin.prototype.all = function () {
  return new RSVP.Promise((resolve, reject) => {
    this.list().then(fileNames => {
      var promises = fileNames.map(this.find, this)
      RSVP.all(promises).then(resolve);
    }).catch(reject);
  });
};

FileBin.prototype.write = function (fileName, data) {
  var fullPath = path.join(this.base, fileName);
  return new RSVP.Promise((resolve, reject) => {
    fs.writeFile(fullPath, data, (error) => {
      if (error) { reject(error); }
      resolve(formatFile(fileName, data));
    });
  });
};

function filterInvalidExtensions(fileBin, files) {
  if (!fileBin.validExtensions.length) { return files; }
  return files.filter(file => {
    return fileBin.validExtensions.indexOf(path.extname(file)) !== -1;
  });
}

function formatFile(fileName, content) {
  return {
    id: fileName,
    content: content
  };
}

module.exports = FileBin;