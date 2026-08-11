'use client';

import { useState } from 'react';
import { Search, Download, History, FileText, User, Calendar, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import VersionHistoryModal, { ArticleItem } from './VersionHistoryModal';
import ConfirmModal from './ConfirmModal';

interface ArticleListProps {
  articles: ArticleItem[];
  isLoading: boolean;
  onOpenUpload: () => void;
  onRefresh: () => void;
}

export default function ArticleList({ articles, isLoading, onOpenUpload, onRefresh }: ArticleListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleHistory, setSelectedArticleHistory] = useState<ArticleItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmArticle, setConfirmArticle] = useState<ArticleItem | null>(null);

  const handleDelete = async () => {
    if (!confirmArticle) return;
    setDeletingId(confirmArticle.id);
    try {
      const res = await fetch(`/api/articles/${confirmArticle.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmArticle(null);
        onRefresh();
      } else {
        const data = await res.json();
        console.error(data.error || 'Error al eliminar el artículo.');
      }
    } catch (err) {
      console.error('Error al eliminar artículo:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase();
    const latestVersion = art.versions?.[0];
    return (
      art.name.toLowerCase().includes(q) ||
      (latestVersion?.author && latestVersion.author.toLowerCase().includes(q)) ||
      (latestVersion?.version && latestVersion.version.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar: Search & Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por artículo, autor o versión..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-all"
          />
        </div>

        {/* Counter & Upload CTA */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {filteredArticles.length} artículo{filteredArticles.length === 1 ? '' : 's'} disponible{filteredArticles.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-criollo-600/20 hover:bg-criollo-600/30 text-criollo-300 border border-criollo-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nuevo Artículo</span>
          </button>
        </div>

      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-900/40 rounded-2xl border border-slate-800/60 animate-pulse p-5 space-y-3">
              <div className="h-5 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800/60 rounded w-1/2"></div>
              <div className="h-10 bg-slate-800/40 rounded mt-8"></div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        /* Empty State */
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 mx-auto bg-criollo-500/10 rounded-2xl flex items-center justify-center text-criollo-400 border border-criollo-500/20">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {searchQuery ? 'No se encontraron artículos' : 'Aún no hay artículos guardados'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? 'Intenta buscando con otro término o limpia la barra de búsqueda.'
                : 'Sé el primero en subir un artículo o acta de documentación para el equipo.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-criollo-600 hover:bg-criollo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-criollo-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Subir Primer Artículo</span>
            </button>
          )}
        </div>
      ) : (
        /* Grid of Article Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => {
            const latestVer = article.versions?.[0];
            const versionCount = article.versions?.length || 0;

            return (
              <div
                key={article.id}
                className="glass-card rounded-2xl p-5 border flex flex-col justify-between space-y-4 group"
              >
                {/* Header section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-criollo-300 transition-colors line-clamp-2">
                      {article.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {latestVer?.version && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-criollo-500/15 text-criollo-300 border border-criollo-500/30">
                          {latestVer.version}
                        </span>
                      )}
                      <button
                        onClick={() => setConfirmArticle(article)}
                        disabled={deletingId === article.id}
                        title="Eliminar artículo"
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        {deletingId === article.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Metadata info */}
                  {latestVer && (
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">Autor: {latestVer.author}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>Actualizado: {formatDate(latestVer.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  
                  {/* History button */}
                  <button
                    onClick={() => setSelectedArticleHistory(article)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-all"
                  >
                    <History className="w-3.5 h-3.5 text-criollo-400" />
                    <span>Historial ({versionCount})</span>
                  </button>

                  {/* Download latest version */}
                  {latestVer?.fileUrl ? (
                    <a
                      href={latestVer.fileUrl}
                      download={latestVer.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-criollo-600 hover:bg-criollo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-criollo-600/25 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Sin archivo</span>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      <VersionHistoryModal
        article={selectedArticleHistory}
        onClose={() => setSelectedArticleHistory(null)}
        onRefresh={onRefresh}
      />

      {/* Confirm Delete Article Modal */}
      <ConfirmModal
        isOpen={!!confirmArticle}
        title="¿Eliminar artículo?"
        message={`Estás a punto de eliminar "${confirmArticle?.name}" y todo su historial de versiones. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar artículo"
        isLoading={deletingId === confirmArticle?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmArticle(null)}
      />
    </div>
  );
}
