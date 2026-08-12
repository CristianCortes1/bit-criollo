'use client';

import { useMemo, useState } from 'react';
import { Search, Download, History, FileText, User, Calendar, PlusCircle, Trash2, Loader2, Eye, Pencil, Save, X } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticleHistory, setSelectedArticleHistory] = useState<ArticleItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmArticle, setConfirmArticle] = useState<ArticleItem | null>(null);
  const [previewItem, setPreviewItem] = useState<{ url: string; name: string } | null>(null);
  const [editArticle, setEditArticle] = useState<ArticleItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openPreview = (url: string, name: string, mimeType?: string | null) => {
    const lowerUrl = url.toLowerCase();
    const isPdf = lowerUrl.endsWith('.pdf') || mimeType === 'application/pdf';

    if (isPdf) {
      setPreviewItem({ url, name });
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openEditModal = (article: ArticleItem) => {
    setEditArticle(article);
    setEditForm({
      name: article.name,
      category: article.category ?? '',
    });
  };

  const saveArticleEdit = async () => {
    if (!editArticle) return;
    if (!editForm.name.trim()) return;

    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/articles/${editArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category.trim() || null,
        }),
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: 'Respuesta vacía o no válida del servidor.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar el artículo.');
      }

      setEditArticle(null);
      setEditForm({ name: '', category: '' });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo actualizar el artículo.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmArticle) return;
    setDeletingId(confirmArticle.id);
    try {
      const res = await fetch(`/api/articles/${confirmArticle.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmArticle(null);
        onRefresh();
        return;
      }

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: 'Respuesta vacía o no válida del servidor.' };
      }

      console.error(data.error || 'Error al eliminar el artículo.');
    } catch (err) {
      console.error('Error al eliminar artículo:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        articles
          .map((article) => article.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b, 'es'));

    return categories;
  }, [articles]);

  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase();
    const latestVersion = art.versions?.[0];
    const category = art.category?.trim() || '';
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    return (
      matchesCategory &&
      (
        art.name.toLowerCase().includes(q) ||
        (latestVersion?.author && latestVersion.author.toLowerCase().includes(q)) ||
        (latestVersion?.version && latestVersion.version.toLowerCase().includes(q)) ||
        (category && category.toLowerCase().includes(q))
      )
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
      <div className="flex flex-col gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por artículo, autor, versión o categoría..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto lg:justify-end">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-all"
            >
              <option value="all">Todas las categorías</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              onClick={onOpenUpload}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-criollo-600/20 hover:bg-criollo-600/30 text-criollo-300 border border-criollo-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nuevo Artículo</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {filteredArticles.length} artículo{filteredArticles.length === 1 ? '' : 's'} disponible{filteredArticles.length === 1 ? '' : 's'}
          </span>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Limpiar filtro de categoría
            </button>
          )}
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
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-criollo-300 transition-colors line-clamp-2">
                        {article.name}
                      </h3>
                      {article.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {article.category}
                        </span>
                      )}
                    </div>
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
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedArticleHistory(article)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-all"
                    >
                      <History className="w-3.5 h-3.5 text-criollo-400" />
                      <span>Historial ({versionCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(article)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  {/* Open and download latest version */}
                  {latestVer?.fileUrl ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openPreview(latestVer.fileUrl, latestVer.fileName, latestVer.mimeType)}
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>

                      <a
                        href={latestVer.fileUrl}
                        download={latestVer.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-criollo-600 hover:bg-criollo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-criollo-600/25 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-500">
                      Sin archivo
                    </div>
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

      {previewItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
              <div>
                <h3 className="text-sm font-semibold text-white">Vista previa</h3>
                <p className="text-[11px] text-slate-400 truncate max-w-md">{previewItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
            <iframe
              src={previewItem.url}
              title={previewItem.name}
              className="w-full h-full bg-white"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {editArticle && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Editar artículo</h3>
                <p className="text-xs text-slate-400">Se actualiza sin crear una nueva versión.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditArticle(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoría o fase
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Ej. Planeación, Fase 1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditArticle(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveArticleEdit}
                  disabled={isSavingEdit || !editForm.name.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-criollo-600 hover:bg-criollo-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60"
                >
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSavingEdit ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
