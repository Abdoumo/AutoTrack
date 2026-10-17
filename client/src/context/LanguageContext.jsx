import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  fr: {
    // Navigation
    app_name: 'AuraTrack',
    feed: 'Inventaire',
    users: 'Utilisateurs & Statistiques',
    admin: 'Journal Admin & CSV',
    capture: '+ Enregistrer',
    login: 'Connexion',
    logout: 'Déconnexion',
    register: 'Inscription',
    admin_role: 'Administrateur',
    user_role: 'Utilisateur',

    // Alert Banner
    day10_alert_tag: 'Jour 10 Expiré',
    day10_alert_text: 'produit(s) ont dépassé la limite de risque de 10 jours sans être vendus. Notification administrateur envoyée.',
    view_in_ledger: 'Voir dans le journal →',

    // Catalog Page
    catalog_title: 'Inventaire des Produits',
    catalog_subtitle: 'Suivi des stocks par pièce ou kg avec décompte automatique du délai de risque à 10 jours.',
    search_placeholder: 'Rechercher par nom ou référence...',
    filter_all: 'Tous les articles',
    filter_day10: 'Jour 10 Dépassé',
    filter_day7: 'Avis Jour 7',
    filter_active: 'Actif',
    filter_depleted: 'Épuisé',
    no_products_title: 'Aucun produit trouvé',
    no_products_desc: 'Aucun article ne correspond à votre recherche. Enregistrez un nouveau produit.',
    capture_new_btn: 'Enregistrer un Nouveau Produit',

    // Product Card
    ref: 'RÉF',
    days_left: 'j restants',
    stock_available: 'Stock Disponible',
    product_weight: 'Poids du Produit :',
    created_at: 'Créé le :',
    risk_deadline: 'Échéance Risque :',
    claim_btn: 'Récupérer',
    edit_btn: 'Modifier',
    delete_btn: 'Supprimer',
    adjust_risk_btn: 'Ajuster Risque',
    confirm_delete_product: 'Voulez-vous vraiment supprimer ce produit ?',

    // Product Capture & Edit Modal
    modal_capture_title: 'Enregistrer un Produit',
    modal_edit_title: 'Modifier le Produit',
    modal_desc: 'Définissez la quantité, le poids et le calendrier de risque.',
    ref_uuid: 'Référence Système (UUID)',
    product_name_label: 'Nom du Produit *',
    measurement_unit_label: 'Unité de Mesure *',
    unit_piece: 'Pièce (pcs)',
    unit_kg: 'Kilogramme (kg)',
    initial_qty_label: 'Quantité Initiale',
    total_weight_label: 'Poids Total (kg) *',
    description_label: 'Description',
    risk_threshold_label: 'Seuil de Délai de Risque',
    risk_rule_notice: 'Avis email administrateur au Jour 7. Alerte rouge critique au Jour 10.',
    target_deadline: 'Échéance cible :',
    cancel: 'Annuler',
    save_product: 'Enregistrer le Produit',
    saving: 'Enregistrement...',

    // Take / Claim Modal
    claim_title: 'Récupérer du Stock',
    claim_desc: 'Déduisez une quantité partielle ou totale de l’inventaire.',
    total_weight: 'Poids Total',
    qty_to_claim: 'Quantité à Récupérer',
    balance_after: 'Solde restant :',
    logged_under: 'Opération enregistrée sous',
    confirm_claim: 'Confirmer la Récupération',
    confirming: 'Validation...',

    // Admin & Ledger
    audit_oversight: 'Audit & Gestion des Risques',
    admin_title: 'Journal des Transactions & Export CSV',
    admin_subtitle: 'Historique complet des réclamations de stock et téléchargement CSV.',
    refresh: 'Actualiser',
    export_csv: 'Exporter CSV',
    day10_card_title: 'Jour 10 Dépassé (Critique)',
    day10_card_desc: 'Produits invendus ayant atteint ou dépassé la date limite de 10 jours.',
    day7_card_title: 'Zone d’Alerte Jour 7',
    day7_card_desc: 'Articles ayant 3 jours ou moins avant l’échéance du Jour 10.',
    user_claim_ledger: 'Journal des Réclamations',
    search_records: 'Filtrer les enregistrements...',
    col_claimant: 'Bénéficiaire',
    col_product: 'Produit',
    col_qty: 'Quantité',
    col_weight: 'Poids',
    col_date: 'Date & Heure',
    col_ref: 'Réf',

    // User Management
    user_analytics_title: 'Répertoire & Statistiques Utilisateurs',
    user_analytics_subtitle: 'Gestion des profils (CRUD), attribution des rôles et audit des actions effectuées.',
    create_user_btn: '+ Créer Utilisateur',
    registered_accounts: 'Comptes Enregistrés',
    search_users: 'Rechercher par nom, email ou rôle...',
    col_user: 'Profil Utilisateur',
    col_role: 'Rôle',
    col_products_created: 'Produits Créés',
    col_stock_claimed: 'Stock Récupéré',
    col_joined: 'Inscrit le',
    col_actions: 'Actions',
    btn_activity: 'Activité',
    btn_edit: 'Modifier',
    btn_delete: 'Supprimer',

    // User Modals
    modal_create_user: 'Créer un Compte Utilisateur',
    modal_edit_user: 'Modifier le Profil Utilisateur',
    full_name: 'Nom Complet *',
    email_address: 'Adresse Email *',
    password_label: 'Mot de passe *',
    role_label: 'Rôle Système *',
    audit_user_activity: 'Audit de l’Activité Utilisateur',
    metric_captured: 'Produits Créés',
    metric_claims: 'Réclamations',
    metric_qty_taken: 'Quantité Prise',
    claims_history: 'Historique des Réclamations',
    created_products_history: 'Produits Enregistrés par cet Utilisateur',
    close_audit: 'Fermer l’Audit',

    // Auth Modal
    auth_welcome_login: 'Connexion à votre Compte',
    auth_welcome_register: 'Créer un Nouveau Compte',
    auth_no_account: 'Pas encore de compte ? S’inscrire',
    auth_have_account: 'Vous avez déjà un compte ? Se connecter',
    submit_login: 'Se Connecter',
    submit_register: 'Créer un Compte',
  },
  en: {
    // Navigation
    app_name: 'AuraTrack',
    feed: 'Inventory Feed',
    users: 'User Analytics & CRUD',
    admin: 'Admin Ledger & CSV',
    capture: '+ Capture',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    admin_role: 'Admin',
    user_role: 'User',

    // Alert Banner
    day10_alert_tag: 'Day 10 Overdue',
    day10_alert_text: 'product(s) have exceeded the 10-day risk date without being sold. Admin notification triggered.',
    view_in_ledger: 'View in Ledger →',

    // Catalog Page
    catalog_title: 'Inventory Catalog',
    catalog_subtitle: 'Live tracking by piece/kg with automated 10-day risk date countdowns.',
    search_placeholder: 'Search catalog by name or ID...',
    filter_all: 'All Items',
    filter_day10: 'Day 10 Overdue',
    filter_day7: 'Day 7 Notice',
    filter_active: 'Active',
    filter_depleted: 'Depleted',
    no_products_title: 'No Products Match Filter',
    no_products_desc: 'Try adjusting your search criteria or register a new product.',
    capture_new_btn: 'Capture New Product',

    // Product Card
    ref: 'REF',
    days_left: 'd left',
    stock_available: 'Stock Available',
    product_weight: 'Product Weight:',
    created_at: 'Created:',
    risk_deadline: 'Risk Deadline:',
    claim_btn: 'Claim',
    edit_btn: 'Edit',
    delete_btn: 'Delete',
    adjust_risk_btn: 'Adjust Risk',
    confirm_delete_product: 'Are you sure you want to delete this product?',

    // Product Capture & Edit Modal
    modal_capture_title: 'Capture Product',
    modal_edit_title: 'Edit Product',
    modal_desc: 'Configure inventory quantity, weight, and risk timeline.',
    ref_uuid: 'System Reference (UUID)',
    product_name_label: 'Product Name *',
    measurement_unit_label: 'Measurement Unit *',
    unit_piece: 'Piece (pcs)',
    unit_kg: 'Kilogram (kg)',
    initial_qty_label: 'Initial Quantity',
    total_weight_label: 'Total Weight (kg) *',
    description_label: 'Description',
    risk_threshold_label: 'Risk Period Threshold',
    risk_rule_notice: 'Day 7 admin notice. Day 10 critical red status.',
    target_deadline: 'Target deadline:',
    cancel: 'Cancel',
    save_product: 'Save Product',
    saving: 'Saving...',

    // Take / Claim Modal
    claim_title: 'Claim Inventory',
    claim_desc: 'Deduct partial quantity from product stock.',
    total_weight: 'Total Weight',
    qty_to_claim: 'Quantity to Claim',
    balance_after: 'Balance after:',
    logged_under: 'Logged under',
    confirm_claim: 'Confirm Claim',
    confirming: 'Confirming...',

    // Admin & Ledger
    audit_oversight: 'Audit & Risk Oversight',
    admin_title: 'Transaction Ledger & Export',
    admin_subtitle: 'Full audit log of inventory claims, quantity deductions, and CSV generation.',
    refresh: 'Refresh',
    export_csv: 'Export CSV',
    day10_card_title: 'Day 10 Overdue (Critical)',
    day10_card_desc: 'Unsold products that reached or passed the 10-day risk date.',
    day7_card_title: 'Day 7 Warning Zone',
    day7_card_desc: 'Items with 3 or fewer days remaining before the Day 10 cutoff.',
    user_claim_ledger: 'User Claim Ledger',
    search_records: 'Filter records...',
    col_claimant: 'Claimant',
    col_product: 'Product',
    col_qty: 'Quantity',
    col_weight: 'Weight',
    col_date: 'Timestamp',
    col_ref: 'Ref',

    // User Management
    user_analytics_title: 'User Management & Activity Directory',
    user_analytics_subtitle: 'CRUD user profiles, assign roles, and inspect granular activity logs of what each user did.',
    create_user_btn: '+ Create User',
    registered_accounts: 'Registered Accounts',
    search_users: 'Search by name, email, or role...',
    col_user: 'User Profile',
    col_role: 'Role',
    col_products_created: 'Products Created',
    col_stock_claimed: 'Stock Claimed',
    col_joined: 'Joined',
    col_actions: 'Actions',
    btn_activity: 'Activity',
    btn_edit: 'Edit',
    btn_delete: 'Delete',

    // User Modals
    modal_create_user: 'Create User Account',
    modal_edit_user: 'Edit User Profile',
    full_name: 'Full Name *',
    email_address: 'Email Address *',
    password_label: 'Password *',
    role_label: 'System Role *',
    audit_user_activity: 'User Activity Audit',
    metric_captured: 'Captured',
    metric_claims: 'Claims',
    metric_qty_taken: 'Qty Taken',
    claims_history: 'Claims & Quantity Deductions',
    created_products_history: 'Products Registered by this User',
    close_audit: 'Close Audit',

    // Auth Modal
    auth_welcome_login: 'Login to Your Account',
    auth_welcome_register: 'Create a New Account',
    auth_no_account: "Don't have an account? Register",
    auth_have_account: 'Already have an account? Login',
    submit_login: 'Login',
    submit_register: 'Create Account',
  },
};

export const LanguageProvider = ({ children }) => {
  // Default to French ('fr') as requested by user
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('auratrack_lang') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('auratrack_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fr' ? 'en' : 'fr'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
