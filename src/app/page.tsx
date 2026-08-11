'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ArticleList from '@/components/ArticleList';
import TemplateList, { TemplateItem } from '@/components/TemplateList';
import ArticleUploadModal from '@/components/ArticleUploadModal';
import TemplateUploadModal from '@/components/TemplateUploadModal';
import { ArticleItem } from '@/components/VersionHistoryModal';
import { FileText, FolderArchive, Layers, Heart } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'articles' | 'templates'>('articles');
  const [isArticleUploadOpen, setIsArticleUploadOpen] = useState(false);
  const [isTemplateUploadOpen, setIsTemplateUploadOpen] = useState(false);

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const fetchArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error('Error al cargar artículos:', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch('/api/plantillas');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchTemplates();
  }, []);

  const existingArticleNames = articles.map((a) => a.name);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-criollo-500 selection:text-white">
      <div>
        {/* Navbar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenUpload={() => setIsArticleUploadOpen(true)}
          onOpenTemplateUpload={() => setIsTemplateUploadOpen(true)}
        />

        {/* Main Content Body */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Hero Section Banner */}
          <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-criollo-950/60 shadow-2xl">
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-criollo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-criollo-500/10 text-criollo-400 border border-criollo-500/20">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bit Criollo Docs Hub</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeTab === 'articles'
                    ? 'Gestión de Artículos & Control de Versiones'
                    : 'Repositorio de Plantillas Oficiales (.docx)'}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeTab === 'articles'
                    ? 'Sube documentos (.docx, PDF e imágenes), consulta la versión más reciente o revisa el historial completo de versiones de cualquier artículo del equipo.'
                    : 'Sube y descarga plantillas estandarizadas de actas de reunión, bitácoras y reportes para el equipo Bit Criollo.'}
                </p>
              </div>

              {/* Quick Navigation Stats Pill */}
              <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('articles')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'articles'
                      ? 'bg-criollo-600 text-white shadow-lg shadow-criollo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{articles.length} Artículos</span>
                </button>

                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'templates'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{templates.length} Plantillas</span>
                </button>
              </div>

            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'articles' ? (
            <ArticleList
              articles={articles}
              isLoading={isLoadingArticles}
              onOpenUpload={() => setIsArticleUploadOpen(true)}
            />
          ) : (
            <TemplateList
              templates={templates}
              isLoading={isLoadingTemplates}
              onOpenUpload={() => setIsTemplateUploadOpen(true)}
              onRefresh={fetchTemplates}
            />
          )}

        </main>
      </div>

      {/* Upload Modals */}
      <ArticleUploadModal
        isOpen={isArticleUploadOpen}
        onClose={() => setIsArticleUploadOpen(false)}
        onSuccess={fetchArticles}
        existingArticleNames={existingArticleNames}
      />

      <TemplateUploadModal
        isOpen={isTemplateUploadOpen}
        onClose={() => setIsTemplateUploadOpen(false)}
        onSuccess={fetchTemplates}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">Bit Criollo</span>
            <span>• Herramienta Interna de Documentación</span>
          </div>

          <div className="flex items-center space-x-1 text-slate-500">
            <span>Desarrollado para la Plataforma de Educación Virtual</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-1" />
          </div>
        </div>
      </footer>
    </div>
  );
}
