const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/authMiddleware');

// Registro
router.post('/registro', async (req, res) => {
  try {
    // Comprobar si email existe
    const existeUsuario = await Usuario.findOne({ email: req.body.email });
    if (existeUsuario) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(req.body.password, salt);

    // Crear y guardar el usuario
    const nuevoUsuario = new Usuario({
      nombre: req.body.nombre,
      email: req.body.email,
      password: passwordEncriptada
    });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario creado con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Comprobar si existe el email
    const usuario = await Usuario.findOne({ email: req.body.email });
    if (!usuario) {
      return res.status(400).json({ mensaje: 'Email o contraseña incorrectos' });
    }

    // Comprobar contraseña
    const passwordValida = await bcrypt.compare(req.body.password, usuario.password);
    if (!passwordValida) {
      return res.status(400).json({ mensaje: 'Email o contraseña incorrectos' });
    }

    // Crear token
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Devolvemos el token
    res.json({
      token: token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email }
    });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

router.put('/perfil', auth, async (req, res) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.usuario.id,
            {nombre: req.body.nombre},
            {new: true}
        );
        res.json({id: usuarioActualizado._id, nombre: usuarioActualizado.nombre, email: usuarioActualizado.email});
    } catch (error) {
        res.status(500).json({mensaje: error.message});
    }
});

module.exports = router;