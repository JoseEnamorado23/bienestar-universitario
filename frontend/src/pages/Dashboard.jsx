import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// ... existing imports ...
import { getDashboardConfig } from '../utils/permissions';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import StatsCard from '../components/cards/StatsCard';
import QuickAction from '../components/cards/QuickAction';
import api from '../api/axios';
import {
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCube,
} from 'react-icons/hi';

export default function Dashboard() {
  const { user } = useAuth();
  const { setHeaderContent, onOpenNewLoan } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const config = getDashboardConfig(user?.role);

  const handleActionClick = (action) => {
    if (action.path === 'modal:new-loan') {
      onOpenNewLoan();
    }
  };

  useEffect(() => {
    if (setHeaderContent && config) {
      setHeaderContent({
        title: config.title,
        subtitle: `Hola, ${user?.first_name}. ${config.subtitle}`
      });
    }
    // We only want to run this when the role or name changes, 
    // or when the header setter becomes available.
  }, [user?.role, user?.first_name, setHeaderContent]);

  // Fetch system stats for super_admin
  useEffect(() => {
    if (user?.role === ROLES.SUPER_ADMIN) {
      setLoadingStats(true);
      api
        .get('/auth/super-admin-info')
        .then(({ data }) => setStats(data.stats))
        .catch(() => setStats(null))
        .finally(() => setLoadingStats(false));
    }
  }, [user?.role]);

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      {user.role === ROLES.SUPER_ADMIN && stats && (
        <div className="stats-grid stagger-children">
          <StatsCard
            label="Administradores"
            value={stats.total_admins}
            icon={HiOutlineUsers}
            color="#00acc9"
          />
          <StatsCard
            label="Estudiantes"
            value={stats.total_students}
            icon={HiOutlineAcademicCap}
            color="#80ba27"
          />
          <StatsCard
            label="Roles"
            value={stats.total_roles}
            icon={HiOutlineShieldCheck}
            color="#f093fb"
          />
          <StatsCard
            label="Permisos"
            value={stats.total_permissions}
            icon={HiOutlineKey}
            color="#4facfe"
          />
        </div>
      )}

      {/* Admin stats for non-super admins */}
      {user.role === ROLES.ADMIN_FULL && (
        <div className="stats-grid stagger-children">
          <StatsCard
            label="Préstamos Activos"
            value="—"
            icon={HiOutlineClipboardList}
            color="#00acc9"
            change="Módulo próximamente"
          />
          <StatsCard
            label="Actividades"
            value="—"
            icon={HiOutlineCalendar}
            color="#80ba27"
            change="Módulo próximamente"
          />
          <StatsCard
            label="Inventario"
            value="—"
            icon={HiOutlineCube}
            color="#f093fb"
            change="Módulo próximamente"
          />
          <StatsCard
            label="Horas Sociales"
            value="—"
            icon={HiOutlineClock}
            color="#4facfe"
            change="Módulo próximamente"
          />
        </div>
      )}

      {/* Loans admin stats */}
      {user.role === ROLES.ADMIN_LOANS && (
        <div className="stats-grid stagger-children">
          <StatsCard
            label="Préstamos Activos"
            value="—"
            icon={HiOutlineClipboardList}
            color="#00acc9"
            change="Módulo próximamente"
          />
          <StatsCard
            label="Inventario"
            value="—"
            icon={HiOutlineCube}
            color="#80ba27"
            change="Módulo próximamente"
          />
        </div>
      )}

      {/* Activities admin stats */}
      {user.role === ROLES.ADMIN_ACTIVITIES && (
        <div className="stats-grid stagger-children">
          <StatsCard
            label="Actividades"
            value="—"
            icon={HiOutlineCalendar}
            color="#00acc9"
            change="Módulo próximamente"
          />
          <StatsCard
            label="Horas Sociales"
            value="—"
            icon={HiOutlineClock}
            color="#80ba27"
            change="Módulo próximamente"
          />
        </div>
      )}

      {/* Student stats */}
      {user.role === ROLES.STUDENT && (
        <StudentDashboardStats />
      )}

      {/* Quick Actions */}
      {config.quickActions.length > 0 && (
        <>
          <h3 className="quick-actions-title">Acciones Rápidas</h3>
          <div className="quick-actions-grid stagger-children">
            {config.quickActions.map((action, idx) => (
              <QuickAction
                key={idx}
                label={action.label}
                path={action.path}
                icon={action.icon}
                color={action.color}
                onClick={() => handleActionClick(action)}
              />
            ))}
          </div>
        </>
      )}

      {/* User info panel */}
      <div className="info-panel">
        <h3>Información de Cuenta</h3>
        <div className="info-row">
          <span className="info-row-label">Nombre completo</span>
          <span className="info-row-value">
            {user.first_name} {user.last_name}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Email</span>
          <span className="info-row-value">{user.email}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Rol</span>
          <span className="info-row-value">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Estado</span>
          <span className="info-row-value" style={{ color: user.status === 'ACTIVE' ? '#4ade80' : '#f87171' }}>
            {user.status === 'ACTIVE' ? '● Activo' : user.status}
          </span>
        </div>
        {user.is_verified !== undefined && (
          <div className="info-row">
            <span className="info-row-label">Email verificado</span>
            <span className="info-row-value" style={{ color: user.is_verified ? '#4ade80' : '#fbbf24' }}>
              {user.is_verified ? '✓ Verificado' : '✗ Sin verificar'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Student Dashboard Stats ─────────────────────────────────── */
function StudentDashboardStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/student-profile')
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const hoursCompleted = data?.social_hours_completed ?? 0;
  const hoursRequired  = data?.social_hours_required  ?? 0;
  const activeLoans    = data?.active_loans           ?? 0;
  const pct = hoursRequired > 0 ? Math.min((hoursCompleted / hoursRequired) * 100, 100) : 0;
  const hoursLeft = Math.max(hoursRequired - hoursCompleted, 0);

  const barColor = pct >= 100 ? '#80ba27' : pct >= 60 ? '#00acc9' : '#f093fb';

  return (
    <>
      {/* Stat cards */}
      <div className="stats-grid stagger-children">
        <StatsCard
          label="Horas Completadas"
          value={loading ? '…' : `${hoursCompleted}h`}
          icon={HiOutlineClock}
          color="#00acc9"
          change={loading ? '' : hoursRequired > 0 ? `Meta: ${hoursRequired}h` : 'Sin meta configurada'}
        />
        <StatsCard
          label="Préstamos Activos"
          value={loading ? '…' : activeLoans}
          icon={HiOutlineClipboardList}
          color="#80ba27"
          change={activeLoans > 0 ? 'En curso' : 'Ninguno activo'}
        />
      </div>

      {/* Progress bar */}
      {!loading && hoursRequired > 0 && (
        <div className="info-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Progreso de Horas Sociales</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{hoursCompleted}h</strong> / {hoursRequired}h
            </span>
          </div>

          {/* Bar container */}
          <div style={{ height: '14px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
              borderRadius: '99px',
              transition: 'width 0.8s ease',
              boxShadow: `0 0 8px ${barColor}66`
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>{pct.toFixed(0)}% completado</span>
            {pct < 100
              ? <span>Faltan <strong style={{ color: barColor }}>{hoursLeft}h</strong> para completar tu meta</span>
              : <span style={{ color: '#80ba27', fontWeight: 600 }}>🎉 ¡Meta alcanzada!</span>
            }
          </div>
        </div>
      )}
    </>
  );
}
