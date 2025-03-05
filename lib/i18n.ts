/**
 * Simple internationalization utility for the luxury management app
 */

// Available languages
export type Language = 'en' | 'fr' | 'es' | 'de' | 'zh' | 'ja'

// Default language
export const DEFAULT_LANGUAGE: Language = 'en'

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'Executive Management Suite',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.try_again': 'Try again',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search...',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.analytics': 'Analytics',
    'dashboard.reports': 'Reports',
    'dashboard.total_revenue': 'Total Revenue',
    'dashboard.active_projects': 'Active Projects',
    'dashboard.completed_tasks': 'Completed Tasks',
    'dashboard.team_performance': 'Team Performance',
    'dashboard.performance_overview': 'Performance Overview',
    'dashboard.recent_tasks': 'Recent Tasks',
    'dashboard.team_members': 'Team Members',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Employees',
    'nav.tasks': 'Tasks',
    'nav.messages': 'Messages',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgot_password': 'Forgot password?',
    'auth.sign_in': 'Sign in',
  },
  fr: {
    // Common
    'app.name': 'Suite de Gestion Exécutive',
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.try_again': 'Réessayer',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.search': 'Rechercher...',
    
    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.overview': 'Aperçu',
    'dashboard.analytics': 'Analytique',
    'dashboard.reports': 'Rapports',
    'dashboard.total_revenue': 'Revenu total',
    'dashboard.active_projects': 'Projets actifs',
    'dashboard.completed_tasks': 'Tâches accomplies',
    'dashboard.team_performance': 'Performance d\'équipe',
    'dashboard.performance_overview': 'Aperçu des performances',
    'dashboard.recent_tasks': 'Tâches récentes',
    'dashboard.team_members': 'Membres de l\'équipe',
    
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.employees': 'Employés',
    'nav.tasks': 'Tâches',
    'nav.messages': 'Messages',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.forgot_password': 'Mot de passe oublié?',
    'auth.sign_in': 'Se connecter',
  },
  es: {
    // Common basic translations (others would be added in a real app)
    'app.name': 'Suite de Gestión Ejecutiva',
    'common.loading': 'Cargando...',
    'common.error': 'Algo salió mal',
    'common.try_again': 'Intentar de nuevo',
    // More translations would be added here
  },
  de: {
    // Common basic translations (others would be added in a real app)
    'app.name': 'Führungsmanagement-Suite',
    'common.loading': 'Wird geladen...',
    'common.error': 'Etwas ist schief gelaufen',
    'common.try_again': 'Erneut versuchen',
    // More translations would be added here
  },
  zh: {
    // Common basic translations (others would be added in a real app)
    'app.name': '行政管理套件',
    'common.loading': '加载中...',
    'common.error': '出现错误',
    'common.try_again': '重试',
    // More translations would be added here
  },
  ja: {
    // Common basic translations (others would be added in a real app)
    'app.name': 'エグゼクティブ管理スイート',
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.try_again': '再試行',
    // More translations would be added here
  }
}

/**
 * Get a translated string by key
 * @param key Translation key
 * @param lang Target language 
 * @param params Replacement parameters
 * @returns Translated string
 */
export function t(key: string, lang: Language = DEFAULT_LANGUAGE, params: Record<string, string> = {}): string {
  // Fallback to English if translation doesn't exist
  const translation = translations[lang]?.[key] || translations[DEFAULT_LANGUAGE][key] || key
  
  // Replace parameters if provided
  if (params && Object.keys(params).length > 0) {
    return Object.entries(params).reduce(
      (str, [key, value]) => str.replace(new RegExp(`{${key}}`, 'g'), value),
      translation
    )
  }
  
  return translation
}

/**
 * Create a translation function with a fixed language
 * @param lang Target language
 * @returns Translation function
 */
export function createTranslator(lang: Language = DEFAULT_LANGUAGE) {
  return (key: string, params?: Record<string, string>) => t(key, lang, params)
}

// List of available languages with their native names
export const AVAILABLE_LANGUAGES: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
}