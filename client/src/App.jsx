import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import TakeModal from './components/TakeModal';
import RiskAdjustModal from './components/RiskAdjustModal';
import AdminConsole from './components/AdminConsole';
import UserManagement from './components/UserManagement';
import LoginScreen from './components/LoginScreen';
import { api } from './services/api';

function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'users' | 'admin'

  // Modals
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [takeProduct, setTakeProduct] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

  const criticalItems = safeProducts.filter(
    (p) => (p.alert_level === 'critical' || p.days_remaining <= 0 || p.status === 'expired') && p.remaining_qty > 0
  );

  const warningItems = safeProducts.filter(
    (p) => p.alert_level === 'warning' && p.remaining_qty > 0
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Day 10 Red Alert Emergency Top Banner (Admin & User oversight) */}
      <AlertBanner
        criticalProducts={criticalItems}
        onInspect={() => isAdmin && setActiveTab('admin')}
      />

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCapture={() => { setEditingProduct(null); setIsCaptureOpen(true); }}
        criticalCount={criticalItems.length}
        warningCount={warningItems.length}
      />

      {/* Main Content Area */}
      <main className="app-main-container" style={{ flex: 1, maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
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
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '20px',
            }}>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>
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
                        background: filterStatus === tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: filterStatus === tab.id ? '#fff' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Responsive Grid */}
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chargement des produits...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '40px 16px',
                textAlign: 'center',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
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
                {filteredProducts.map((product) => (
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
