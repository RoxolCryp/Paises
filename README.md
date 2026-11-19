# CRUD de países con Node.js y MySQL

Aplicación web y API REST para consultar, crear, editar y eliminar registros de la tabla `paises` en MySQL. Cualquiera puede consultar, agregar países y cambiar sus nombres. Eliminar registros sigue reservado al administrador.

## Requisitos

- Node.js 18 o superior
- MySQL 8 (o compatible)

## Preparación

1. Crea la tabla ejecutando el archivo `schema.sql` desde MySQL Workbench, la consola de MySQL u otra herramienta. El script crea la base `Paises` y la tabla `paises` si todavía no existen.
2. Copia `.env.example` a `.env`. Completa `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` con los datos de MySQL. Cambia también `ADMIN_PASSWORD` por una clave privada que solo tú conozcas. `SESSION_SECRET` debe ser una cadena aleatoria larga; puedes generarla con `openssl rand -hex 32`.
3. Instala las dependencias con `npm install`.
4. Inicia en modo desarrollo con `npm run dev` o normalmente con `npm start`.

La aplicación verifica la conexión a MySQL al arrancar. Abre `http://localhost:3000` para ver y gestionar el catálogo. Las rutas `POST` y `PUT` son públicas, igual que los controles de agregar y editar en la página; la ruta `DELETE` requiere inicio de sesión de administrador.

**Aviso:** cualquier persona que pueda acceder a la API puede crear países y cambiar nombres. Usa esta configuración solo si realmente quieres permitir esos cambios a todos; no expongas el servidor a Internet sin agregar controles de acceso adecuados.

No compartas el archivo `.env` ni subas sus valores al repositorio. Si el servidor ya estaba ejecutándose, detenlo con `Ctrl+C` y vuelve a iniciarlo con `npm run dev` para cargar los cambios de configuración.

## Estructura de la tabla

- `pais_id`: entero y clave primaria. Se envía al crear un país porque esta tabla lo comparte mediante una clave foránea con `provincias`.
- `pais_descripcion`: descripción del país (máximo 50 caracteres, puede ser `null`).

## Endpoints

| Método | Ruta | Acción |
| --- | --- | --- |
| `GET` | `/api/paises` | Listar todos los países |
| `GET` | `/api/paises/:id` | Consultar un país |
| `POST` | `/api/paises` | Crear un país (público) |
| `PUT` | `/api/paises/:id` | Actualizar la descripción (público) |
| `DELETE` | `/api/paises/:id` | Eliminar un país (solo administrador) |

La autenticación web está en `/api/auth/login` y `/api/auth/logout`; la sesión se guarda en una cookie `HttpOnly` y `SameSite=Strict`. Las lecturas `GET`, la creación `POST` y la edición `PUT` son públicas. La eliminación `DELETE` requiere sesión de administrador.

Para crear, envía un `pais_id` entero que todavía no exista y `pais_descripcion`. Para actualizar, solo hace falta `pais_descripcion`:

```json
{
  "pais_id": 3,
  "pais_descripcion": "México"
}
```

La página permite editar nombres con el botón «Editar». Para probar la API de forma manual, estos ejemplos usan `curl`:

```sh
curl http://localhost:3000/api/paises

curl http://localhost:3000/api/paises/1

curl -X POST http://localhost:3000/api/paises \
  -H 'Content-Type: application/json' \
  -d '{"pais_id":3,"pais_descripcion":"México"}'

curl -X PUT http://localhost:3000/api/paises/1 \
  -H 'Content-Type: application/json' \
  -d '{"pais_descripcion":"México"}'

curl -X DELETE http://localhost:3000/api/paises/1
```

Las consultas usan parámetros preparados. La API responde con `400` para datos inválidos, `404` si no existe el país y `204` al eliminar correctamente.
