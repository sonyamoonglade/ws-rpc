const { randomUUID } = require('node:crypto');
const { WebSocket } = require('ws');

// requestId - response
const response = new Map();

// requestId - Promise resolve
const waitGroup = new Map();

const ws = new WebSocket('ws://localhost:8000');

ws.on('error', (err) => {
   console.log('error in client occurred: %O', err);
});

ws.on('open', () => {
   ws.ping();
});

const defer = (value, cb) => {
   // runs after event loop 'loops'
   setTimeout(cb, 0);
   return value;
};

const makeCall = async (procedure, ...args) => {
   const requestId = randomUUID();
   await new Promise((resolve) => {
      const call = JSON.stringify({
         procedure,
         args,
         timestamp: Date.now(),
         requestId,
      });
      waitGroup.set(requestId, resolve);
      ws.send(call);
   });
   return defer(response.get(requestId), () => response.delete(requestId));
};

ws.on('pong', () => {
   ws.on('message', (chunk) => {
      const { result, error, requestId, timestamp } = JSON.parse(chunk);
      console.dir({
         timestamp,
         requestId,
         result,
         error,
      });
      const resolve = waitGroup.get(requestId);
      response.set(requestId, { result, error, requestId });
      resolve();
      waitGroup.delete(requestId);
   });
});

const receiveArgs = async (req) => {
   const buffers = [];
   for await (const chunk of req) {
      buffers.push(chunk);
   }
   return JSON.parse(Buffer.concat(buffers).toString());
};

// cli to call procedures
const server = require('node:http').createServer(async (req, res) => {
   try {
      const { url, method } = req;
      if (method !== 'POST') {
         res.writeHead(400, {
            'Content-Type': 'application/json',
         });
         res.end(
            JSON.stringify({
               message: 'invalid method',
            })
         );
         return;
      }
      const procedure = url.split('/').at(-1);
      const args = await receiveArgs(req);
      const response = await makeCall(procedure, args);
      res.writeHead(200, {
         'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(response));
      return;
   } catch (err) {
      console.error('error occured in http cli client: %O', err);
      res.writeHead(500);
      res.end();
      return;
   }
});

server.listen(9001);
