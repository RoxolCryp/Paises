const express = require('express');
const pool = require('../db');

const router = express.Router();

function soloAdministrador(req, res, next) {
  if (req.session?.isAdmin !== true) {
    return res.status(401).json({ mensaje: 'Inicia sesión como administrador para realizar cambios' });
  }
  next();
}

function validarPais(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'El cuerpo de la solicitud debe ser un objeto JSON' };
  }

  const descripcion = body.pais_descripcion == null
    ? null
    : typeof body.pais_descripcion === 'string'
      ? body.pais_descripcion.trim()
      : undefined;

  if (descripcion === undefined) {
    return { error: 'pais_descripcion debe ser texto o null' };
  }

  if (descripcion !== null && descripcion.length > 50) {
    return { error: 'pais_descripcion debe tener máximo 50 caracteres' };
  }

  return { descripcion };
}

function validarId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Listar todos los países
router.get('/', async (req, res) => {
  const [paises] = await pool.execute(
    'SELECT pais_id, pais_descripcion FROM paises ORDER BY pais_id'
  );
  res.json(paises);
});

// Consultar un país por ID
router.get('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El ID debe ser un entero positivo' });

  const [paises] = await pool.execute(
    'SELECT pais_id, pais_descripcion FROM paises WHERE pais_id = ?',
    [id]
  );
  if (paises.length === 0) return res.status(404).json({ mensaje: 'País no encontrado' });

  res.json(paises[0]);
});

// Crear un país (público)
router.post('/', async (req, res) => {
  const pais = validarPais(req.body);
  if (pais.error) return res.status(400).json({ mensaje: pais.error });

  const id = validarId(req.body.pais_id);
  if (!id) return res.status(400).json({ mensaje: 'pais_id es obligatorio y debe ser un entero positivo' });

  await pool.execute(
    'INSERT INTO paises (pais_id, pais_descripcion) VALUES (?, ?)',
    [id, pais.descripcion]
  );
  const [paises] = await pool.execute(
    'SELECT pais_id, pais_descripcion FROM paises WHERE pais_id = ?',
    [id]
  );

  res.status(201).json(paises[0]);
});

// Actualizar un país (público)
router.put('/:id', async (req, res) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El ID debe ser un entero positivo' });

  const pais = validarPais(req.body);
  if (pais.error) return res.status(400).json({ mensaje: pais.error });

  const [existentes] = await pool.execute(
    'SELECT pais_id FROM paises WHERE pais_id = ?',
    [id]
  );
  if (existentes.length === 0) return res.status(404).json({ mensaje: 'País no encontrado' });

  await pool.execute(
    'UPDATE paises SET pais_descripcion = ? WHERE pais_id = ?',
    [pais.descripcion, id]
  );

  const [paises] = await pool.execute(
    'SELECT pais_id, pais_descripcion FROM paises WHERE pais_id = ?',
    [id]
  );
  res.json(paises[0]);
});

// Eliminar un país
router.delete('/:id', soloAdministrador, async (req, res) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensaje: 'El ID debe ser un entero positivo' });

  const [result] = await pool.execute(
    'DELETE FROM paises WHERE pais_id = ?',
    [id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'País no encontrado' });

  res.status(204).send();
});

module.exports = router;
