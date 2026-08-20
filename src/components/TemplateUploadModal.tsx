'use client';

import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Eye } from 'lucide-react';

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_CATEGORIES = ['Actas', 'Bitácoras', 'Reportes', 'Arquitectura', 'Guías'];

export default function TemplateUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: TemplateUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Actas');
  const [customCategory, setCustomCategory] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handlePreviewFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPreviewFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalCategory = category === 'Otro' ? customCategory.trim() : category;

    if (!file) {
      setErrorMsg('Por favor selecciona el archivo de la plantilla (.docx, .xlsx).');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Ingresa el nombre de la plantilla.');
      return;
    }
    if (!finalCategory) {
      setErrorMsg('Selecciona o ingresa una categoría.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (previewFile) {
        formData.append('previewFile', previewFile);
      }
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('category', finalCategory);

      const res = await fetch('/api/plantillas', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la plantilla.');
      }

      setSuccessMsg(`Plantilla "${name}" añadida exitosamente.`);

      setTimeout(() => {
        setFile(null);
        setPreviewFile(null);
        setName('');
        setDescription('');
        setCategory('Actas');
        setCustomCategory('');
        setSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al subir la plantilla.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Subir Nueva Plantilla Oficial</h2>
              <p className="text-xs text-slate-400">Adjunta la plantilla (.docx, .xlsx) y opcionalmente su vista previa (Imagen o PDF)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Dual File Upload Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Main Document Dropzone (.docx, .xlsx) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Archivo Plantilla (.docx, .xlsx) <span className="text-emerald-400">*</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files?.[0]) {
                    const f = e.dataTransfer.files[0];
                    setFile(f);
                    if (!name) {
                      const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                      setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                    }
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 min-h-[120px] flex items-center justify-center ${
                  isDraggingFile
                    ? 'border-emerald-400 bg-emerald-950/40'
                    : file
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".docx,.doc,.xlsx,.xls,.csv"
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center space-x-2 text-emerald-400 overflow-hidden">
                    <FileText className="w-6 h-6 flex-shrink-0" />
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-semibold truncate text-slate-100">{file.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Clic para cambiar
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 mx-auto text-emerald-400" />
                    <p className="text-xs font-medium text-slate-200">
                      Subir <span className="text-emerald-400 underline">Word (.docx) o Excel (.xlsx)</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Documento oficial</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Optional Preview File Dropzone (Image or PDF) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Vista Previa (Imagen o PDF) <span className="text-slate-500">(Opcional)</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingPreview(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingPreview(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPreview(false);
                  if (e.dataTransfer.files?.[0]) {
                    setPreviewFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => previewInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 min-h-[120px] flex items-center justify-center ${
                  isDraggingPreview
                    ? 'border-emerald-400 bg-emerald-950/40'
                    : previewFile
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="file"
                  ref={previewInputRef}
                  onChange={handlePreviewFileSelect}
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  className="hidden"
                />

                {previewFile ? (
                  <div className="flex items-center space-x-2 text-emerald-400 overflow-hidden">
                    <ImageIcon className="w-6 h-6 flex-shrink-0" />
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-semibold truncate text-slate-100">{previewFile.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(previewFile.size / (1024 * 1024)).toFixed(2)} MB • Clic para cambiar
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Eye className="w-5 h-5 mx-auto text-slate-400" />
                    <p className="text-xs font-medium text-slate-300">
                      Subir <span className="text-emerald-400 underline">Imagen o PDF</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Para visualización previa</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre de la Plantilla <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Acta de Reunión Oficial"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Categoría <span className="text-emerald-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[...DEFAULT_CATEGORIES, 'Otro'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      category === cat
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {category === 'Otro' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Escribe el nombre de la nueva categoría"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors mt-2"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción del propósito y uso de esta plantilla..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Guardar Plantilla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
