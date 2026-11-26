const { Server } = require('socket.io');
const { getEnv } = require('./env');
const { checkSocketSession, socketAuth } = require('../middleware/socketAuth.middleware');
let io;
const room = id => `user:${id}`;
const initSocket = server => {
  const env = getEnv();
  const origins = new Set([env.frontend, env.backend, ...(!env.production ? ['http://localhost:5173', 'http://localhost:5174'] : [])]);
  // Explicit, optional allowlist for a local frontend testing the deployed backend.
  if (process.env.LOCAL_FRONTEND_ORIGIN === 'http://localhost:5173') origins.add('http://localhost:5173');
  io = new Server(server, {
    path: process.env.SOCKET_PATH || '/socket.io',
    cors: { origin: [...origins] },
    allowRequest: (req, cb) => cb(null, !req.headers.origin || origins.has(req.headers.origin)),
  });
  io.use(socketAuth);
  io.on('connection', socket => {
    socket.join(room(socket.data.claims.sub));
    let checking = false;
    const timer = setInterval(async () => {
      if (checking) return;
      checking = true;
      try { await checkSocketSession(socket.handshake.auth?.token); }
      catch { socket.disconnect(true); }
      finally { checking = false; }
    }, 60000);
    socket.on('disconnect', () => clearInterval(timer));
  });
  return io;
};
// Send only an invalidation signal; the REST endpoint enforces recipient access.
const notify = id => io?.to(room(id)).emit('notifications:changed');
module.exports = { initSocket, notify };
