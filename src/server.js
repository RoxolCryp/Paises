require('dotenv').config();

const express = require('express');
const session = require('express-session');
const crypto = require('node:crypto');
const pool = require('./db');
const paisesRouter = require('./routes/paises');
const authRouter = require('./routes/auth');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(session({
  name: 'paises.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));
app.use(express.static('public'));
app.use('/api/auth', authRouter);
app.use('/api/paises', paisesRouter);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ mensaje: 'Ese pais_id ya está registrado' });
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      mensaje: 'No se puede eliminar: este país tiene provincias asociadas. Elimina o reasigna primero esas provincias.',
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El JSON enviado no es válido' });
  }

  return res.status(500).json({ mensaje: 'Error interno del servidor' });
});

async function iniciarServidor() {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      console.log(`API disponible en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo conectar con MySQL:', error.message);
    process.exit(1);
  }
}

iniciarServidor();
