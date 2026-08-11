'use client';

import { X, History, Download, User, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export interface ArticleVersionItem {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  version: string;
  author: string;
  createdAt: string;
}

export interface ArticleItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  versions: ArticleVersionItem[];
}

interface VersionHistoryModalProps {
  article: ArticleItem | null;
  onClose: () => void;
}

export default function VersionHistoryModal({ article, onClose }: VersionHistoryModalProps) {
  if (!article) return null;

  const versions = article.versions || [];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-criollo-500/10 text-criollo-400 rounded-xl border border-criollo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{article.name}</h2>
              <p className="text-xs text-slate-400">
                Historial completo de versiones ({versions.length} versión{versions.length === 1 ? '' : 'es'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions Timeline List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-grow custom-scrollbar">
          {versions.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              No hay versiones registradas para este artículo.
            </p>
          ) : (
            versions.map((ver, idx) => {
              const isLatest = idx === 0;

              return (
                <div
                  key={ver.id || idx}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isLatest
                      ? 'bg-slate-800/80 border-criollo-500/40 shadow-lg shadow-criollo-950/50'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-criollo-500/20 text-criollo-300 border border-criollo-500/30">
                          {ver.version}
                        </span>
                        {isLatest && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Última Versión (Vigente)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-400 flex-wrap gap-y-1">
                        <div className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ver.author}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDate(ver.createdAt)}</span>
                        </div>

                        {ver.fileSize && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatSize(ver.fileSize)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-mono truncate max-w-sm">
                        {ver.fileName}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      <a
                        href={ver.fileUrl}
                        download={ver.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                          isLatest
                            ? 'bg-criollo-600 hover:bg-criollo-500 text-white shadow-md shadow-criollo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 text-right flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
