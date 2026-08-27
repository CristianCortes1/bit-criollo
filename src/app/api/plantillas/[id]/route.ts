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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID de plantilla no proporcionado.' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    let name: string | undefined;
    let description: string | undefined;
    let category: string | undefined;
    let fase: string | undefined | null;
    let newFile: File | null = null;
    let newPreviewFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = (formData.get('name') as string)?.trim();
      description = (formData.get('description') as string)?.trim();
      category = (formData.get('category') as string)?.trim();
      const rawFase = formData.get('fase') as string | null;
      fase = rawFase !== null ? rawFase.trim() : undefined;
      newFile = formData.get('file') as File | null;
      newPreviewFile = formData.get('previewFile') as File | null;
    } else {
      const body = await req.json();
      name = body.name?.trim();
      description = body.description?.trim();
      category = body.category?.trim();
      fase = body.fase !== undefined ? (typeof body.fase === 'string' ? body.fase.trim() : null) : undefined;
    }

    if (!name) {
      return NextResponse.json({ error: 'El nombre de la plantilla es obligatorio.' }, { status: 400 });
    }

    const updateData: any = {
      name,
      description: description ?? '',
      category: category ?? 'General',
    };

    if (fase !== undefined) {
      updateData.fase = fase && fase.length > 0 ? fase : null;
    }

    if (newFile && newFile.size > 0) {
      const fileUrl = await saveUploadedFile(newFile, 'plantillas');
      if (fileUrl) {
        updateData.fileUrl = fileUrl;
        updateData.fileName = newFile.name;
        updateData.fileSize = newFile.size;
      }
    }

    if (newPreviewFile && newPreviewFile.size > 0) {
      const previewUrl = await saveUploadedFile(newPreviewFile, 'plantillas-previews');
      if (previewUrl) {
        updateData.previewUrl = previewUrl;
        updateData.previewFileName = newPreviewFile.name;
      }
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, template: updatedTemplate });
  } catch (error: any) {
    console.error('Error al actualizar plantilla:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar la plantilla.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID de plantilla no proporcionado.' }, { status: 400 });
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar plantilla:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la plantilla.' },
      { status: 500 }
    );
  }
}
