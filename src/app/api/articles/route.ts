import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Helper de persistencia local en caso de que la DB PostgreSQL no esté conectada.
// En Vercel/Next serverless, public/uploads es de solo lectura; por eso usamos /tmp.
const FALLBACK_DB_PATH = path.join(os.tmpdir(), 'bit-criollo-articles-fallback.json');

function getFallbackData() {
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFallbackData(data: any[]) {
  try {
    const dir = path.dirname(FALLBACK_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('No se pudo guardar la base de datos fallback en disco (sistema de archivos de solo lectura):', err);
  }
}

export async function GET() {
  try {
    // Intentar consulta a base de datos PostgreSQL via Prisma
    const articles = await prisma.article.findMany({
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(articles);
  } catch (dbError) {
    console.warn('PostgreSQL no disponible actualmente. Usando almacenamiento local de desarrollo:', dbError);
    const fallbackArticles = getFallbackData();
    // Ordenar por actualización más reciente
    fallbackArticles.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json(fallbackArticles);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawName = formData.get('name') as string | null;
    const rawCategory = formData.get('category') as string | null;
    const rawVersion = formData.get('version') as string | null;
    const rawAuthor = formData.get('author') as string | null;

    if (!file || !rawName || !rawVersion || !rawAuthor) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios: archivo, nombre, versión y autor.' },
        { status: 400 }
      );
    }

    const name = rawName.trim();
  const category = rawCategory?.trim() || null;
    const versionStr = rawVersion.trim();
    const author = rawAuthor.trim();

    // 1. Guardar archivo en Vercel Blob o Fallback Local
    let fileUrl = '';
    const blobToken = process.env.BitCriolloBlob_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    const hasBlobToken = Boolean(blobToken && blobToken.trim() !== '');

    if (hasBlobToken) {
      try {
        const blob = await put(`articles/${Date.now()}-${file.name}`, file, {
          access: 'public',
          token: blobToken,
        });
        fileUrl = blob.url;
      } catch (blobErr) {
        console.error('Error al subir a Vercel Blob, intentando almacenamiento local:', blobErr);
      }
    }

    // Si no se usó Blob o falló, intentar guardar localmente en public/uploads/
    if (!fileUrl) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, safeFilename);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);
        fileUrl = `/uploads/${safeFilename}`;
      } catch (fsErr) {
        console.error('Error de almacenamiento local (sistema de archivos de solo lectura en Vercel):', fsErr);
        return NextResponse.json(
          { error: 'No se pudo subir el archivo. En producción (Vercel), debes verificar la variable de entorno BitCriolloBlob_READ_WRITE_TOKEN o BLOB_READ_WRITE_TOKEN en tu Dashboard.' },
          { status: 500 }
        );
      }
    }

    // 2. Guardar metadata en Base de Datos PostgreSQL o Fallback
    try {
      // Buscar si el artículo ya existe (búsqueda insensible a mayúsculas/minúsculas)
      const existingArticle = await prisma.article.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });

      const versionData = {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category: category ?? existingArticle?.category ?? null,
        version: versionStr,
        author,
      };

      let article;
      if (existingArticle) {
        // Artículo existe: Se agrega una nueva versión
        article = await prisma.article.update({
          where: { id: existingArticle.id },
          data: {
            updatedAt: new Date(),
            category: category ?? existingArticle.category,
            versions: {
              create: versionData,
            },
          },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      } else {
        // Artículo nuevo: Se crea el artículo y su primera versión
        article = await prisma.article.create({
          data: {
            name,
            category,
            versions: {
              create: versionData,
            },
          },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      }

      return NextResponse.json({ success: true, article });
    } catch (dbError) {
      console.warn('Error en PostgreSQL, utilizando almacenamiento local de respaldo:', dbError);

      const articles = getFallbackData();
      const existingIndex = articles.findIndex(
        (a: any) => a.name.toLowerCase() === name.toLowerCase()
      );

      const nowIso = new Date().toISOString();
      const newVersionObj = {
        id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category: category ?? articles[existingIndex]?.category ?? null,
        version: versionStr,
        author,
        createdAt: nowIso,
      };

      let resultArticle;
      if (existingIndex >= 0) {
        articles[existingIndex].updatedAt = nowIso;
        articles[existingIndex].category = category ?? articles[existingIndex].category ?? null;
        articles[existingIndex].versions.unshift(newVersionObj);
        resultArticle = articles[existingIndex];
      } else {
        resultArticle = {
          id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          category,
          createdAt: nowIso,
          updatedAt: nowIso,
          versions: [newVersionObj],
        };
        articles.push(resultArticle);
      }

      saveFallbackData(articles);
      return NextResponse.json({ success: true, article: resultArticle, isFallback: true });
    }
  } catch (error) {
    console.error('Error general en POST /api/articles:', error);
    return NextResponse.json(
      { error: 'Error al procesar la subida del artículo.' },
      { status: 500 }
    );
  }
}
