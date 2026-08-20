import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, ArrowLeft, FolderArchive, Calendar, Tag, FileText, Eye } from 'lucide-react';
import { prisma } from '@/lib/prisma';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const buildTemplatePath = (template: any) => {
  const category = template.category || 'plantilla';
  const title = template.name || 'documento';
  return `${toSlug(category)}-${toSlug(title)}`;
};

async function getTemplate(id: string) {
  try {
    const templateById = await prisma.template.findUnique({
      where: { id },
    });

    if (templateById) return templateById;

    const templates = await prisma.template.findMany();
    return templates.find((template) => buildTemplatePath(template) === id || template.id === id) || null;
  } catch (error) {
    console.error('Error al cargar la plantilla:', error);
    return null;
  }
}

function getPreviewMode(url?: string | null) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf') || lower.includes('pdf')) return 'pdf';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) return 'image';
  return 'download';
}

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const template = await getTemplate(params.id);

  if (!template) {
    notFound();
  }

  // Determine preview URL (previewUrl preferred, fallback to fileUrl if it's pdf/image)
  const displayPreviewUrl = template.previewUrl || (getPreviewMode(template.fileUrl) !== 'download' ? template.fileUrl : null);
  const previewMode = getPreviewMode(displayPreviewUrl);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Volver a plantillas</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Main Detail Section */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-slate-950/30 space-y-6">
            
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-400">
                <FolderArchive className="w-4 h-4" />
                <span>Plantilla Oficial</span>
              </div>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">{template.name}</h1>

              {template.category && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{template.category}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {template.description && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Descripción</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {template.description}
                </p>
              </div>
            )}

            {/* Metadata Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Subido el {template.createdAt ? new Date(template.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Oficial'}</span>
              </div>
              {template.fileName && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="truncate max-w-[240px]">{template.fileName}</span>
                </div>
              )}
            </div>

            {/* Preview Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vista Previa</span>
                </h2>
                {displayPreviewUrl && (
                  <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Documento de visualización
                  </span>
                )}
              </div>

              {previewMode === 'pdf' && displayPreviewUrl ? (
                <iframe
                  src={displayPreviewUrl}
                  title={template.name}
                  className="h-[70vh] w-full rounded-xl border border-slate-700 bg-white"
                />
              ) : previewMode === 'image' && displayPreviewUrl ? (
                <div className="flex justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                  <img
                    src={displayPreviewUrl}
                    alt={template.name}
                    className="max-h-[70vh] w-auto max-w-full rounded-lg border border-slate-700 object-contain shadow-lg"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-500" />
                  <p className="text-sm font-medium text-slate-200">
                    No hay una vista previa de imagen o PDF asignada a esta plantilla.
                  </p>
                  <p className="text-xs text-slate-400">
                    Puedes descargar el documento oficial (.docx / .xlsx) directamente utilizando el botón lateral.
                  </p>
                </div>
              )}
            </div>

          </section>

          {/* Actions Sidebar */}
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-slate-950/30 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Acciones de Plantilla</h2>

              {template.fileUrl ? (
                <div className="mt-4 space-y-3">
                  <a
                    href={template.fileUrl}
                    download={template.fileName || `${template.name}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-600/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar plantilla</span>
                  </a>

                  {displayPreviewUrl && (
                    <a
                      href={displayPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                      <span>Abrir vista previa en nueva pestaña</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
                  Esta plantilla no tiene un archivo asociado.
                </div>
              )}
            </div>

            {/* Template Summary info card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300 space-y-2">
              <p className="font-semibold text-slate-200">Información del archivo</p>
              <p className="text-xs text-slate-400 break-all">
                Archivo: {template.fileName || 'Plantilla Word'}
              </p>
              {template.fileSize && (
                <p className="text-xs text-slate-400">
                  Tamaño: {(template.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
              {template.previewFileName && (
                <p className="text-xs text-emerald-400/90 break-all">
                  Vista previa: {template.previewFileName}
                </p>
              )}
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
