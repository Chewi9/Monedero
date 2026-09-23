const express = require('express');
const router = express.Router();
const Transaccion = require('../models/Transaccion'); 

// Obtener todo
router.get('/', async (req, res) => {
  try {
    const transacciones = await Transaccion.find().sort({ fecha: -1 });
    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Crear nueva
router.post('/', async (req, res) => {
  const nuevaTransaccion = new Transaccion({
    descripcion: req.body.descripcion,
    cantidad: req.body.cantidad,
    categoria: req.body.categoria,
    fecha: req.body.fecha,
    tipo: req.body.tipo
  });

  try {
    const guardada = await nuevaTransaccion.save();
    res.status(201).json(guardada); 
  } catch (error) {
    res.status(400).json({ mensaje: error.message }); 
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  try {
    await Transaccion.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const actualizada = await Transaccion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    );
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

module.exports = router;