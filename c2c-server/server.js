// Import necessary modules
const net = require('net');
const readline = require('readline');
const { exec } = require('child_process');

// Keep track of connected clients
let clients = {};
let currentClient = null;

// Function that handles a new client connection
function handleClientConnection(socket) {
  const id = socket.remoteAddress;
  console.log(`Client connected with id: ${id}`);

  // Add new client to the clients object with a unique id
  clients[id] = socket;

  // Set the new client as the current client if there isn't one
  if (currentClient === null) {
    currentClient = id;
  }

  socket.on('data', handleClientData.bind(null, id));
  socket.on('end', handleClientEnd.bind(null, id));
  socket.on('error', handleClientError.bind(null, id));
}

// Function to handle data received from a client
function handleClientData(id, data) {
  console.log(`Output from ${id}: ${data}`);
}

// Function to handle a client disconnecting
function handleClientEnd(id) {
  console.log(`Client disconnected with id: ${id}`);
  delete clients[id];

  // If the disconnected client was the current client, set the current client to null
  if (currentClient === id) {
    currentClient = null;
  }
}

// Function to handle an error from a client
function handleClientError(id, error) {
  console.error(`An error occurred with client ${id}: ${error.message}`);
}

// Create server
const server = net.createServer(handleClientConnection);
server.on('error', (error) => console.error(`An error occurred with the server: ${error.message}`));
server.listen(3000, '127.0.0.1', () => console.log('Server listening on port 3000'));

// Read commands from the terminal and handle them
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', handleLine);

// Function to handle a line of input from the terminal
function handleLine(input) {
  const [command, ...args] = input.trim().split(' ');
  switch (command) {
    case 'switch':
      switchClient(args[0]);
      break;
    case 'broadcast':
      broadcastMessage(args.join(' '));
      break;
    case 'kill':
      killClient(args[0]);
      break;
    case 'sleep':
      sendSleepCommand(args[0]);
      break;
    case 'list':
      listClients();
      break;
    default:
      sendCommand(input.trim());
  }
}

// Function to switch to a different client
function switchClient(id) {
  if (clients[id]) {
    currentClient = id;
    console.log(`Switched to client ${id}`);
  } else {
    console.error(`No client with id ${id}`);
  }
}

function listClients() {
  console.log('Connected clients:');
  for (let id in clients) {
    console.log(`- ${id}`);
  }
}


// Function to broadcast a message to all clients
function broadcastMessage(message) {
  for (let id in clients) {
    try {
      clients[id].write(message);
    } catch (error) {
      console.error(`An error occurred when writing to client ${id}: ${error.message}`);
    }
  }
}

// Function to kill a client connection
function killClient(id) {
  if (clients[id]) {
    try {
      clients[id].end('kill'); // Close connection with client
      console.log(`Connection closed with client ${id}`);
    } catch (error) {
      console.error(`An error occurred when closing connection with client ${id}: ${error.message}`);
    }
  } else {
    console.error(`No client with id ${id}`);
  }
}

// Function to send a command to the current client
function sendCommand(command) {
  if (currentClient) {
    try {
      clients[currentClient].write(command);
    } catch (error) {
      console.error(`An error occurred when writing to client ${currentClient}: ${error.message}`);
    }
  } else {
    console.error(`No current client selected`);
  }
}

// Function to send a sleep command to the current client
function sendSleepCommand(duration) {
  if (currentClient) {
    const sleepCommand = `sleep ${duration}`;
    sendCommand(sleepCommand);
    console.log(`Sent sleep command "${sleepCommand}" to client ${currentClient}`);
  } else {
    console.error(`No current client selected`);
  }
}
