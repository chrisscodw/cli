//inspect project
//console.log(nexssConfig.getConfigFilePath());
const util = require("util");
const { loadConfigContent, saveConfigContent } = require("../../lib/config");
const { NEXSS_PROJECT_CONFIG_PATH } = require("../../config/config");
const nexssConfig = loadConfigContent(NEXSS_PROJECT_CONFIG_PATH);

const { warn, info } = require("../../lib/log");
const { bold, green, yellow, grey } = require("../../lib/color");
const cliArgs = require("minimist")(process.argv.slice(4));

if (nexssConfig) {
  console.log(bold(yellow("Current Project: ")));
  const files = nexssConfig.files;
  const pInfo = () => {
    return `Name: ${bold(green(nexssConfig.name))}
Files: ${yellow(files && files.length)} ${grey("nexss f add myfile.php")}`;
  };
  // Config file: ${util.inspect(nexssConfig)}
  console.log(pInfo());

  console.table(files);
  console.log(`${grey("To display config 'nexss config get'")}`);
} else {
  warn(`This is not ${bold("Nexss PROGRAMMER project")}`);
  info(
    `Create new project:
      New folder: ${bold("nexss project new MyProjectName")} OR ${bold(
      "nexss p n MyProjectName"
    )}
      Current folder: ${bold("nexss project new .")} OR ${bold("nexss p n .")}
    `
  );
}
process.exit(0);
