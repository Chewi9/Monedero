const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  descripcion: { 
    type: String, 
    required: true
  },
  cantidad: { 
    type: Number, 
    required: true 
  },
  categoria: { 
    type: String, 
    required: true 
  },
  fecha: { 
    type: Date, 
    default: Date.now // Si no le pasamos fecha, pone la de hoy
  },
  tipo: {
    type: String,
    enum: ['gasto', 'ingreso'],
    required: true,
  }
});

module.exports = mongoose.model('Transaccion', transaccionSchema);