const NEXSS_CACHE_PATH = require("os").homedir() + "/.nexss/cache";
const fs = require("fs"),
  { extname } = require("path");
const { yellow, red } = require("./color");
const ms = require("ms");
const fg = require("fast-glob");

const getFileUpdatedDate = path => {
  const stats = fs.statSync(path);
  return stats.mtime;
};

const fileCachePath = path => {
  return `${NEXSS_CACHE_PATH}/${path}`;
};

const clean = glob => {
  if (!glob) {
    throw "specify glob for cache.clean";
  }
  const globToClean = `${process.env.NEXSS_CACHE_PATH}/${glob}`.replace(
    /\\/g,
    "/"
  );

  fg.sync(globToClean).forEach(file => {
    fs.unlinkSync(file);
  });

  return true;
};

const exists = (path, duration) => {
  if (!process.argv.includes("--nocache")) {
    if (duration) {
      const pathToCache = fileCachePath(path);
      if (fs.existsSync(pathToCache)) {
        const cacheExpiryDate =
          ms(duration) + getFileUpdatedDate(pathToCache).getTime();
        // Cache - check if exists and updated date

        recreateCache = cacheExpiryDate < Date.now();
      } else {
        recreateCache = true;
      }

      if (recreateCache) {
        if (process.argv.includes("--debug")) {
          console.log(yellow("Recreating cache..."));
        }
      } else if (fs.existsSync(pathToCache)) {
        //Cache exists so we get result from cache
        if (extname(pathToCache) !== ".json") {
          resultToString = fs.readFileSync(pathToCache);
        } else {
          resultToString = require(pathToCache);
        }
        if (process.argv.includes("--debug")) {
          console.log(`${red("CACHE")} ${path}: ${resultToString}`);
        }

        //Object.assign(startData, resultToString);
        return resultToString;
      }
    }
  }
};

const write = (path, content) => {
  const pathToCache = fileCachePath(path);
  fs.writeFileSync(pathToCache, content);
};
const writeJSON = (filename, content) => {
  module.exports.write(
    filename,
    JSON.stringify(content, (k, v) => (typeof v === "function" ? "" + v : v))
  );
};

const read = path => {
  const pathToCache = fileCachePath(path);
  return fs.readFileSync(pathToCache);
};

const readJSON = filename => {
  return JSON.parse(module.exports.read(filename), function(k, v) {
    if (typeof v === "string" && v.startsWith("function(") && v.endsWith("}")) {
      return eval("(" + v + ")");
    }
    return v;
  });
};
const del = path => {
  const pathToCache = fileCachePath(path);
  if (!fs.existsSync(pathToCache)) {
    return;
  }
  return fs.unlinkSync(pathToCache);
};

module.exports = {
  del,
  clean,
  exists,
  write,
  writeJSON,
  read,
  readJSON,
  getFileUpdatedDate
};
