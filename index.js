const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// route test
app.get('/', (req, res) => {
  res.send('LogoScribe backend is running!');
});

io.on('connection', (socket) => {
  console.log('✅ Nouvelle connexion :', socket.id);

  socket.on('transcription', (data) => {
    console.log('📝 Texte reçu:', data);
    // Renvoie à tous les autres clients
    socket.broadcast.emit('transcription', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Déconnecté :', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur LogoScribe démarré sur port ${PORT}`);
});
