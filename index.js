const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config(); // ← charge les variables .env

const { GoogleGenerativeAI } = require('@google/generative-ai'); // ← Gemini

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ✅ Initialisation Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Route test
app.get('/', (req, res) => {
  res.send('LogoScribe backend is running with Gemini!');
});

// ✅ Route IA de correction
app.post('/api/correct', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texte manquant dans la requête.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Corrige le texte suivant en français : orthographe, grammaire, ponctuation, style. Ne modifie pas le sens. Retourne uniquement le texte corrigé.\n\nTexte : ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const corrected = response.text();

    res.json({ corrected });
  } catch (err) {
    console.error('❌ Erreur Gemini:', err.message);
    res.status(500).json({ error: 'Erreur lors de la correction du texte avec Gemini.' });
  }
});

// 🎤 WebSocket transcription
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
  console.log(`🚀 Serveur LogoScribe (Gemini) démarré sur port ${PORT}`);
});
