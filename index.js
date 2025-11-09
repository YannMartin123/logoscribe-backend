const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const {TextServiceClient} = require('@google-ai/generativelanguage').v1beta;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Init client Gemini
const client = new TextServiceClient({
  apiKey: process.env.GEMINI_API_KEY,
});

// Route test
app.get('/', (req, res) => {
  res.send('LogoScribe backend is running!');
});

// Route IA correction avec Gemini
app.post('/api/correct', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texte manquant dans la requête.' });
  }

  try {
    // Requête à Gemini modèle text-bison-001
    const [response] = await client.generateText({
      model: 'models/text-bison-001',
      prompt: {
        text: `Corrige ce texte en français : ${text}`,
      },
      temperature: 0.7,
      maxTokens: 1024,
    });

    const corrected = response.candidates[0].output;
    res.json({ corrected });
  } catch (err) {
    console.error('❌ Erreur Gemini:', err);
    res.status(500).json({ error: 'Erreur lors de la correction du texte.' });
  }
});

// WebSocket transcription
io.on('connection', (socket) => {
  console.log('✅ Nouvelle connexion :', socket.id);

  socket.on('transcription', (data) => {
    console.log('📝 Texte reçu:', data);
    socket.broadcast.emit('transcription', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Déconnecté :', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur LogoScribe-Back démarré sur port ${PORT}`);
});
