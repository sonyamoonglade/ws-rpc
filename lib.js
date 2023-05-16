const { WebSocketServer } = require('ws');
const util = require('node:util');
const http = require('node:http');
const handle = http.createServer();

const serveApi = (api) => {
   if (!api) {
      const err = new Error('missing api');
      throw err;
   }
   if (!api.hasOwnProperty('findProcedure') || typeof api['findProcedure'] !== 'function') {
      const err = new Error('findProcedure has invalid type or missing in provided api');
      throw err;
   }
   const server = new WebSocketServer({ server: handle });
   server.on('connection', (client) => {
      client.on('error', (err) => {
         console.error('error in server with client: %O', err);
      });
      client.on('message', async (chunk) => {
         const data = JSON.parse(chunk);
         console.log('server got %s', data);
         const { procedure, args, timestamp, requestId } = data;
         const fn = api.findProcedure(procedure);
         if (!fn) {
            client.send(
               JSON.stringify({
                  result: null,
                  error: util.format('missing procedure %s', procedure),
                  requestId,
                  timestamp,
               })
            );
            return;
         }
         const result = await fn.apply(null, ...args);
         client.send(
            JSON.stringify({
               result,
               error: null,
               requestId,
               timestamp,
            })
         );
      });
   });

   handle.listen({ port: 8000, host: '0.0.0.0' }, () => {
      console.log('%O\n is listening ws://0.0.0.0:8000', api);
   });
};

module.exports = { serveApi };
