import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardConfig, hasPermission, hasAnyPermission } from '../utils/permissions';
import { ROLES, ROLE_LABELS, PERMISSIONS } from '../utils/constants';
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
  HiOutlineChevronRight
} from 'react-icons/hi';
import toast from 'react-hot-toast';

// Helper for date formatting
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Helper for badges
const STATUS_CONFIG = {
  SOLICITADO: { label: 'Solicitado', bg: 'rgba(240, 147, 251, 0.15)', color: '#f093fb' },
  ACTIVO:     { label: 'Activo',     bg: 'rgba(0, 172, 201, 0.15)',   color: 'var(--primary-color)' },
  VENCIDO:    { label: 'Vencido',    bg: 'rgba(239, 68, 68, 0.15)',   color: '#ef4444' },
  DEVUELTO:   { label: 'Devuelto',   bg: 'rgba(128, 186, 39, 0.15)', color: 'var(--success)' },
  RECHAZADO:  { label: 'Rechazado', bg: 'rgba(239, 68, 68, 0.15)',   color: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'rgba(255,255,255,0.1)', color: 'inherit' };
  return (
    <span style={{ padding: '4px 12px', borderRadius: '20px', background: cfg.bg, color: cfg.color, fontSize: '0.78rem', fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { setHeaderContent, onOpenNewLoan } = useOutletContext();
  const [loading, setLoading] = useState(true);

  // Data states
  const [superAdminStats, setSuperAdminStats] = useState(null);
  const [loansData, setLoansData] = useState({ recent: [], activeCount: 0 });
  const [activitiesData, setActivitiesData] = useState({ recent: [], count: 0 });
  const [inventoryCount, setInventoryCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);

  const config = getDashboardConfig(user?.role);
  const permissions = user?.permissions || [];

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
  }, [user?.role, user?.first_name, setHeaderContent]);

  // Fetch all necessary data based on permissions
  useEffect(() => {
    if (!user || user.role === ROLES.STUDENT) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const promises = [];

      // 1. Super Admin Stats
      if (user.role === ROLES.SUPER_ADMIN) {
        promises.push(
          api.get('/auth/super-admin-info').then(res => setSuperAdminStats(res.data.stats)).catch(() => {})
        );
      }

      // 2. Loans Data
      if (hasAnyPermission(permissions, [PERMISSIONS.LOAN_READ_ALL])) {
        // Recent loans
        promises.push(
          api.get('/loans/?limit=5&sort_by=created_at&order=desc').then(res => {
            setLoansData(prev => ({ ...prev, recent: res.data.items }));
          }).catch(() => {})
        );
        // Active loans count
        promises.push(
          api.get('/loans/?status=ACTIVO&limit=1').then(res => {
            setLoansData(prev => ({ ...prev, activeCount: res.data.total }));
          }).catch(() => {})
        );
      }

      // 3. Activities Data
      if (hasAnyPermission(permissions, [PERMISSIONS.ACTIVITY_READ_ALL, PERMISSIONS.ACTIVITY_MANAGE])) {
        promises.push(
          api.get('/activities/?limit=5').then(res => {
            // Actividades endpoint currently returns a list, maybe we count them or just use length
            // We assume res.data is an array
            setActivitiesData({ recent: res.data.slice(0, 5), count: res.data.length });
          }).catch(() => {})
        );
      }

      // 4. Inventory Data
      if (hasAnyPermission(permissions, [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_MANAGE])) {
        promises.push(
          api.get('/inventory/').then(res => {
            setInventoryCount(res.data.length);
          }).catch(() => {})
        );
      }

      // 5. Audit Logs
      if (hasAnyPermission(permissions, [PERMISSIONS.SYSTEM_AUDIT_LOGS])) {
        promises.push(
          api.get('/audit/logs?limit=5').then(res => {
            setAuditLogs(res.data.items || []);
          }).catch(() => {})
        );
      }

      await Promise.allSettled(promises);
      setLoading(false);
    };

    fetchData();
  }, [user, permissions]);

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <div className="page-toolbar-title" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1>{config.title}</h1>
        <p>{`Hola, ${user?.first_name}. ${config.subtitle}`}</p>
      </div>

      {/* ─── STATS CARDS ────────────────────────────────────────────── */}
      {user.role === ROLES.SUPER_ADMIN && superAdminStats && (
        <div className="stats-grid stagger-children" style={{ marginBottom: '2rem' }}>
          <StatsCard label="Administradores" value={superAdminStats.total_admins} icon={HiOutlineUsers} color="#00acc9" />
          <StatsCard label="Estudiantes" value={superAdminStats.total_students} icon={HiOutlineAcademicCap} color="#80ba27" />
          <StatsCard label="Roles" value={superAdminStats.total_roles} icon={HiOutlineShieldCheck} color="#f093fb" />
          <StatsCard label="Permisos" value={superAdminStats.total_permissions} icon={HiOutlineKey} color="#4facfe" />
        </div>
      )}

      {user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.STUDENT && (
        <div className="stats-grid stagger-children" style={{ marginBottom: '2rem' }}>
          {hasAnyPermission(permissions, [PERMISSIONS.LOAN_READ_ALL]) && (
             <StatsCard label="Préstamos Activos" value={loading ? '...' : loansData.activeCount} icon={HiOutlineClipboardList} color="#00acc9" />
          )}
          {hasAnyPermission(permissions, [PERMISSIONS.ACTIVITY_READ_ALL, PERMISSIONS.ACTIVITY_MANAGE]) && (
             <StatsCard label="Actividades" value={loading ? '...' : activitiesData.count} icon={HiOutlineCalendar} color="#80ba27" />
          )}
          {hasAnyPermission(permissions, [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_MANAGE]) && (
             <StatsCard label="Inventario" value={loading ? '...' : inventoryCount} icon={HiOutlineCube} color="#f093fb" />
          )}
        </div>
      )}

      {user.role === ROLES.STUDENT && <StudentDashboardStats />}

      {/* ─── QUICK ACTIONS ──────────────────────────────────────────── */}
      {config.quickActions.length > 0 && (
        <>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Acciones Rápidas</h3>
          <div className="quick-actions-grid stagger-children" style={{ marginBottom: '2.5rem' }}>
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

      {/* ─── DATA TABLES ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* RECENT LOANS */}
        {hasAnyPermission(permissions, [PERMISSIONS.LOAN_READ_ALL]) && user.role !== ROLES.STUDENT && (
          <div className="info-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <HiOutlineClipboardList style={{ color: '#00acc9' }} /> Últimos Préstamos
              </h3>
              <Link to="/dashboard/prestamos" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Ver todos <HiOutlineChevronRight />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Implemento</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estudiante</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                  ) : loansData.recent.length === 0 ? (
                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay préstamos recientes</td></tr>
                  ) : (
                    loansData.recent.map(loan => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{loan.item?.name || '-'}</td>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{loan.student?.first_name} {loan.student?.last_name}</td>
                        <td style={{ padding: '0.85rem 1.5rem' }}><StatusBadge status={loan.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECENT ACTIVITIES */}
        {hasAnyPermission(permissions, [PERMISSIONS.ACTIVITY_READ_ALL, PERMISSIONS.ACTIVITY_MANAGE]) && user.role !== ROLES.STUDENT && (
          <div className="info-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <HiOutlineCalendar style={{ color: '#80ba27' }} /> Actividades Recientes
              </h3>
              <Link to="/dashboard/actividades" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Ver todas <HiOutlineChevronRight />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actividad</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                  ) : activitiesData.recent.length === 0 ? (
                    <tr><td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay actividades</td></tr>
                  ) : (
                    activitiesData.recent.map(act => (
                      <tr key={act.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{act.title}</td>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(act.date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECENT AUDIT LOGS */}
        {hasAnyPermission(permissions, [PERMISSIONS.SYSTEM_AUDIT_LOGS]) && user.role !== ROLES.STUDENT && (
          <div className="info-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <HiOutlineShieldCheck style={{ color: '#4facfe' }} /> Últimas Acciones
              </h3>
              <Link to="/dashboard/auditoria" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Ver auditoría <HiOutlineChevronRight />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                    <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay acciones recientes</td></tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.user_email}</td>
                        <td style={{ padding: '0.85rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(log.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── ACCOUNT INFO PANEL ─────────────────────────────────────── */}
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
      <div className="stats-grid stagger-children" style={{ marginBottom: '2rem' }}>
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

      {!loading && hoursRequired > 0 && (
        <div className="info-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Progreso de Horas Sociales</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{hoursCompleted}h</strong> / {hoursRequired}h
            </span>
          </div>
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
