const express = require('express');
const router = express.Router();
const Transaccion = require('../models/Transaccion'); 
const auth = require('../middleware/authMiddleware');

// Obtener solo las transacciones del USUARIO LOGUEADO
router.get('/', auth, async (req, res) => {
  try {
    const transacciones = await Transaccion.find({ usuario: req.usuario.id }).sort({ fecha: -1 });
    res.json(transacciones);
  } catch (error) {
    console.error('Error en GET /transacciones:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Crear nueva
router.post('/', auth, async (req, res) => {
  try {
    const nuevaTransaccion = new Transaccion({
      usuario: req.usuario.id,
      descripcion: req.body.descripcion,
      cantidad: req.body.cantidad,
      categoria: req.body.categoria,
      fecha: req.body.fecha,
      tipo: req.body.tipo
    });

    const guardada = await nuevaTransaccion.save();
    res.status(201).json(guardada); 
  } catch (error) {
    console.error('Error en POST /transacciones:', error);
    res.status(400).json({ mensaje: error.message }); 
  }
});

// Eliminar
router.delete('/:id', auth, async (req, res) => {
  try {
    await Transaccion.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado correctamente' });
  } catch (error) {
    console.error('Error en DELETE:', error);
    res.status(500).json({ mensaje: error.message });
  }
});

// Actualizar
router.put('/:id', auth, async (req, res) => {
  try {
    const actualizada = await Transaccion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizada);
  } catch (error) {
    console.error('Error en PUT:', error);
    res.status(400).json({ mensaje: error.message });
  }
});

module.exports = router;