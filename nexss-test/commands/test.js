const { bright, exe, camelCase } = require("../lib/lib");
const { yellow, green, red } = require("../../lib/color");
const fs = require("fs");
const path = require("path");
const testsDef = require("../tests/languages.nexss-test.js");
const startFrom = testsDef.startFrom;
const endsWith = testsDef.endsWith;
const omit = testsDef.omit;
// const lang = JSON.parse(exe("nexss py info --json"));
// console.log(lang.title);
// process.exit(1);
const tempFolder = require("os").tmpdir();
const testFolderName = `Nexss-test-${Math.random()
  .toString(36)
  .substring(7)}`;
const testPath = path.join(tempFolder, testFolderName);

if (!fs.existsSync(testPath)) {
  fs.mkdirSync(testPath);
}
console.log(`Test Folder Destination: ${testPath}`);
process.chdir(testPath);

var tests = 1;
var continuue = 0;
var totalPerformedTests = 0;
global.currentExtension = null;
testsDef.values.forEach(ext => {
  global.currentExtension = ext;

  console.log("===========================================================");
  console.log(yellow(`Testing \x1b[1m${bright(ext)}\x1b[0m`));

  if (continuue || ext === startFrom || !startFrom) {
    continuue = 1;

    if (omit.includes(ext)) {
      console.log(`\x1b[1m${bright(ext)} Ommitted\x1b[0m`);
      continuue = 1;
      return;
    }

    testsDef.tests.forEach(test => {
      console.log(yellow(test.title));

      test.tests.forEach(subtest => {
        console.log("===========================================");
        console.log(
          yellow(bright(`TEST ${tests++}`)),
          yellow(evalTS(subtest.title))
        );

        console.log(`===========================================`);
        eval(subtest.type || "shouldContain")(
          ...subtest.params.map(p => {
            if (p !== null && typeof p === "object") {
              return p;
            } else {
              return evalTS(p);
            }
          })
        );
        totalPerformedTests++;
      });
    });

    if (endsWith.includes(ext)) {
      console.log(yellow(`End`));
      process.exit(1);
      return;
    }
  }
});

function evalTS(v) {
  var ext = global.currentExtension;
  return eval("`" + v + "`");
}

console.log(yellow(`done! Total ${totalPerformedTests} tests.`));

function shouldContain(test, regE, options) {
  if (options && options.chdir) {
    console.log(`Changing Dir to: ${options.chdir}`);
    process.chdir(options.chdir);
  }
  const data = exe(test);

  // console.log("return: ", test, data);

  console.log(`${green(bright(test))} `);
  console.log(` ${camelCase(arguments.callee.name)}: ${bright(green(regE))}`);
  let regExp = new RegExp(regE, "i");
  let match = regExp.exec(data);
  if (match && match.length > 1) {
    console.log(green(bright("PASSED")));
    return match;
  } else if (data && data.includes(regE)) {
    console.log(green(bright("PASSED")));
    return data;
  }
  console.error(
    red(bright(`================================================`))
  );
  console.error(red(bright(`But contains: `)));
  console.error(yellow(data));
  console.error(
    red(bright(`=======================================================`))
  );
  console.error("process.cwd()", process.cwd());
  process.exit(1);
}

function test2(ext) {
  const c = `nexss randomfile${ext}`;
  console.log(`Test2: ${c}`);
  return c;
}