const crypto = require('node:crypto');
const express = require('express');

const router = express.Router();

router.get('/session', (req, res) => {
  res.json({ autenticado: req.session.isAdmin === true });
});

router.post('/login', (req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const password = req.body?.password;

  if (!adminPassword) {
    return res.status(503).json({ mensaje: 'Configura ADMIN_PASSWORD en el archivo .env' });
  }

  if (typeof password !== 'string') {
    return res.status(400).json({ mensaje: 'Escribe la contraseña de administrador' });
  }

  const expected = crypto.createHash('sha256').update(adminPassword).digest();
  const received = crypto.createHash('sha256').update(password).digest();
  if (!crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
  }

  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.isAdmin = true;
    res.json({ autenticado: true });
  });
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('paises.sid', { sameSite: 'strict' });
    res.status(204).send();
  });
});

module.exports = router;
