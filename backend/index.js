const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const rutaTransacciones = require('./routes/transacciones');
app.use('/api/transacciones', rutaTransacciones);

const rutasAuth = require('./routes/auth');
app.use('/api/auth', rutasAuth);

mongoose.connect(process.env.MONGO_URI).then(() => console.log('Conectado a MongoDB')).catch(err => console.error('Erroral conectar a MongoDB', err));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Conectado a la base de datos MongoDB');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error conectando a MongoDB:', error.message);
  });