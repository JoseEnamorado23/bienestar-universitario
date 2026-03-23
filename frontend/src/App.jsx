import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/users/UserManagement';
import StudentManagement from './pages/users/StudentManagement';
import CreateAdmin from './pages/users/CreateAdmin';
import AdminPermissions from './pages/users/AdminPermissions';
import RoleManagement from './pages/users/RoleManagement';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import Unauthorized from './pages/Unauthorized';
import InventoryManagement from './pages/inventory/InventoryManagement';
import StudentInventory from './pages/student/StudentInventory';
import StudentLoans from './pages/student/StudentLoans';
import StudentActivities from './pages/student/StudentActivities';
import LoanManagement from './pages/loans/LoanManagement';
import LoanKanbanBoard from './pages/loans/LoanKanbanBoard';
import ActivityManagement from './pages/activities/ActivityManagement';
import ActivityForm from './pages/activities/ActivityForm';
import PublicQRView from './pages/activities/PublicQRView';
import SocialHours from './pages/hours/SocialHours';
import AuditLog from './pages/users/AuditLog';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'toast-custom',
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/actividad-qr-publico/:id" element={<PublicQRView />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={
              <ProtectedRoute requiredPermissions={['user:create:admin', 'user:read:all']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="estudiantes" element={
              <ProtectedRoute requiredPermissions={['user:read:all']}>
                <StudentManagement />
              </ProtectedRoute>
            } />
            <Route path="crear-admin" element={
              <ProtectedRoute requiredPermissions={['user:create:admin']}>
                <CreateAdmin />
              </ProtectedRoute>
            } />
            <Route path="usuarios/permisos/:userId" element={
              <ProtectedRoute requiredPermissions={['user:create:admin']}>
                <AdminPermissions />
              </ProtectedRoute>
            } />
            {/* Placeholder routes for future modules */}
            <Route path="roles" element={
              <ProtectedRoute requiredPermissions={['user:create:admin']}>
                <RoleManagement />
              </ProtectedRoute>
            } />
            <Route path="prestamos" element={
              <ProtectedRoute requiredPermissions={['loan:read:all']}>
                <LoanManagement />
              </ProtectedRoute>
            } />
            <Route path="prestamos/tablero" element={
              <ProtectedRoute requiredPermissions={['loan:read:all']}>
                <LoanKanbanBoard />
              </ProtectedRoute>
            } />
            <Route path="implementos" element={
              <ProtectedRoute requiredPermissions={['loan:read:own']}>
                <StudentInventory />
              </ProtectedRoute>
            } />
            <Route path="mis-prestamos" element={
              <ProtectedRoute requiredPermissions={['loan:read:own']}>
                <StudentLoans />
              </ProtectedRoute>
            } />
            <Route path="inventario" element={
              <ProtectedRoute requiredPermissions={['inventory:manage', 'inventory:read']}>
                <InventoryManagement />
              </ProtectedRoute>
            } />
            <Route path="actividades" element={
              <ProtectedRoute requiredPermissions={['activity:manage']}>
                <ActivityManagement />
              </ProtectedRoute>
            } />
            <Route path="actividades/nueva" element={
              <ProtectedRoute requiredPermissions={['activity:manage']}>
                <ActivityForm />
              </ProtectedRoute>
            } />
            <Route path="actividades/editar/:id" element={
              <ProtectedRoute requiredPermissions={['activity:manage']}>
                <ActivityForm />
              </ProtectedRoute>
            } />
            <Route path="mis-actividades" element={
              <ProtectedRoute requiredPermissions={['activity:read:own']}>
                <StudentActivities />
              </ProtectedRoute>
            } />
            <Route path="horas" element={<SocialHours />} />
            <Route path="reportes" element={<PlaceholderPage title="Reportes" />} />
            <Route path="auditoria" element={
              <ProtectedRoute requiredPermissions={['system:audit_logs']}>
                <AuditLog />
              </ProtectedRoute>
            } />
            <Route path="perfil" element={<Profile />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * Placeholder for module pages that will be built later
 */
function PlaceholderPage({ title }) {
  const { setHeaderContent } = useOutletContext();
  
  useEffect(() => {
    if (setHeaderContent) {
      setHeaderContent({
        title,
        subtitle: 'Este módulo está en desarrollo. Pronto estará disponible.'
      });
    }
  }, [setHeaderContent, title]);

  return (
    <div className="animate-fade-in">
      <div className="info-panel" style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>🚧</div>
        <h3 style={{ marginBottom: '8px' }}>Próximamente</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          La funcionalidad de <strong>{title}</strong> será implementada en la próxima fase.
        </p>
      </div>
    </div>
  );
}
