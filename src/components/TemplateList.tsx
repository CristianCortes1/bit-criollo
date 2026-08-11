'use client';

import { MouseEvent, useState } from 'react';
import { Download, Search, FolderArchive, Tag, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  fileUrl?: string;
  file?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateListProps {
  onOpenUpload: () => void;
  templates: TemplateItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TemplateList({
  onOpenUpload,
  templates,
  isLoading,
  onRefresh,
}: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTemplate, setConfirmTemplate] = useState<TemplateItem | null>(null);

  // Get unique categories
  const categories = ['Todos', ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenDeleteConfirm = (template: TemplateItem, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmTemplate(template);
  };

  const handleDelete = async () => {
    if (!confirmTemplate) return;
    const id = confirmTemplate.id;
    const name = confirmTemplate.name;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/plantillas/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmTemplate(null);
        onRefresh();
      } else {
        const data = await res.json();
        console.error(data.error || 'Error al eliminar la plantilla.');
      }
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
    <div className="space-y-6">
      
      {/* Header controls & Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right side controls: Search & Upload button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar plantilla..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Subir Plantilla</span>
          </button>
        </div>

      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900/40 rounded-2xl border border-slate-800/60 animate-pulse p-5 space-y-3">
              <div className="h-5 bg-slate-800 rounded w-2/3"></div>
              <div className="h-4 bg-slate-800/60 rounded w-full"></div>
              <div className="h-8 bg-slate-800/40 rounded mt-6"></div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto my-8">
          <FolderArchive className="w-12 h-12 mx-auto text-slate-500" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">No hay plantillas registradas</h3>
            <p className="text-xs text-slate-400">
              {searchQuery || selectedCategory !== 'Todos'
                ? 'Intenta cambiar el filtro de categoría o borrar la búsqueda.'
                : 'Sube la primera plantilla oficial utilizando el botón de arriba.'}
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Subir Plantilla Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => {
            const downloadUrl = template.fileUrl || template.file || '#';
            const isDeleting = deletingId === template.id;

            return (
              <div
                key={template.id}
                className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4 group hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  
                  {/* Category Badge, File format & Delete Button */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Tag className="w-3 h-3 mr-1" />
                      {template.category}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                        Documento
                      </span>
                      
                      {/* Delete action */}
                      <button
                        type="button"
                        onClick={(event) => handleOpenDeleteConfirm(template, event)}
                        disabled={isDeleting}
                        title="Eliminar plantilla"
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {template.description || 'Sin descripción'}
                    </p>
                  </div>

                </div>

                {/* Download Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Oficial'}
                  </span>
                  
                  <a
                    href={downloadUrl}
                    download
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>

      {/* Confirm Delete Template Modal */}
      <ConfirmModal
        isOpen={!!confirmTemplate}
        title="¿Eliminar plantilla?"
        message={`Estás a punto de eliminar la plantilla "${confirmTemplate?.name}". Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar plantilla"
        isLoading={deletingId === confirmTemplate?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTemplate(null)}
      />
    </>
  );
}

