import { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SettingsModal from '../modals/SettingsModal';
import NewLoanModal from '../modals/NewLoanModal';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [headerContent, setHeaderContent] = useState({
    title: 'Sistema de Bienestar',
    subtitle: 'Universidad — Panel de Control'
  });

  const outletContext = useMemo(() => ({ 
    setHeaderContent,
    onOpenNewLoan: () => setIsNewLoanOpen(true)
  }), [setHeaderContent]);

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenNewLoan={() => setIsNewLoanOpen(true)}
      />
      <div className="main-content">
        <Header 
          title={headerContent?.title || 'Sistema de Bienestar'}
          subtitle={headerContent?.subtitle || 'Universidad — Panel de Control'}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <div className="page-content">
          <Outlet context={outletContext} />
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NewLoanModal isOpen={isNewLoanOpen} onClose={() => setIsNewLoanOpen(false)} />
    </div>
  );
}
