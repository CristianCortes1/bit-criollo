import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID de artículo no proporcionado.' }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error al obtener artículo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el artículo.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const category = body.category === undefined || body.category === null ? null : String(body.category).trim() || null;

    if (!id) {
      return NextResponse.json({ error: 'ID de artículo no proporcionado.' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'El nombre del artículo es obligatorio.' }, { status: 400 });
    }

    const articleExists = await prisma.article.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: { not: id },
      },
    });

    if (articleExists) {
      return NextResponse.json(
        { error: 'Ya existe otro artículo con ese nombre.' },
        { status: 409 }
      );
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        name,
        category,
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (updatedArticle.versions[0]) {
      await prisma.articleVersion.update({
        where: { id: updatedArticle.versions[0].id },
        data: { category },
      });
    }

    return NextResponse.json({ success: true, article: updatedArticle });
  } catch (error: any) {
    console.error('Error al editar artículo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al editar el artículo.' },
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
      return NextResponse.json({ error: 'ID de artículo no proporcionado.' }, { status: 400 });
    }

    // onDelete: Cascade in schema will delete related ArticleVersions automatically
    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar artículo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el artículo.' },
      { status: 500 }
    );
  }
}
