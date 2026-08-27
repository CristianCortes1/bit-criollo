import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

async function saveUploadedFile(file: File, folder: string) {
  let fileUrl = '';
  const blobToken = process.env.BitCriolloBlob_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlobToken = Boolean(blobToken && blobToken.trim() !== '');

  if (hasBlobToken) {
    try {
      const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
        access: 'public',
        token: blobToken,
      });
      fileUrl = blob.url;
    } catch (blobErr) {
      console.error(`Error al subir archivo a Vercel Blob (${folder}):`, blobErr);
    }
  }

  if (!fileUrl) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadsDir, safeFilename);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);
      fileUrl = `/uploads/${folder}/${safeFilename}`;
    } catch (fsErr) {
      console.error('Error de almacenamiento local:', fsErr);
    }
  }

  return fileUrl;
}

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
    const previewFile = formData.get('previewFile') as File | null;
    const rawName = formData.get('name') as string | null;
    const rawDescription = formData.get('description') as string | null;
    const rawCategory = formData.get('category') as string | null;
    const rawFase = formData.get('fase') as string | null;

    if (!file || !rawName || !rawCategory) {
      return NextResponse.json(
        { error: 'El archivo de la plantilla, el nombre y la categoría son obligatorios.' },
        { status: 400 }
      );
    }

    const name = rawName.trim();
    const description = (rawDescription || '').trim();
    const category = rawCategory.trim();
    const fase = rawFase ? rawFase.trim() : null;

    // 1. Guardar archivo principal (.docx)
    const fileUrl = await saveUploadedFile(file, 'plantillas');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'No se pudo subir el archivo de la plantilla.' },
        { status: 500 }
      );
    }

    // 2. Guardar archivo de vista previa si fue provisto
    let previewUrl: string | undefined = undefined;
    let previewFileName: string | undefined = undefined;

    if (previewFile && previewFile.size > 0) {
      const savedPreviewUrl = await saveUploadedFile(previewFile, 'plantillas-previews');
      if (savedPreviewUrl) {
        previewUrl = savedPreviewUrl;
        previewFileName = previewFile.name;
      }
    }

    // 3. Guardar registro en PostgreSQL vía Prisma
    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        fase,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        previewUrl: previewUrl || null,
        previewFileName: previewFileName || null,
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
