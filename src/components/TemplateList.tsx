'use client';

import { useState, useEffect } from 'react';
import { Download, Search, FolderArchive, Tag } from 'lucide-react';

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  file: string;
  updatedAt?: string;
}

export default function TemplateList() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plantillas');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      


      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-criollo-600 text-white shadow-md shadow-criollo-600/25'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar plantilla..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-criollo-500 focus:ring-1 focus:ring-criollo-500 transition-all"
          />
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
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3 max-w-md mx-auto my-8">
          <FolderArchive className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-base font-bold text-slate-100">No se encontraron plantillas</h3>
          <p className="text-xs text-slate-400">
            Intenta cambiar el filtro de categoría o borrar la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-card rounded-2xl p-5 border flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                
                {/* Category Badge & Title */}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Tag className="w-3 h-3 mr-1" />
                    {template.category}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                    .DOCX
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-criollo-300 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                    {template.description}
                  </p>
                </div>

              </div>

              {/* Download Action */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Formato Word</span>
                
                <a
                  href={template.file}
                  download
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
