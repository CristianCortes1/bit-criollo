'use client';

import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

interface ArticleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingArticleNames?: string[];
}

export default function ArticleUploadModal({
  isOpen,
  onClose,
  onSuccess,
  existingArticleNames = [],
}: ArticleUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [author, setAuthor] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      // Auto-fill article name if empty based on file name
      if (!name) {
        const cleanName = droppedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

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

  // Check if article with this name already exists
  const isExistingArticle = existingArticleNames.some(
    (existingName) => existingName.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file) {
      setErrorMsg('Por favor selecciona o arrastra un archivo (.docx, .pdf o imagen).');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Ingresa el nombre del artículo.');
      return;
    }
    if (!version.trim()) {
      setErrorMsg('Ingresa la versión (ej. v1.0).');
      return;
    }
    if (!author.trim()) {
      setErrorMsg('Ingresa el nombre del autor.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());
      formData.append('version', version.trim());
      formData.append('author', author.trim());

      const res = await fetch('/api/articles', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir el artículo.');
      }

      setSuccessMsg(
        isExistingArticle
          ? `Nueva versión (${version}) añadida exitosamente al artículo "${name}".`
          : `Artículo "${name}" creado exitosamente.`
      );

      setTimeout(() => {
        // Reset state & close
        setFile(null);
        setName('');
        setVersion('v1.0');
        setAuthor('');
        setSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado al subir el archivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-criollo-500/10 text-criollo-400 rounded-xl border border-criollo-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Subir Artículo de Documentación</h2>
              <p className="text-xs text-slate-400">Archivos .docx, PDF e imágenes soportados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
              isDragging
                ? 'border-criollo-400 bg-criollo-950/40 scale-[0.99]'
                : file
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-slate-700/80 hover:border-criollo-500/50 hover:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.doc"
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center space-x-3 text-emerald-400">
                <FileText className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-semibold truncate text-slate-100">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Haz clic o arrastra para cambiar
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-slate-800/80 rounded-full flex items-center justify-center text-criollo-400 border border-slate-700">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Arrastra tu archivo aquí o <span className="text-criollo-400 underline">selecciónalo</span>
                </p>
                <p className="text-xs text-slate-400">Formatos: .docx, .pdf, imágenes (hasta 20 MB)</p>
              </div>
            )}
          </div>

          {/* Inputs Grid */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del Artículo <span className="text-criollo-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Acta de Reunión de Planificación"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-colors"
              />
              {name && isExistingArticle && (
                <div className="mt-1.5 flex items-center space-x-1.5 text-xs text-amber-400">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Artículo existente detectado. Se registrará como una <strong>nueva versión</strong>.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Versión <span className="text-criollo-400">*</span>
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Autor <span className="text-criollo-400">*</span>
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ej. Nombre del Integrante"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Automatic versioning hint */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start space-x-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-criollo-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Regla de versiones:</strong> Si el nombre coincide con un artículo existente, se agregará como una nueva versión sin sobreescribir ni eliminar las anteriores.
            </p>
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

          {/* Actions */}
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
              className="flex items-center space-x-2 px-5 py-2 bg-criollo-600 hover:bg-criollo-500 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-criollo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{isExistingArticle ? 'Subir Nueva Versión' : 'Crear Artículo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
