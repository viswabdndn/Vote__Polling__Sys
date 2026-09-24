import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  MdPalette,
  MdLanguage,
  MdTune,
  MdSecurity,
  MdBrightnessAuto,
  MdLightMode,
  MdDarkMode,
  MdVolumeUp,
  MdRefresh,
  MdLogout,
  MdRestartAlt,
  MdDeleteForever,
  MdCheck,
  MdShield,
  MdAccountCircle,
  MdEmail,
  MdKey,
} from 'react-icons/md';
import toast from 'react-hot-toast';

const THEME_OPTIONS = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep navy primary with vibrant cyan accent (Default)',
    colors: ['#1e3a5f', '#2a5298', '#00b4d8', '#90e0ef'],
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    description: 'Rich forest pine with vivid emerald and mint highlights',
    colors: ['#064e3b', '#059669', '#10b981', '#6ee7b7'],
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Deep luxury violet with luminous amethyst accent',
    colors: ['#3b0764', '#7c3aed', '#a855f7', '#d8b4fe'],
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    description: 'Warm obsidian terracotta with glowing amber energy',
    colors: ['#451a03', '#b45309', '#f59e0b', '#fde68a'],
  },
  {
    id: 'neon',
    name: 'Cyberpunk Neon',
    description: 'Midnight stealth slate with electric cyan and neon blue',
    colors: ['#0f172a', '#2563eb', '#06b6d4', '#67e8f9'],
  },
  {
    id: 'crimson',
    name: 'Crimson Rose',
    description: 'Passionate dark ruby with vibrant rose highlights',
    colors: ['#4c0519', '#be123c', '#f43f5e', '#fda4af'],
  },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇺🇸', region: 'United States / Global' },
  { code: 'es', label: 'Español', flag: '🇪🇸', region: 'Spain / Latin America' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', region: 'France / Canada' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', region: 'Germany / Austria' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', region: 'Japan' },
  { code: 'zh', label: '中文', flag: '🇨🇳', region: 'China / International' },
];

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    mode,
    setMode,
    theme,
    setTheme,
    language,
    setLanguage,
    animations,
    setAnimations,
    soundEffects,
    setSoundEffects,
    compactCards,
    setCompactCards,
    autoRefresh,
    setAutoRefresh,
    t,
    playSound,
    resetSettings,
    clearAllAndLogout,
  } = useSettings();

  const [activeTab, setActiveTab] = useState('appearance');

  const handleModeChange = (newMode) => {
    setMode(newMode);
    playSound('click');
    toast.success(`${t('colorMode')}: ${newMode.toUpperCase()}`);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    playSound('click');
    toast.success(`${t('themePalette')}: ${newTheme.toUpperCase()}`);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    playSound('click');
    toast.success(`${t('languageTitle')}: ${newLang.toUpperCase()}`);
  };

  const handleTestSound = () => {
    playSound('test');
    toast.success(t('soundPlayed'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetSettings = () => {
    resetSettings();
    playSound('click');
    toast.success(t('settingsSaved'));
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cache and log out?')) {
      clearAllAndLogout(logout, navigate);
    }
  };

  return (
    <div className="page-container animate-fadeIn">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">{t('settingsTitle')}</h1>
          <p className="page-subtitle">{t('settingsSubtitle')}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleResetSettings}>
          <MdRestartAlt size={16} /> {t('resetSettingsBtn')}
        </button>
      </div>

      {/* Settings Tab Navigation */}
      <div className="settings-nav-tabs">
        <button
          className={`settings-nav-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <MdPalette size={18} /> {t('tabAppearance')}
        </button>
        <button
          className={`settings-nav-tab ${activeTab === 'language' ? 'active' : ''}`}
          onClick={() => setActiveTab('language')}
        >
          <MdLanguage size={18} /> {t('tabLanguage')}
        </button>
        <button
          className={`settings-nav-tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <MdTune size={18} /> {t('tabPreferences')}
        </button>
        <button
          className={`settings-nav-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <MdSecurity size={18} /> {t('tabAccount')}
        </button>
      </div>

      {/* Tab 1: Appearance & Themes */}
      {activeTab === 'appearance' && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Mode selector */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('colorMode')}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Switch between Light, Dark, or System automatic display modes.
              </p>
            </div>
            <div className="card-body">
              <div className="mode-grid">
                <div
                  className={`mode-card ${mode === 'light' ? 'active' : ''}`}
                  onClick={() => handleModeChange('light')}
                >
                  <div className="mode-icon-wrap">
                    <MdLightMode />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {t('modeLight')}
                  </div>
                  {mode === 'light' && (
                    <span className="badge badge-accent" style={{ marginTop: 4 }}>
                      <MdCheck size={12} /> Active
                    </span>
                  )}
                </div>

                <div
                  className={`mode-card ${mode === 'dark' ? 'active' : ''}`}
                  onClick={() => handleModeChange('dark')}
                >
                  <div className="mode-icon-wrap">
                    <MdDarkMode />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {t('modeDark')}
                  </div>
                  {mode === 'dark' && (
                    <span className="badge badge-accent" style={{ marginTop: 4 }}>
                      <MdCheck size={12} /> Active
                    </span>
                  )}
                </div>

                <div
                  className={`mode-card ${mode === 'system' ? 'active' : ''}`}
                  onClick={() => handleModeChange('system')}
                >
                  <div className="mode-icon-wrap">
                    <MdBrightnessAuto />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {t('modeSystem')}
                  </div>
                  {mode === 'system' && (
                    <span className="badge badge-accent" style={{ marginTop: 4 }}>
                      <MdCheck size={12} /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette Presets */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('themePalette')}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Curated color systems that instantly retheme buttons, sidebars, charts, and accents.
              </p>
            </div>
            <div className="card-body">
              <div className="theme-palette-grid">
                {THEME_OPTIONS.map((item) => (
                  <div
                    key={item.id}
                    className={`theme-palette-card ${theme === item.id ? 'active' : ''}`}
                    onClick={() => handleThemeChange(item.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>
                      {theme === item.id && (
                        <span className="badge badge-accent">
                          <MdCheck size={12} /> Selected
                        </span>
                      )}
                    </div>
                    <div className="palette-swatches">
                      {item.colors.map((c, i) => (
                        <div key={i} className="palette-swatch" style={{ background: c }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Options */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Visual Effects & Layout
              </h2>
            </div>
            <div className="card-body">
              <div className="toggle-setting-row">
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('animationsToggle')}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('animationsSub')}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={animations}
                    onChange={(e) => setAnimations(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-setting-row">
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('compactToggle')}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('compactSub')}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={compactCards}
                    onChange={(e) => setCompactCards(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Language */}
      {activeTab === 'language' && (
        <div className="animate-fadeIn">
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('languageTitle')}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {t('languageSub')}
              </p>
            </div>
            <div className="card-body">
              <div className="lang-grid">
                {LANGUAGE_OPTIONS.map((item) => (
                  <div
                    key={item.code}
                    className={`lang-card ${language === item.code ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(item.code)}
                  >
                    <span className="lang-flag">{item.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.region}
                      </div>
                    </div>
                    {language === item.code && (
                      <MdCheck size={18} color="var(--accent)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferences & Sound */}
      {activeTab === 'preferences' && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Audio & Interaction
              </h2>
            </div>
            <div className="card-body">
              <div className="toggle-setting-row">
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('soundEffects')}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('soundEffectsSub')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleTestSound}>
                    <MdVolumeUp size={16} /> {t('testSound')}
                  </button>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="toggle-setting-row">
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('autoRefresh')}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('autoRefreshSub')}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Account & Session / Logout */}
      {activeTab === 'account' && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Session details */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('sessionInfo')}
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ padding: '14px 16px', background: 'var(--bg-alt)', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                    <MdAccountCircle size={16} /> {t('loggedInAs')}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {user?.name || 'Active User'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {user?.email}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', background: 'var(--bg-alt)', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                    <MdKey size={16} /> {t('userId')}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {user?._id || 'JWT_AUTHENTICATED'}
                  </div>
                </div>

                <div style={{ padding: '14px 16px', background: 'var(--success-bg)', borderRadius: 'var(--border-radius-sm)', border: '1px solid #86efac' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                    <MdShield size={16} /> {t('securityStatus')}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                    {t('securityGood')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout & session management actions */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('logoutActions')}
              </h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--border-radius)',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {t('logoutBtn')}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('logoutDesc')}
                  </p>
                </div>
                <button className="btn btn-outline" onClick={handleLogout}>
                  <MdLogout size={18} /> {t('logoutBtn')}
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--border-radius)',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {t('resetSettingsBtn')}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('resetSettingsDesc')}
                  </p>
                </div>
                <button className="btn btn-ghost" onClick={handleResetSettings}>
                  <MdRestartAlt size={18} /> {t('resetSettingsBtn')}
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                border: '1.5px solid rgba(220, 38, 38, 0.3)',
                background: 'var(--error-bg)',
                borderRadius: 'var(--border-radius)',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--error)' }}>
                    {t('clearAllBtn')}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {t('clearAllDesc')}
                  </p>
                </div>
                <button className="btn btn-danger" onClick={handleClearCache}>
                  <MdDeleteForever size={18} /> {t('clearAllBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
