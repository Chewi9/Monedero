const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
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
  }
});

module.exports = mongoose.model('Gasto', gastoSchema);