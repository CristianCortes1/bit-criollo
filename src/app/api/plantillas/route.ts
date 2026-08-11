import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error al obtener plantillas desde PostgreSQL:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawName = formData.get('name') as string | null;
    const rawDescription = formData.get('description') as string | null;
    const rawCategory = formData.get('category') as string | null;

    if (!file || !rawName || !rawCategory) {
      return NextResponse.json(
        { error: 'El archivo, el nombre y la categoría son obligatorios.' },
        { status: 400 }
      );
    }

    const name = rawName.trim();
    const description = (rawDescription || '').trim();
    const category = rawCategory.trim();

    // 1. Guardar archivo en Vercel Blob o Fallback Local
    let fileUrl = '';
    const blobToken = process.env.BitCriolloBlob_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    const hasBlobToken = Boolean(blobToken && blobToken.trim() !== '');

    if (hasBlobToken) {
      try {
        const blob = await put(`plantillas/${Date.now()}-${file.name}`, file, {
          access: 'public',
          token: blobToken,
        });
        fileUrl = blob.url;
      } catch (blobErr) {
        console.error('Error al subir plantilla a Vercel Blob:', blobErr);
      }
    }

    // Fallback local en desarrollo
    if (!fileUrl) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'plantillas');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, safeFilename);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);
        fileUrl = `/uploads/plantillas/${safeFilename}`;
      } catch (fsErr) {
        console.error('Error de almacenamiento local (sistema de archivos de solo lectura en Vercel):', fsErr);
        return NextResponse.json(
          { error: 'No se pudo subir la plantilla. Configura BitCriolloBlob_READ_WRITE_TOKEN en Vercel.' },
          { status: 500 }
        );
      }
    }

    // 2. Guardar registro en PostgreSQL via Prisma
    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Error general en POST /api/plantillas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la subida de la plantilla.' },
      { status: 500 }
    );
  }
}
