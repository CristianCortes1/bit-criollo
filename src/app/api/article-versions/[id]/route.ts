import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID de versión no proporcionado.' }, { status: 400 });
    }

    // Find the version and its article
    const version = await prisma.articleVersion.findUnique({
      where: { id },
      include: {
        article: {
          include: { versions: { select: { id: true } } },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Versión no encontrada.' }, { status: 404 });
    }

    const totalVersions = version.article.versions.length;

    if (totalVersions <= 1) {
      // Last version — delete the whole article (cascade deletes version too)
      await prisma.article.delete({ where: { id: version.articleId } });
      return NextResponse.json({ success: true, articleDeleted: true });
    }

    const remainingVersion = await prisma.articleVersion.findFirst({
      where: {
        articleId: version.articleId,
        id: { not: id },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        category: true,
      },
    });

    // More versions remain — delete only this version and keep the article category aligned
    await prisma.articleVersion.delete({ where: { id } });

    if (remainingVersion) {
      await prisma.article.update({
        where: { id: version.articleId },
        data: {
          category: remainingVersion.category ?? null,
        },
      });
    }

    return NextResponse.json({ success: true, articleDeleted: false });
  } catch (error: any) {
    console.error('Error al eliminar versión:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar la versión.' },
      { status: 500 }
    );
  }
}
