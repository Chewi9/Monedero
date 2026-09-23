const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  categoria: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  tipo: { type: String, enum: ['gasto', 'ingreso'], required: true }
});

module.exports = mongoose.model('Transaccion', transaccionSchema);