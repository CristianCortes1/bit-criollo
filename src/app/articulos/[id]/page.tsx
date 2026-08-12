import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, ArrowLeft, FileText, Calendar, User, FolderOpen } from 'lucide-react';
import { prisma } from '@/lib/prisma';

async function getArticle(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return article;
  } catch (error) {
    console.error('Error al cargar el artículo:', error);
    return null;
  }
}

function getPreviewMode(fileUrl?: string, mimeType?: string | null) {
  const url = (fileUrl || '').toLowerCase();
  const type = (mimeType || '').toLowerCase();

  if (url.endsWith('.pdf') || type.includes('pdf')) return 'pdf';
  if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp') || type.startsWith('image/')) return 'image';
  return 'download';
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);

  if (!article) {
    notFound();
  }

  const latestVersion = article.versions?.[0];
  const previewMode = getPreviewMode(latestVersion?.fileUrl, latestVersion?.mimeType);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a artículos
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-slate-950/30">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-criollo-300">
              <FileText className="w-4 h-4" />
              Artículo
            </div>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">{article.name}</h1>

            {article.category && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <FolderOpen className="w-3.5 h-3.5" />
                {article.category}
              </div>
            )}

            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Autor: {latestVersion?.author || 'Sin información'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Actualizado: {latestVersion?.createdAt ? new Date(latestVersion.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Versión: {latestVersion?.version || 'Sin versión'}</span>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Vista previa</h2>

              {previewMode === 'pdf' && latestVersion?.fileUrl ? (
                <iframe
                  src={latestVersion.fileUrl}
                  title={article.name}
                  className="h-[70vh] w-full rounded-xl border border-slate-700 bg-white"
                />
              ) : previewMode === 'image' && latestVersion?.fileUrl ? (
                <img
                  src={latestVersion.fileUrl}
                  alt={article.name}
                  className="max-h-[70vh] w-full rounded-xl border border-slate-700 object-contain"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
                  <p className="text-base font-medium text-slate-200">Este archivo no tiene vista previa en línea.</p>
                  <p className="mt-2 text-sm text-slate-400">Puedes descargarlo para visualizarlo localmente.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-slate-950/30">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Acciones</h2>

            {latestVersion?.fileUrl ? (
              <div className="mt-5 space-y-3">
                <a
                  href={latestVersion.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={latestVersion.fileName || article.name}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-criollo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-criollo-500"
                >
                  <Download className="w-4 h-4" />
                  Descargar archivo
                </a>

                {previewMode !== 'download' && (
                  <a
                    href={latestVersion.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    Abrir en nueva pestaña
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
                Este artículo no tiene archivo asociado.
              </div>
            )}

            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-semibold text-slate-200">Archivo actual</p>
              <p className="mt-2 break-all">{latestVersion?.fileName || 'Sin nombre'}</p>
              {latestVersion?.fileSize ? (
                <p className="mt-1 text-xs text-slate-400">Tamaño: {(latestVersion.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
