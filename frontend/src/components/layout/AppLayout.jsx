import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../common/Toast';
import { useApp } from '../../context/AppContext';

export const AppLayout = ({ children }) => {
  const { toast, setToast } = useApp();

  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans text-slate-900">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Notificaciones Globales */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
