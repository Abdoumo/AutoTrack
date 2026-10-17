import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activityUser, setActivityUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setFormError('');
  };

  const handleViewActivity = async (user) => {
    setActivityUser(user);
    try {
      setActivityLoading(true);
      const activityData = await api.getUserActivity(user.id);
      setUserActivity(activityData);
    } catch (err) {
      console.error('Failed to load activity', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Le nom et l’email sont requis.');
      return;
    }

    try {
      setFormSaving(true);
      setFormError('');

      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        setEditingUser(null);
      } else {
        if (!formData.password || formData.password.length < 6) {
          setFormError('Le mot de passe doit comporter au moins 6 caractères.');
          setFormSaving(false);
          return;
        }
        await api.createUser(formData);
        setIsCreateOpen(false);
      }
      await loadUsers();
    } catch (err) {
      setFormError(err.message || 'Opération échouée');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Supprimer le compte "${user.name}" (${user.email}) ?`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Échec de la suppression');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '4px 0 40px 0' }}>
      {/* Header and Add User Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: '#818cf8',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Identités & Analyse Comportementale
          </span>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '2px' }}>
            {t('user_analytics_title')}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {t('user_analytics_subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadUsers}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {t('refresh')}
          </button>

          <button
            id="add-user-btn"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            {t('create_user_btn')}
          </button>
        </div>
      </div>

      {/* Directory Table Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {/* Table Toolbar */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {t('registered_accounts')}
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {filteredUsers.length} compte(s)
            </span>
          </div>

          <input
            className="field-input"
            style={{ width: '100%', maxWidth: '240px', padding: '6px 10px', fontSize: '12px' }}
            placeholder={t('search_users')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* User Table */}
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Chargement des utilisateurs...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_user')}</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_role')}</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_products_created')}</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_stock_claimed')}</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_joined')}</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span className={`pill ${u.role === 'admin' ? 'pill-active' : 'pill-muted'}`} style={{ fontSize: '10px' }}>
                        <span className={`status-dot ${u.role === 'admin' ? 'status-dot-active' : 'status-dot-muted'}`} />
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {u.products_created_count || 0}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: parseFloat(u.total_quantity_claimed || 0) > 0 ? '#818cf8' : 'var(--text-muted)',
                        fontWeight: '600',
                      }}>
                        {u.total_quantity_claimed || 0}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                        {u.transactions_count || 0} réclamation(s)
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleViewActivity(u)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          {t('btn_activity')}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          {t('btn_edit')}
                        </button>
                        {u.email !== 'bedoushop@gmail.com' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            {t('btn_delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {(isCreateOpen || Boolean(editingUser)) && (
        <div className="modal-overlay" onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {editingUser ? t('modal_edit_user') : t('modal_create_user')}
                </h3>
              </div>
              <button
                onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '20px', padding: '4px' }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                marginBottom: '14px',
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveUser}>
              <div className="field-group">
                <label className="field-label" htmlFor="user-name">{t('full_name')}</label>
                <input
                  id="user-name"
                  className="field-input"
                  placeholder="e.g. Layla Ahmed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="user-email">{t('email_address')}</label>
                <input
                  id="user-email"
                  type="email"
                  className="field-input"
                  placeholder="e.g. layla@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="user-role">{t('role_label')}</label>
                <select
                  id="user-role"
                  className="field-input"
                  style={{ background: 'var(--bg-input)' }}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">Utilisateur Standard (Peut enregistrer et prendre du stock)</option>
                  <option value="admin">Administrateur (Gestion complète, export CSV, alertes)</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="user-password">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour conserver)' : t('password_label')}
                </label>
                <input
                  id="user-password"
                  type="password"
                  className="field-input"
                  placeholder={editingUser ? '••••••••' : 'Minimum 6 caractères'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}
                >
                  {t('cancel')}
                </button>
                <button
                  id="submit-user-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={formSaving}
                >
                  {formSaving ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer Utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER ACTIVITY AUDIT MODAL */}
      {activityUser && (
        <div className="modal-overlay" onClick={() => setActivityUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#818cf8', textTransform: 'uppercase' }}>
                  {t('audit_user_activity')}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {activityUser.name} ({activityUser.email})
                </h3>
              </div>
              <button
                onClick={() => setActivityUser(null)}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '20px', padding: '4px' }}
              >
                ×
              </button>
            </div>

            {activityLoading || !userActivity ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Chargement de l’historique...
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '18px',
                }}>
                  <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('metric_captured')}</span>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {userActivity.summary.total_products_created}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('metric_claims')}</span>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {userActivity.summary.total_claims_made}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('metric_qty_taken')}</span>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#818cf8', marginTop: '2px' }}>
                      {userActivity.summary.total_quantity_claimed}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('claims_history')}
                  </h4>
                  {userActivity.transactions.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      Aucune réclamation de stock effectuée.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {userActivity.transactions.map((transItem) => (
                        <div key={transItem.id} style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                        }}>
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{transItem.product_name}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                              {new Date(transItem.taken_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span style={{
                            background: 'rgba(93, 95, 239, 0.15)',
                            color: '#818cf8',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '600',
                          }}>
                            {transItem.quantity_taken} {transItem.unit || 'kg'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('created_products_history')}
                  </h4>
                  {userActivity.products_created.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      Aucun produit créé par cet utilisateur.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {userActivity.products_created.map((prodItem) => (
                        <div key={prodItem.id} style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                        }}>
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{prodItem.name}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                              {prodItem.remaining_qty} / {prodItem.quantity || prodItem.weight} {prodItem.unit || 'kg'}
                            </span>
                          </div>
                          <span className={`pill ${prodItem.status === 'expired' ? 'pill-danger' : 'pill-active'}`} style={{ fontSize: '9px' }}>
                            {prodItem.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setActivityUser(null)}
              >
                {t('close_audit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
