const express = require('express');
const fs = require('fs');
const path = require('path');
const SftpClient = require('ssh2-sftp-client'); // Import the ssh2-sftp-client library
var exec = require('ssh-exec')
var https = require('https'),
swaggerJsdoc = require("swagger-jsdoc"),
swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'File Transfer API',
      version: '1.0.0',
      description: 'A simple API for transferring files to a remote server using SFTP',
    },
  },
  apis: [__filename], // Include this file for swagger-jsdoc to generate documentation from
};

Date.prototype.yyyyMMddHHmmss = function () {
  var date = this;
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hh = date.getHours();
  var mm = date.getMinutes();
  var ss = date.getSeconds();
  return "" + year +
      (month < 10 ? "0" + month : month) +
      (day < 10 ? "0" + day : day) +
      (hh < 10 ? "0" + hh : hh) +
      (mm < 10 ? "0" + mm : mm) +
      (ss < 10 ? "0" + ss : ss);
};

/**
 * @swagger
 * /shellInvocation-0.0.1-SNAPSHOT/shellInvocationController/invokeScript:
 *   get:
 *     summary: Generate a text file and transfer it to a remote server via SFTP.
 *     parameters:
 *       - in: query
 *         name: InstanceID
 *         required: true
 *         schema:
 *           type: string
 *         description: Instance ID.
 *       - in: query
 *         name: InterfaceID
 *         required: true
 *         schema:
 *           type: string
 *         description: Interface ID.
 *       - in: query
 *         name: ScriptLocation
 *         required: true
 *         schema:
 *           type: string
 *         description: Location of the script.
 *     responses:
 *       200:
 *         description: File placed successfully.
 *       400:
 *         description: Missing parameters.
 *       500:
 *         description: Internal Server Error.
 */

var options = {
  key: fs.readFileSync('./ssl/privatekey.pem'),
  cert: fs.readFileSync('./ssl/certificate.pem'),
};


app.get('/shellInvocation-0.0.1-SNAPSHOT/shellInvocationController/invokeScript', async (req, res) => {
  const { InstanceID, InterfaceID, ScriptLocation} = req.query;
  
  if (!InstanceID || !InterfaceID || !ScriptLocation) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  let date = new Date()
  const filePath = path.join(__dirname, `${date.yyyyMMddHHmmss()}_${InstanceID.padStart(20,'0')}_${InterfaceID.padStart(20,'0')}.txt`);

  fs.writeFile(filePath, '', async (err) => {
    if (err) {
      console.error('Error creating file:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: '170.173.94.63',
        username: 'serveftp', // Replace with your username
        password:'syn4Tax#' // Replace with the path to your private key
      });

      await sftp.put(filePath, `${'/home/serveftp/orc_test/'}${date.yyyyMMddHHmmss()}_${InstanceID.padStart(20,'0')}_${InterfaceID.padStart(20,'0')}.txt`);
      res.json({ message: 'File placed successfully.' });

    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await sftp.end();
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
  });
});

// Serve Swagger UI
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

var server = https.createServer(options, app).listen(3000, function(){
  console.log("Express server listening on 3000 ");
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
