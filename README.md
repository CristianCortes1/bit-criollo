# Bit Criollo - Plataforma Interna de Documentación y Plantillas

Herramienta interna desarrollada por el equipo **Bit Criollo** para la centralización, edición, control de versiones de documentación y distribución de plantillas oficiales en formato Microsoft Word (`.docx`).

![Bit Criollo Logo](public/images/logo.png)

---

## 🚀 Características Principales

### 📄 1. Gestión de Artículos y Control de Versiones
- **Subida Drag & Drop**: Interfaz interactiva para arrastrar o seleccionar archivos en formatos `.docx`, `.pdf` e imágenes (`.png`, `.jpg`, `.webp`).
- **Formulario de Registro**: Captura de *Nombre del Artículo*, *Versión* (ej. `v1.0`, `v2.1`) y *Autor*.
- **Versionado Automático por Nombre**:
  - Si el nombre del artículo coincide con uno ya existente, el sistema añade el archivo como una **nueva versión** del mismo artículo (pasando a ser la versión vigente de descarga por defecto, sin borrar el historial anterior).
  - Si el nombre no existe, crea un nuevo artículo en la base de datos.
- **Historial Completo**: Modal de inspección de versiones para consultar y descargar cualquier versión anterior con su respectivo autor y fecha de carga.
- **Acceso Libre**: Sin autenticación ni login; pensado para acceso directo del equipo mediante la URL.

### 📁 2. Módulo de Plantillas Oficiales (`.docx`)
- **Catálogo de Plantillas**: Sección con archivos descargables en formato `.docx` (Actas de reunión, Bitácoras de desarrollo, Reportes de incidencias, Documentos de arquitectura).
- **Filtro por Categorías y Buscador**: Filtros en tiempo real para localizar rápidamente el formato requerido.
- **Extensión Trivial**: Para agregar una nueva plantilla **no se requiere modificar código**, basta con:
  1. Guardar el archivo `.docx` en la carpeta `public/plantillas/`.
  2. Agregar el registro con su título, descripción y categoría en `public/plantillas/plantillas.json`.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) (App Router & API Routes integradas)
- **Lenguaje**: TypeScript
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (Diseño oscuro personalizado, glassmorphism y micro-animaciones)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Base de Datos**: PostgreSQL ([Supabase](https://supabase.com/), Vercel Postgres o Neon) vía **Prisma ORM**
- **Almacenamiento de Archivos**:
  - **Producción**: [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) (`@vercel/blob`)
  - **Desarrollo Local**: Sistema de fallback automático en disco (`public/uploads/`) cuando no se dispone de token activo de Vercel Blob o base de datos local.

---

## 📂 Estructura del Proyecto

```text
├── images/
│   └── logo.png                   # Logo original de Bit Criollo
├── prisma/
│   └── schema.prisma              # Modelo relacional Prisma (Article, ArticleVersion)
├── public/
│   ├── images/
│   │   └── logo.png               # Logo servido estáticamente
│   ├── plantillas/
│   │   ├── plantillas.json        # Registro estático de plantillas de equipo
│   │   └── *.docx                 # Archivos de plantilla descargables
│   └── uploads/                   # Almacenamiento local de desarrollo (fallback)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/          # Endpoints GET/POST para subir y listar artículos
│   │   │   └── plantillas/        # Endpoint GET para obtener plantillas
│   │   ├── globals.css            # Estilos globales y utilidades glassmorphism
│   │   ├── layout.tsx             # Root Layout y metadatos
│   │   └── page.tsx               # Vista principal integrando pestañas y modales
│   ├── components/
│   │   ├── Header.tsx             # Navbar corporativo de Bit Criollo
│   │   ├── ArticleUploadModal.tsx # Modal con zona Drag & Drop y validaciones
│   │   ├── ArticleList.tsx        # Grid de artículos con buscador e historial
│   │   ├── VersionHistoryModal.tsx# Modal con línea de tiempo de versiones
│   │   └── TemplateList.tsx       # Grid de plantillas con filtro de categorías
│   └── lib/
│       └── prisma.ts              # Cliente Singleton de Prisma
├── .env.example                   # Plantilla de variables de entorno
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## ⚡ Instalación y Configuración Local

### 1. Requisitos Previos
- Node.js 18.x o superior.
- npm o pnpm.

### 2. Clonar el repositorio e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd "Plataforma de educacion virtual"
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`:

```env
# Cadena de conexión a PostgreSQL (ejemplo local o Supabase)
DATABASE_URL="postgresql://postgres:contraseña@localhost:5432/bit_criollo_docs"

# Token de Vercel Blob (Opcional en desarrollo local, requerido en producción)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

> **Nota:** Si en desarrollo local no configuras un `BLOB_READ_WRITE_TOKEN` o la base de datos PostgreSQL no está iniciada, la aplicación utilizará automáticamente el **sistema de fallback en disco local** (`public/uploads/`) para que puedas probar la aplicación sin interrupciones.

### 4. Generar Cliente de Prisma y sincronizar la base de datos
```bash
npx prisma generate
npx prisma db push
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📝 Guía para Agregar una Nueva Plantilla

1. Guarda tu archivo `.docx` en la carpeta `public/plantillas/` (ej. `public/plantillas/mi_nueva_plantilla.docx`).
2. Abre `public/plantillas/plantillas.json` y añade un nuevo objeto al arreglo:

```json
{
  "id": "mi-nueva-plantilla",
  "name": "Nombre de la Plantilla",
  "description": "Descripción breve del propósito del documento.",
  "category": "Actas",
  "file": "/plantillas/mi_nueva_plantilla.docx",
  "updatedAt": "2026-08-11"
}
```

3. ¡Listo! La plantilla aparecerá inmediatamente en el apartado de plantillas con su botón de descarga.

---

## 🌐 Despliegue en Vercel (Producción)

1. Sube el proyecto a tu repositorio en GitHub / GitLab.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. En la configuración del proyecto en Vercel, agrega la sección de **Storage > Blob** para obtener el token `BLOB_READ_WRITE_TOKEN`.
4. En **Environment Variables**, configura:
   - `DATABASE_URL`: La URL de conexión a tu PostgreSQL en Supabase, Vercel Postgres o Neon.
   - `BLOB_READ_WRITE_TOKEN`: El token del Storage Vercel Blob.
5. Vercel ejecutará automáticamente `npm run build` (el cual incluye `prisma generate`) y tu aplicación estará disponible globalmente.

---

## 🤝 Créditos

Desarrollado para el proyecto **Plataforma de educación virtual** por el grupo **Bit Criollo**.
