const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // ← charge le fichier .env

const app = express();
app.use(cors());
app.use(express.json()); // ← important pour lire req.body en JSON

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ✅ Route test
app.get('/', (req, res) => {
  res.send('LogoScribe backend is running!');
});

// ✅ Route IA de correction
app.post('/api/correct', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texte manquant dans la requête.' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui corrige le style, la grammaire et la ponctuation d’un texte en français. Ne modifie pas le sens. Retourne uniquement le texte corrigé.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const corrected = response.data.choices[0].message.content;
    res.json({ corrected });
  } catch (err) {
    console.error('❌ Erreur API OpenAI:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la correction du texte.' });
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
  console.log(`🚀 Serveur LogoScribe démarré sur port ${PORT}`);
});
