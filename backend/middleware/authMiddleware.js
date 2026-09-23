const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Pedimos el token que viene en la cabecera de la petición
  const token = req.header('Authorization');

  // Si no tiene token fuera
  if (!token) {
    return res.status(401).json({ mensaje: 'No hay token, permiso denegado' });
  }

  try {
    // Verificamos el token
    const tokenLimpio = token.replace('Bearer ', '');
    const decodificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
    
    // Extraemos el usuario
    req.usuario = decodificado;
    next(); // Le dejamos pasar a la ruta que quería ir
  } catch (error) {
    res.status(401).json({ mensaje: 'Token no válido' });
  }
};