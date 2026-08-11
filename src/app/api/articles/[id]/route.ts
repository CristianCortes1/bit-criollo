import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
