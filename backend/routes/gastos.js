const express = require('express');
const router = express.Router();
const Gasto = require('../models/Gasto'); 

// RUTA 1: Obtener todos los gastos (GET)
router.get('/', async (req, res) => {
  try {
    const gastos = await Gasto.find().sort({ fecha: -1 });
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// RUTA 2: Crear un nuevo gasto (POST)
router.post('/', async (req, res) => {
  const nuevoGasto = new Gasto({
    descripcion: req.body.descripcion,
    cantidad: req.body.cantidad,
    categoria: req.body.categoria,
    fecha: req.body.fecha
  });

  try {
    const gastoGuardado = await nuevoGasto.save();
    res.status(201).json(gastoGuardado); 
  } catch (error) {
    res.status(400).json({ mensaje: error.message }); 
  }
});

// RUTA 3: Eliminar un gasto (DELETE) - ¡NUEVO!
router.delete('/:id', async (req, res) => {
  try {
    await Gasto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Gasto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// RUTA 4: Actualizar un gasto (PUT) - ¡NUEVO!
router.put('/:id', async (req, res) => {
  try {
    const gastoActualizado = await Gasto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Devuelve el dato ya actualizado
    );
    res.json(gastoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

module.exports = router;