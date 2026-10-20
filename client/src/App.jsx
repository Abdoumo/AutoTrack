import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import AlertBanner from './components/AlertBanner';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import TakeModal from './components/TakeModal';
import RiskAdjustModal from './components/RiskAdjustModal';
import AdminConsole from './components/AdminConsole';
import UserManagement from './components/UserManagement';
import LoginScreen from './components/LoginScreen';
import Footer from './components/Footer';
import { api } from './services/api';
import { exportProductsToExcel } from './services/excelExporter';
import { Menu, Layers, FileSpreadsheet } from 'lucide-react';

function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'users' | 'admin'
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [takeProduct, setTakeProduct] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('risk'); // 'risk' | 'name' | 'date' | 'quantity'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [exportingCatalog, setExportingCatalog] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Restrict admin tabs for regular users
  useEffect(() => {
    if (!isAdmin && (activeTab === 'users' || activeTab === 'admin')) {
      setActiveTab('feed');
    }
  }, [isAdmin, activeTab]);

  // ==========================================================
  // AUTHENTICATION GUARD: Strictly show nothing if not logged in
  // ==========================================================
  if (!user) {
    return <LoginScreen />;
  }

  const handleSaveProduct = async (formData, editingId) => {
    if (editingId) {
      await api.updateProduct(editingId, formData);
    } else {
      await api.createProduct(formData);
    }
    setEditingProduct(null);
    await fetchProducts();
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`${t('confirm_delete_product')} "${product.name}" ?`)) {
      return;
    }
    try {
      await api.deleteProduct(product.id);
      await fetchProducts();
    } catch (err) {
      alert(err.message || 'Échec de la suppression');
    }
  };

  const handleTakeConfirm = async (productId, qty, currentUser) => {
    await api.takeProduct(productId, qty, currentUser);
    await fetchProducts();
  };

  const handleSaveRiskDate = async (productId, newDate) => {
    await api.updateRiskDate(productId, newDate);
    await fetchProducts();
  };

  const handleExportProductsExcel = async () => {
    try {
      setExportingCatalog(true);
      await exportProductsToExcel(sortedProducts, t);
    } catch (err) {
      console.error('Excel Export failed', err);
    } finally {
      setExportingCatalog(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = safeProducts.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.id && p.id.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return (p.alert_level === 'normal' || !p.alert_level) && p.remaining_qty > 0;
    if (filterStatus === 'warning') return p.alert_level === 'warning' && p.remaining_qty > 0;
    if (filterStatus === 'critical') return (p.alert_level === 'critical' || p.days_remaining <= 0) && p.remaining_qty > 0;
    if (filterStatus === 'depleted') return p.remaining_qty <= 0 || p.status === 'depleted';

    return true;
  });

  // Sort products: At-Risk first by default (ascending risk days / descending urgency)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'risk') {
      const aDepleted = parseFloat(a.remaining_qty || 0) <= 0 || a.status === 'depleted';
      const bDepleted = parseFloat(b.remaining_qty || 0) <= 0 || b.status === 'depleted';
      if (aDepleted && !bDepleted) return 1;
      if (!aDepleted && bDepleted) return -1;
      if (aDepleted && bDepleted) return 0;

      const aDays = a.days_remaining !== undefined ? parseInt(a.days_remaining, 10) : 10;
      const bDays = b.days_remaining !== undefined ? parseInt(b.days_remaining, 10) : 10;

      if (sortDirection === 'asc') {
        // At risk first: fewest days remaining first (0 days / overdue at top)
        return aDays - bDays;
      } else {
        // Descending: most days remaining first
        return bDays - aDays;
      }
    }

    if (sortBy === 'name') {
      const cmp = (a.name || '').localeCompare(b.name || '');
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    if (sortBy === 'date') {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    }

    if (sortBy === 'quantity') {
      const aQty = parseFloat(a.remaining_qty || 0);
      const bQty = parseFloat(b.remaining_qty || 0);
      return sortDirection === 'asc' ? aQty - bQty : bQty - aQty;
    }

    return 0;
  });

  const criticalItems = safeProducts.filter(
    (p) => (p.alert_level === 'critical' || p.days_remaining <= 0 || p.status === 'expired') && p.remaining_qty > 0
  );

  const warningItems = safeProducts.filter(
    (p) => p.alert_level === 'warning' && p.remaining_qty > 0
  );

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCapture={() => { setEditingProduct(null); setIsCaptureOpen(true); }}
        criticalCount={criticalItems.length}
        warningCount={warningItems.length}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />

      {/* Main App Content Wrapper */}
      <div className="app-main-wrapper">
        {/* Mobile Top Bar (only displayed on screens < 900px) */}
        <div className="mobile-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #5d5fef 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Layers size={14} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Aura<span style={{ color: '#5d5fef' }}>Track</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Ouvrir le menu"
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Day 10 Red Alert Emergency Top Banner (Admin & User oversight) */}
        <AlertBanner
          criticalProducts={criticalItems}
          onInspect={() => isAdmin && setActiveTab('admin')}
        />

        {/* Main Content Area */}
        <main className="app-main-container" style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
          {isAdmin && activeTab === 'admin' ? (
            <AdminConsole
              products={products}
              onRefreshProducts={fetchProducts}
            />
          ) : isAdmin && activeTab === 'users' ? (
            <UserManagement />
          ) : (
            <div>
              {/* Catalog Header & Filters (Responsive) */}
              <div className="catalog-header-wrap" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}>
                  <div>
                    <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {t('catalog_title')}
                    </h1>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {t('catalog_subtitle')}
                    </p>
                  </div>

                {/* Search & Status Filters */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '640px' }}>
                  <div className="search-input-wrap" style={{ flex: '1 1 200px' }}>
                    <input
                      id="search-products-input"
                      className="field-input"
                      style={{ padding: '7px 12px', fontSize: '12px' }}
                      placeholder={t('search_placeholder')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Touch-Scrollable Filter Tabs */}
                  <div className="scrollable-tabs-wrapper" style={{
                    display: 'flex',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px',
                    gap: '3px',
                    flexShrink: 0,
                  }}>
                    {[
                      { id: 'all', label: t('filter_all') },
                      { id: 'critical', label: `${t('filter_day10')} (${criticalItems.length})` },
                      { id: 'warning', label: `${t('filter_day7')} (${warningItems.length})` },
                      { id: 'active', label: t('filter_active') },
                      { id: 'depleted', label: t('filter_depleted') },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterStatus(tab.id)}
                        style={{
                          padding: '5px 9px',
                          fontSize: '11px',
                          fontWeight: '600',
                          borderRadius: 'var(--radius-xs)',
                          background: filterStatus === tab.id ? 'var(--accent-subtle)' : 'transparent',
                          color: filterStatus === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                          border: filterStatus === tab.id ? '1px solid var(--accent-subtle)' : '1px solid transparent',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-toolbar: Sorting Controls & At-Risk Priority Indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {t('sort_label')}
                  </span>

                  {/* Sort criteria select */}
                  <select
                    id="sort-by-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="risk">{t('sort_risk')}</option>
                    <option value="name">{t('sort_name')}</option>
                    <option value="date">{t('sort_date')}</option>
                    <option value="quantity">{t('sort_qty')}</option>
                  </select>

                  {/* Ascending / Descending Toggle Button */}
                  <button
                    id="toggle-sort-order-btn"
                    type="button"
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={`Ordre : ${sortDirection === 'asc' ? t('sort_asc') : t('sort_desc')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: 'var(--accent-primary)', fontSize: '12px', fontWeight: '700' }}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                    <span>{sortDirection === 'asc' ? t('sort_asc') : t('sort_desc')}</span>
                  </button>
                </div>

                {/* Right Actions: At-Risk Badge & Export Excel with Images */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {sortBy === 'risk' && sortDirection === 'asc' && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#fbbf24',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                    }}>
                      <span className="status-dot status-dot-warning" />
                      <span>{t('at_risk_badge')}</span>
                    </div>
                  )}

                  <button
                    id="export-products-excel-btn"
                    type="button"
                    onClick={handleExportProductsExcel}
                    disabled={exportingCatalog}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    title="Sauvegarder Excel avec les images des produits"
                  >
                    <FileSpreadsheet size={14} color="#10b981" />
                    <span>{exportingCatalog ? 'Génération...' : t('export_excel')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Grid */}
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chargement des produits...
              </div>
            ) : sortedProducts.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '40px 16px',
                textAlign: 'center',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('no_products_title')}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {t('no_products_desc')}
                </p>
                <button
                  onClick={() => { setEditingProduct(null); setIsCaptureOpen(true); }}
                  className="btn btn-primary"
                  style={{ fontSize: '12px' }}
                >
                  {t('capture_new_btn')}
                </button>
              </div>
            ) : (
              <div className="responsive-grid">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onTake={(p) => setTakeProduct(p)}
                    onEdit={(p) => { setEditingProduct(p); setIsCaptureOpen(true); }}
                    onDelete={handleDeleteProduct}
                    onAdjustRisk={(p) => setAdjustProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
      </div>

      {/* Capture & Edit Modal */}
      <ProductModal
        isOpen={isCaptureOpen}
        editingProduct={editingProduct}
        onClose={() => { setIsCaptureOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
      />

      {/* Claim / Take Modal */}
      <TakeModal
        product={takeProduct}
        isOpen={Boolean(takeProduct)}
        onClose={() => setTakeProduct(null)}
        onConfirm={handleTakeConfirm}
      />

      {/* Risk Adjust Modal */}
      <RiskAdjustModal
        product={adjustProduct}
        isOpen={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        onSave={handleSaveRiskDate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DashboardContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
