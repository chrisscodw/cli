// Language download-all
// Language add git://sadasdasd, name: git://nexssp/language-name
// Language update
const {
  NEXSS_PROJECT_PATH,
  NEXSS_LANGUAGES_PATH,
  NEXSS_HOME_PATH
} = require("../../config/config");
const { join, extname, resolve } = require("path");
const { warn, di, success } = require("../../lib/log");
const { bold, yellow } = require("../../lib/color");
const cache = require("../../lib/cache");

function getLanguagesConfigFiles(projectFolder = "") {
  let paths = [];
  const fg = require("fast-glob");
  const languagePathArray = [
    "languages",
    "**",
    `*.${process.platform}.nexss.config.js`
  ];

  // ../languages/php/win32.nexss.config.js
  paths.push(join(__dirname, "..", ...languagePathArray).replace(/\\/g, "/"));
  // di(`Languages Path: ${nexssLanguagesConfigPath}`);

  // PROJECTPATH/languages/php/win32/nexss.config.js
  paths.push(join(NEXSS_HOME_PATH, ...languagePathArray).replace(/\\/g, "/"));
  // console.log(NEXSS_PROJECT_PATH, "x");
  // process.exit();
  if (NEXSS_PROJECT_PATH) {
    paths.push(
      join(resolve(NEXSS_PROJECT_PATH), ...languagePathArray).replace(
        /\\/g,
        "/"
      )
    );
  }

  return fg.sync(paths);
}

module.exports.getLanguages = recreateCache => {
  const getLanguagesCacheName = `nexss_core_getLanguages__.json`;
  if (!recreateCache && cache.exists(getLanguagesCacheName, "1y")) {
    return cache.readJSON(getLanguagesCacheName);
  }

  let result = {};
  const files = getLanguagesConfigFiles(NEXSS_PROJECT_PATH);

  for (file of files) {
    let content = require(file);
    content.extensions.forEach(languageExtension => {
      result[languageExtension] = content;
      result[languageExtension]["configFile"] = file;
    });
  }

  // Store only if there is something in the cache
  if (Object.keys(result).length > 0) {
    cache.writeJSON(getLanguagesCacheName, result);
  }

  return result;
};

module.exports.languageNames = () => {
  const languages = module.exports.getLanguages();
  if (languages)
    return Object.keys(languages)
      .map(
        language =>
          `${bold(languages[language].extensions[0])} ${yellow(
            bold(languages[language].url.replace("https://", ""))
          )} - ${languages[language].description}`
      )
      .sort();
};

module.exports.getLang = (ext, recreateCache) => {
  // Cache L1
  if (process.languages && process.languages[ext]) {
    return process.languages[ext];
  }
  if (!ext) {
    return false;
  }
  let language;
  const getLanguageCacheName = `nexss_core_getLanguages_${ext}_.json`;
  if (!recreateCache && cache.exists(getLanguageCacheName, "1y")) {
    language = cache.readJSON(getLanguageCacheName);
  } else {
    language = module.exports.getLanguages(recreateCache);
    language = language[ext];
  }

  if (!language) {
    warn(
      `New extension '${bold(
        ext
      )}', checking online repository for implementation..`
    );

    const langRepositories = require("../repos.json");

    const { ensureInstalled } = require("../../lib/terminal");

    const config = require(`../../nexss-language/languages/config.${process.platform}`);

    const osPM =
      config.osPackageManagers[Object.keys(config.osPackageManagers)[0]];

    if (langRepositories[ext]) {
      ensureInstalled(osPM.keyOfItem, osPM.installation);
      ensureInstalled("git", `${osPM.install} git`);

      const repoName = require("path").basename(langRepositories[ext]);
      const repoPath = `${NEXSS_LANGUAGES_PATH}/${repoName}`;
      try {
        require("child_process").execSync(
          `git clone ${langRepositories[ext]} ${repoPath}`,
          {
            stdio: "inherit"
          }
        );
        success(`Implementation for '${ext}' has been installed.`);
      } catch (error) {
        if ((error + "").indexOf("Command failed: git clone") > -1) {
          console.error(
            `Issue with the repository: ${bold(langRepositories[ext])}`
          );
        } else {
          console.log(
            "Language seems to be already there. Trying update..",
            error
          );
          try {
            // We trying update the repo with the latest version as already there
            require("child_process").execSync(`git -C ${repoPath} pull`, {
              stdio: "inherit"
            });
          } catch (error) {
            console.error(error);
            process.exit();
          }
        }
      }

      cache.del(`nexss_core_getLanguages__.json`);
      cache.del(`nexss_core_getLanguages_${ext}_.json`);
      module.exports.getLanguages(true);
      language = module.exports.getLang(ext);
    } else {
      warn(
        `Nexss Online Github Repository: Support for language with extension ${ext} has not been found. Please consider installing it manually.`
      );
      process.exit(0);
    }
  }

  if (!language) {
    warn(`File with extension ${ext} is not supported.`);
  }

  cache.writeJSON(getLanguageCacheName, language);

  if (!process.languages) process.languages = {};
  process.languages[ext] = language;

  return language;
};

module.exports.getLangByFilename = (name, recreateCache) => {
  const ext = extname(name);
  return module.exports.getLang(ext, recreateCache);
};
