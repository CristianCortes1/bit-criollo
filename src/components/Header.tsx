'use client';

import Image from 'next/image';
import { FileText, FolderArchive, PlusCircle, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'articles' | 'templates';
  setActiveTab: (tab: 'articles' | 'templates') => void;
  onOpenUpload: () => void;
  onOpenTemplateUpload: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenTemplateUpload,
}: HeaderProps) {
  const isArticles = activeTab === 'articles';

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group w-12 h-12">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-criollo-500 to-brand-accent rounded-full blur-sm opacity-50 group-hover:opacity-80 transition duration-300"></div>
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700/60">
                <Image
                  src="/images/logo.png"
                  alt="Bit Criollo Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-criollo-300 bg-clip-text text-transparent tracking-tight">
                  Bit Criollo
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-criollo-500/10 text-criollo-400 border border-criollo-500/20">
                  <Sparkles className="w-3 h-3 mr-1 text-criollo-400" />
                  Equipo Interno
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Plataforma Centralizada de Documentación & Plantillas
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
            
            {/* Tabs */}
            <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('articles')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isArticles
                    ? 'bg-criollo-600 text-white shadow-md shadow-criollo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Artículos</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isArticles
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FolderArchive className="w-4 h-4" />
                <span>Plantillas</span>
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={isArticles ? onOpenUpload : onOpenTemplateUpload}
              className={`flex items-center space-x-2 px-4 py-2 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 ${
                isArticles
                  ? 'bg-gradient-to-r from-criollo-500 to-criollo-600 hover:from-criollo-400 hover:to-criollo-500 shadow-criollo-600/30'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isArticles ? 'Subir Artículo' : 'Subir Plantilla'}</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
