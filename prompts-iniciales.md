# Prompts iniciales (Cursor / IDE con IA)

Este documento recoge los **prompts** que orientaron el trabajo en los tres tickets técnicos del ejercicio: **base de datos**, **backend** y **frontend**, para la historia de usuario **«Añadir candidato al sistema ATS»**.

Antes de implementar, cada ticket se **amplió y detalló** usando el comando **`enhance-ticket`**: a partir del texto breve del enunciado se generó una versión enriquecida (criterios de aceptación, rutas, contratos de API, validaciones, accesibilidad, definición de hecho, etc.). Los prompts que siguen describen el núcleo del trabajo; el refinamiento vino de ese paso de *enhancement* aplicado al ticket.

---

## Contexto común (copiar al inicio de cada sesión con el asistente)

```
Proyecto LTI: React (CRA) en frontend/ y Express + TypeScript + Prisma en backend/.
PostgreSQL con Docker (docker-compose). API en http://localhost:3010, frontend en http://localhost:3000.
Lee README.md del repo para arrancar backend, frontend y base de datos.

Historia de usuario: como reclutador quiero añadir candidatos al ATS con nombre, apellido, email,
teléfono, dirección, educación, experiencia laboral, y opcionalmente CV (PDF o DOCX).
Validación cliente y servidor, mensaje de éxito y de error, y enlace/botón visible desde el dashboard
del reclutador hacia el formulario de alta.
```

---

## Ticket 1 — Modelo de datos y base de datos (Prisma + PostgreSQL)

```
Define en Prisma el modelo Candidate con relaciones a Education, WorkExperience y Resume (CV en disco
referenciado por ruta/tipo), acorde a un ATS. Campos obligatorios donde aplique; email único.
Incluye migración para PostgreSQL. Documenta cómo ejecutar prisma migrate en el README o en comentarios
del equipo si hace falta.

Restricciones: nombres de campos alineados con lo que consumirá el API REST (POST /candidates).
```

---

## Ticket 2 — Backend (API, validación, subida de CV, seguridad básica)

```
Implementa en Express:

POST /candidates — crea candidato con JSON: datos personales, array de educaciones, array de
experiencias laborales, y opcionalmente CV ya subido (filePath + fileType tras el upload).

POST /upload — multipart/form-data para el fichero del CV; solo PDF y DOCX, tamaño máximo razonable
(p. ej. 10 MB); guarda el archivo en disco bajo una carpeta controlada (p. ej. uploads/) y devuelve
ruta y tipo para enlazar al POST /candidates.

Validación en servidor: campos obligatorios, email válido y único (respuesta clara si duplicado),
reglas de fechas (fin >= inicio cuando existan ambas). Middleware de errores que devuelva mensajes
útiles sin filtrar detalles internos. CORS para el origen del frontend en desarrollo.

Estructura por capas (domain/application/presentation o equivalente) y tipos TypeScript para el body
validado.
```

---

## Ticket 3 — Frontend (dashboard, formulario, UX, errores)

```
En React con react-router y react-bootstrap (o lo que ya use el proyecto):

1) Página principal del reclutador (dashboard) con un botón o enlace claramente visible "Add candidate"
   que navegue a /recruiter/candidates/new.

2) Página de formulario con campos: nombre, apellido, email, teléfono, dirección, educación (repetible
   con límite), experiencia laboral (repetible), y campo de archivo para CV.

3) Validación en cliente: obligatorios, email válido, mismo archivo CV PDF/DOCX y tamaño máximo.
   Si hay CV: primero POST /upload, luego POST /candidates con el payload.

4) Tras éxito: mensaje de confirmación visible. Ante error de red o 4xx/5xx: mensaje al usuario.

5) Layout responsive; accesibilidad básica: labels asociados, controles de teclado, mensajes de error
   por campo.

No añadas autenticación si el repo base no la tiene; deja el flujo preparado para producción.
```

---

## Tests y calidad (prompt opcional)

```
Añade tests unitarios para la validación del formulario y, si el proyecto ya usa Jest en backend,
tests de integración o controlador para POST /candidates y POST /upload con casos felices y de error.
```

---

## Nota sobre autocompletado (nota del enunciado)

El enunciado sugiere **autocompletado** en educación y experiencia a partir de datos existentes. Se dejó
como mejora futura (endpoint de búsqueda o `datalist`); el alcance mínimo entregado cubre formulario
manual con validación y listas repetibles.

---

## Resumen

| Área        | Enfoque del prompt |
|------------|--------------------|
| Base de datos | Modelo relacional Prisma, migraciones, `Candidate` + `Education` + `WorkExperience` + `Resume` |
| Backend    | `POST /candidates`, `POST /upload`, validación, errores, almacenamiento seguro de ficheros |
| Frontend   | Dashboard → formulario, validación, UX éxito/error, responsive y accesibilidad básica |

Estos prompts se usaron como **entrada iterativa** en Cursor (chat y edición asistida), ajustando el
detalle según la estructura real del repositorio base tras leer `README.md` y el esquema existente.
El flujo fue: ticket del enunciado → **`enhance-ticket`** (ticket ampliado) → prompts y desarrollo asistido.
