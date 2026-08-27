'use client';

import Link from 'next/link';
import { useMemo, useState, MouseEvent } from 'react';
import { Download, Search, FolderArchive, Tag, Trash2, PlusCircle, Loader2, Eye, Pencil, Save, X, ArrowUpRight, Layers } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  fase?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  previewUrl?: string;
  previewFileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateListProps {
  onOpenUpload: () => void;
  templates: TemplateItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const buildTemplatePath = (template: TemplateItem) => {
  const category = template.category || 'plantilla';
  const title = template.name || 'documento';
  return `${toSlug(category)}-${toSlug(title)}`;
};

export default function TemplateList({
  onOpenUpload,
  templates,
  isLoading,
  onRefresh,
}: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTemplate, setConfirmTemplate] = useState<TemplateItem | null>(null);

  // Edit Template State
  const [editTemplate, setEditTemplate] = useState<TemplateItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', fase: '', description: '' });
  const [editPreviewFile, setEditPreviewFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Categories list
  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        templates
          .map((t) => t.category?.trim())
          .filter((cat): cat is string => Boolean(cat))
      )
    ).sort((a, b) => a.localeCompare(b, 'es'));

    return categories;
  }, [templates]);

  // Dynamic Phase options list
  const phaseOptions = useMemo(() => {
    const phases = Array.from(
      new Set(
        templates
          .map((t) => t.fase?.trim())
          .filter((f): f is string => Boolean(f))
      )
    ).sort((a, b) => a.localeCompare(b, 'es'));

    return phases;
  }, [templates]);

  // Filter logic
  const filteredTemplates = templates.filter((t) => {
    const q = searchQuery.toLowerCase();
    const cat = t.category?.trim() || '';
    const phase = t.fase?.trim() || '';

    const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
    const matchesPhase = selectedPhase === 'all' || phase === selectedPhase;

    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (cat && cat.toLowerCase().includes(q)) ||
      (phase && phase.toLowerCase().includes(q));

    return matchesCategory && matchesPhase && matchesSearch;
  });

  const openEditModal = (template: TemplateItem) => {
    setEditTemplate(template);
    setEditForm({
      name: template.name,
      category: template.category || '',
      fase: template.fase || '',
      description: template.description || '',
    });
    setEditPreviewFile(null);
  };

  const saveTemplateEdit = async () => {
    if (!editTemplate) return;
    if (!editForm.name.trim()) return;

    setIsSavingEdit(true);

    try {
      let res: Response;
      if (editPreviewFile) {
        const formData = new FormData();
        formData.append('name', editForm.name.trim());
        formData.append('category', editForm.category.trim() || 'General');
        formData.append('fase', editForm.fase.trim());
        formData.append('description', editForm.description.trim());
        formData.append('previewFile', editPreviewFile);

        res = await fetch(`/api/plantillas/${editTemplate.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`/api/plantillas/${editTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editForm.name.trim(),
            category: editForm.category.trim() || 'General',
            fase: editForm.fase.trim(),
            description: editForm.description.trim(),
          }),
        });
      }

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: 'Respuesta vacía o no válida del servidor.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar la plantilla.');
      }

      setEditTemplate(null);
      setEditForm({ name: '', category: '', fase: '', description: '' });
      setEditPreviewFile(null);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo actualizar la plantilla.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenDeleteConfirm = (template: TemplateItem, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setConfirmTemplate(template);
  };

  const handleDelete = async () => {
    if (!confirmTemplate) return;
    const id = confirmTemplate.id;
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
    <>
      <div className="space-y-6">
        
        {/* Top Controls: Search & Category Filter */}
        <div className="flex flex-col gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por plantilla, descripción o categoría..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Category & Phase Select & New Template Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto lg:justify-end">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                <option value="all">Todas las categorías</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="all">Todas las fases</option>
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenUpload}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva Plantilla</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              {filteredTemplates.length} plantilla{filteredTemplates.length === 1 ? '' : 's'} disponible{filteredTemplates.length === 1 ? '' : 's'}
            </span>
            {(selectedCategory !== 'all' || selectedPhase !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedPhase('all');
                }}
                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-slate-900/40 rounded-2xl border border-slate-800/60 animate-pulse p-5 space-y-3">
                <div className="h-5 bg-slate-800 rounded w-2/3"></div>
                <div className="h-4 bg-slate-800/60 rounded w-full"></div>
                <div className="h-10 bg-slate-800/40 rounded mt-8"></div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto my-8">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <FolderArchive className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No se encontraron plantillas'
                  : 'Aún no hay plantillas guardadas'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Intenta buscando con otro término o limpia los filtros.'
                  : 'Sube la primera plantilla oficial utilizando el botón de arriba.'}
              </p>
            </div>
            {!(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Subir Primer Plantilla</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const downloadUrl = template.fileUrl || '#';
              const isDeleting = deletingId === template.id;

              return (
                <div
                  key={template.id}
                  className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4 group hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    
                    {/* Title & Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Link
                          href={`/plantillas/${buildTemplatePath(template)}`}
                          className="group/link inline-flex items-center gap-1.5 text-base font-bold text-slate-100 hover:text-emerald-300 transition-colors line-clamp-2"
                        >
                          <span>{template.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover/link:opacity-100 transition-opacity" />
                        </Link>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {template.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <Tag className="w-3 h-3 mr-1" />
                              {template.category}
                            </span>
                          )}
                          {template.fase && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              <Layers className="w-3 h-3 mr-1" />
                              {template.fase}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteConfirm(template, e)}
                        disabled={isDeleting}
                        title="Eliminar plantilla"
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Description Text */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {template.description || 'Sin descripción'}
                    </p>

                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/plantillas/${buildTemplatePath(template)}`}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Vista previa</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => openEditModal(template)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <a
                        href={downloadUrl}
                        download={template.fileName || `${template.name}`}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Edit Template Modal */}
        {editTemplate && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Editar plantilla</h3>
                  <p className="text-xs text-slate-400">Actualiza los datos directamente (sin historial).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditTemplate(null)}
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
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Ej. Actas, Bitácoras"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fase
                  </label>
                  <input
                    type="text"
                    value={editForm.fase}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fase: e.target.value }))}
                    placeholder="Ej. Fase 1, Planeación, Evaluación"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Actualizar Vista Previa (Imagen o PDF) <span className="text-slate-500">(Opcional)</span>
                  </label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf"
                    onChange={(e) => setEditPreviewFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditTemplate(null)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveTemplateEdit}
                    disabled={isSavingEdit || !editForm.name.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60"
                  >
                    {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSavingEdit ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            </div>
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

