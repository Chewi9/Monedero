const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*', // Permitir conexiones desde cualquier sitio (ideal para probar ahora)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const rutaTransacciones = require('./routes/transacciones');
app.use('/api/transacciones', rutaTransacciones);

const rutasAuth = require('./routes/auth');
app.use('/api/auth', rutasAuth);

mongoose.connect(process.env.MONGO_URI).then(() => console.log('Conectado a MongoDB')).catch(err => console.error('Erroral conectar a MongoDB', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});