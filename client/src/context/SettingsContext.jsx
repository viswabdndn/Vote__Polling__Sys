import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    availablePolls: 'Available Polls',
    createPoll: 'Create Poll',
    myPolls: 'My Polls',
    pollHistory: 'Poll History',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    brandSub: 'Voting System',

    // Dashboard
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    dashboardSub: "Here's what's happening on PollLive today.",
    activePollsStat: 'Active Polls',
    myPollsStat: 'My Polls',
    completedPollsStat: 'Completed Polls',
    realTimeVoting: 'Real-Time Voting',
    currentActivePolls: 'Active Polls',
    currentActiveSub: 'Current polls open for voting',
    viewAll: 'View All',
    noActivePolls: 'No active polls',
    createToStart: 'Create a poll to get started!',
    quickActions: 'Quick Actions',
    createPollDesc: 'Set up a new vote with custom options',
    pollHistoryDesc: 'Browse completed & archived polls',
    quickSettings: 'Quick Settings & Themes',
    quickSettingsSub: 'Personalize your interface mode, color palette & language',
    vote: 'Vote',
    results: 'Results',
    optionsCount: 'options',
    by: 'by',
    hoursLeft: 'h left',

    // Settings
    settingsTitle: 'Settings & Preferences',
    settingsSubtitle: 'Customize your theme, appearance, language, and session settings',
    tabAppearance: 'Appearance & Themes',
    tabLanguage: 'Language',
    tabPreferences: 'Preferences & Sounds',
    tabAccount: 'Account & Session',

    // Appearance
    colorMode: 'Color Mode',
    modeLight: 'Light Mode',
    modeDark: 'Dark Mode',
    modeSystem: 'System Default',
    themePalette: 'Color Palette',
    themeOcean: 'Ocean Blue',
    themeEmerald: 'Emerald Green',
    themePurple: 'Royal Purple',
    themeAmber: 'Sunset Amber',
    themeNeon: 'Cyberpunk Neon',
    themeCrimson: 'Crimson Rose',
    animationsToggle: 'Interface Animations',
    animationsSub: 'Enable smooth transitions and micro-interactions',
    compactToggle: 'Compact Poll Cards',
    compactSub: 'Display poll lists in a more condensed layout',

    // Language
    languageTitle: 'Select Language',
    languageSub: 'Choose your preferred language for the PollLive interface',

    // Sound & Voting Preferences
    soundEffects: 'Voting Audio Feedback',
    soundEffectsSub: 'Play synthesized sound effect upon casting votes',
    testSound: 'Test Sound',
    autoRefresh: 'Auto Refresh Feeds',
    autoRefreshSub: 'Keep active poll lists synchronized automatically',

    // Account & Logout Settings
    sessionInfo: 'Active Session Information',
    loggedInAs: 'Logged in as',
    userId: 'User ID',
    securityStatus: 'Security Status',
    securityGood: 'Protected with JWT session token',
    logoutActions: 'Session & Logout Controls',
    logoutBtn: 'Log Out of Account',
    logoutDesc: 'End your current session on this browser securely',
    resetSettingsBtn: 'Reset Preferences',
    resetSettingsDesc: 'Restore default themes, mode, and localization options',
    clearAllBtn: 'Clear Cache & Force Log Out',
    clearAllDesc: 'Wipe all saved tokens, custom settings, and return to login screen',

    // Messages
    settingsSaved: 'Preferences updated successfully',
    soundPlayed: 'Sound preview played',
  },
  es: {
    dashboard: 'Panel de Control',
    availablePolls: 'Encuestas Disponibles',
    createPoll: 'Crear Encuesta',
    myPolls: 'Mis Encuestas',
    pollHistory: 'Historial',
    profile: 'Perfil',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    brandSub: 'Sistema de Votación',
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    dashboardSub: 'Esto es lo que sucede hoy en PollLive.',
    activePollsStat: 'Encuestas Activas',
    myPollsStat: 'Mis Encuestas',
    completedPollsStat: 'Completadas',
    realTimeVoting: 'Votación en Vivo',
    currentActivePolls: 'Encuestas Activas',
    currentActiveSub: 'Encuestas abiertas para votar',
    viewAll: 'Ver Todo',
    noActivePolls: 'No hay encuestas activas',
    createToStart: '¡Crea una encuesta para empezar!',
    quickActions: 'Acciones Rápidas',
    createPollDesc: 'Crea una votación con opciones personalizadas',
    pollHistoryDesc: 'Explora encuestas finalizadas y archivadas',
    quickSettings: 'Ajustes Rápidos y Temas',
    quickSettingsSub: 'Personaliza tu modo, paleta de colores e idioma',
    vote: 'Votar',
    results: 'Resultados',
    optionsCount: 'opciones',
    by: 'por',
    hoursLeft: 'h restantes',
    settingsTitle: 'Configuración y Preferencias',
    settingsSubtitle: 'Personaliza tu tema, apariencia, idioma y sesión',
    tabAppearance: 'Apariencia y Temas',
    tabLanguage: 'Idioma',
    tabPreferences: 'Preferencias y Sonidos',
    tabAccount: 'Cuenta y Cierre de Sesión',
    colorMode: 'Modo de Color',
    modeLight: 'Modo Claro',
    modeDark: 'Modo Oscuro',
    modeSystem: 'Sistema',
    themePalette: 'Paleta de Colores',
    themeOcean: 'Azul Océano',
    themeEmerald: 'Verde Esmeralda',
    themePurple: 'Púrpura Real',
    themeAmber: 'Ámbar Atardecer',
    themeNeon: 'Neón Ciberpunk',
    themeCrimson: 'Rosa Carmesí',
    animationsToggle: 'Animaciones de Interfaz',
    animationsSub: 'Habilitar transiciones suaves y microinteracciones',
    compactToggle: 'Tarjetas Compactas',
    compactSub: 'Mostrar listas en un formato más condensado',
    languageTitle: 'Seleccionar Idioma',
    languageSub: 'Elige tu idioma preferido para PollLive',
    soundEffects: 'Sonido al Votar',
    soundEffectsSub: 'Reproducir efecto de sonido al emitir un voto',
    testSound: 'Probar Sonido',
    autoRefresh: 'Actualización Automática',
    autoRefreshSub: 'Mantener listas de encuestas sincronizadas',
    sessionInfo: 'Información de la Sesión',
    loggedInAs: 'Conectado como',
    userId: 'ID de Usuario',
    securityStatus: 'Estado de Seguridad',
    securityGood: 'Protegido con token de sesión JWT',
    logoutActions: 'Controles de Sesión',
    logoutBtn: 'Cerrar Sesión',
    logoutDesc: 'Finaliza tu sesión de forma segura en este navegador',
    resetSettingsBtn: 'Restablecer Preferencias',
    resetSettingsDesc: 'Restaurar temas y ajustes por defecto',
    clearAllBtn: 'Limpiar Todo y Salir',
    clearAllDesc: 'Borrar tokens y configuraciones locales',
    settingsSaved: 'Preferencias actualizadas',
    soundPlayed: 'Vista previa de sonido reproducida',
  },
  fr: {
    dashboard: 'Tableau de Bord',
    availablePolls: 'Sondages Disponibles',
    createPoll: 'Créer un Sondage',
    myPolls: 'Mes Sondages',
    pollHistory: 'Historique',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    brandSub: 'Système de Vote',
    greetingMorning: 'Bonjour',
    greetingAfternoon: 'Bon après-midi',
    greetingEvening: 'Bonsoir',
    dashboardSub: "Voici ce qui se passe sur PollLive aujourd'hui.",
    activePollsStat: 'Sondages Actifs',
    myPollsStat: 'Mes Sondages',
    completedPollsStat: 'Sondages Terminés',
    realTimeVoting: 'Vote en Temps Réel',
    currentActivePolls: 'Sondages Actifs',
    currentActiveSub: 'Sondages ouverts au vote',
    viewAll: 'Voir Tout',
    noActivePolls: 'Aucun sondage actif',
    createToStart: 'Créez un sondage pour commencer !',
    quickActions: 'Actions Rapides',
    createPollDesc: 'Configurer un nouveau vote avec options personnalisées',
    pollHistoryDesc: 'Consulter les sondages terminés et archivés',
    quickSettings: 'Paramètres Rapides et Thèmes',
    quickSettingsSub: 'Personnalisez votre mode, palette et langue',
    vote: 'Voter',
    results: 'Résultats',
    optionsCount: 'options',
    by: 'par',
    hoursLeft: 'h restantes',
    settingsTitle: 'Paramètres & Préférences',
    settingsSubtitle: 'Personnalisez thème, apparence, langue et session',
    tabAppearance: 'Apparence & Thèmes',
    tabLanguage: 'Langue',
    tabPreferences: 'Préférences & Sons',
    tabAccount: 'Compte & Déconnexion',
    colorMode: 'Mode de Couleur',
    modeLight: 'Mode Clair',
    modeDark: 'Mode Sombre',
    modeSystem: 'Système',
    themePalette: 'Palette de Couleurs',
    themeOcean: 'Bleu Océan',
    themeEmerald: 'Vert Émeraude',
    themePurple: 'Violet Royal',
    themeAmber: 'Ambre Crépuscule',
    themeNeon: 'Néon Cyberpunk',
    themeCrimson: 'Rose Carmin',
    animationsToggle: 'Animations de l’Interface',
    animationsSub: 'Activer transitions fluides et micro-interactions',
    compactToggle: 'Cartes Compactes',
    compactSub: 'Afficher les listes de manière condensée',
    languageTitle: 'Choisir la Langue',
    languageSub: 'Sélectionnez votre langue pour PollLive',
    soundEffects: 'Effet Sonore de Vote',
    soundEffectsSub: 'Émettre un son lors de la soumission du vote',
    testSound: 'Tester le Son',
    autoRefresh: 'Actualisation Automatique',
    autoRefreshSub: 'Garder les sondages synchronisés',
    sessionInfo: 'Informations de Session',
    loggedInAs: 'Connecté en tant que',
    userId: 'ID Utilisateur',
    securityStatus: 'Statut de Sécurité',
    securityGood: 'Protégé par jeton de session JWT',
    logoutActions: 'Gestion de la Session',
    logoutBtn: 'Se Déconnecter',
    logoutDesc: 'Terminer la session en toute sécurité',
    resetSettingsBtn: 'Réinitialiser',
    resetSettingsDesc: 'Restaurer les valeurs par défaut',
    clearAllBtn: 'Tout Effacer & Quitter',
    clearAllDesc: 'Supprimer jetons et préférences locales',
    settingsSaved: 'Préférences mises à jour',
    soundPlayed: 'Aperçu sonore joué',
  },
  de: {
    dashboard: 'Übersicht',
    availablePolls: 'Verfügbare Umfragen',
    createPoll: 'Umfrage Erstellen',
    myPolls: 'Meine Umfragen',
    pollHistory: 'Verlauf',
    profile: 'Profil',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    brandSub: 'Abstimmungssystem',
    greetingMorning: 'Guten Morgen',
    greetingAfternoon: 'Guten Tag',
    greetingEvening: 'Guten Abend',
    dashboardSub: 'Das passiert heute auf PollLive.',
    activePollsStat: 'Aktive Umfragen',
    myPollsStat: 'Meine Umfragen',
    completedPollsStat: 'Abgeschlossen',
    realTimeVoting: 'Echtzeit-Abstimmung',
    currentActivePolls: 'Aktive Umfragen',
    currentActiveSub: 'Zur Abstimmung geöffnete Umfragen',
    viewAll: 'Alle Anzeigen',
    noActivePolls: 'Keine aktiven Umfragen',
    createToStart: 'Erstellen Sie eine Umfrage, um loszulegen!',
    quickActions: 'Schnellaktionen',
    createPollDesc: 'Neue Abstimmung mit Optionen erstellen',
    pollHistoryDesc: 'Abgeschlossene Umfragen durchsuchen',
    quickSettings: 'Schnelleinstellungen & Designs',
    quickSettingsSub: 'Passen Sie Modus, Farbpalette und Sprache an',
    vote: 'Abstimmen',
    results: 'Ergebnisse',
    optionsCount: 'Optionen',
    by: 'von',
    hoursLeft: 'Std. übrig',
    settingsTitle: 'Einstellungen & Präferenzen',
    settingsSubtitle: 'Designs, Darstellung, Sprache und Sitzung anpassen',
    tabAppearance: 'Erscheinungsbild & Themes',
    tabLanguage: 'Sprache',
    tabPreferences: 'Präferenzen & Audio',
    tabAccount: 'Konto & Abmeldung',
    colorMode: 'Farbmodus',
    modeLight: 'Heller Modus',
    modeDark: 'Dunkler Modus',
    modeSystem: 'Systemstandard',
    themePalette: 'Farbpalette',
    themeOcean: 'Ozeanblau',
    themeEmerald: 'Smaragdgrün',
    themePurple: 'Königsviolett',
    themeAmber: 'Sonnenuntergangs-Bernstein',
    themeNeon: 'Cyberpunk Neon',
    themeCrimson: 'Karmesinrot',
    animationsToggle: 'UI-Animationen',
    animationsSub: 'Sanfte Übergänge und Animationen aktivieren',
    compactToggle: 'Kompakte Karten',
    compactSub: 'Listen in komprimierter Ansicht anzeigen',
    languageTitle: 'Sprache Wählen',
    languageSub: 'Wählen Sie Ihre Sprache für PollLive',
    soundEffects: 'Abstimmungs-Audio',
    soundEffectsSub: 'Audio-Feedback bei Stimmabgabe abspielen',
    testSound: 'Ton Testen',
    autoRefresh: 'Automatische Aktualisierung',
    autoRefreshSub: 'Umfragelisten automatisch synchron halten',
    sessionInfo: 'Sitzungsinformationen',
    loggedInAs: 'Angemeldet als',
    userId: 'Benutzer-ID',
    securityStatus: 'Sicherheitsstatus',
    securityGood: 'Geschützt durch JWT-Sitzungstoken',
    logoutActions: 'Sitzungssteuerung',
    logoutBtn: 'Jetzt Abmelden',
    logoutDesc: 'Aktuelle Sitzung sicher beenden',
    resetSettingsBtn: 'Einstellungen Zurücksetzen',
    resetSettingsDesc: 'Standardwerte wiederherstellen',
    clearAllBtn: 'Cache Löschen & Abmelden',
    clearAllDesc: 'Alle lokalen Daten bereinigen und abmelden',
    settingsSaved: 'Einstellungen gespeichert',
    soundPlayed: 'Testton abgespielt',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    availablePolls: 'उपलब्ध पोल',
    createPoll: 'नया पोल बनाएं',
    myPolls: 'मेरे पोल',
    pollHistory: 'पोल इतिहास',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    brandSub: 'लाइव वोटिंग सिस्टम',
    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    dashboardSub: 'आज PollLive पर लाइव अपडेट्स।',
    activePollsStat: 'सक्रिय पोल',
    myPollsStat: 'मेरे पोल',
    completedPollsStat: 'पूर्ण पोल',
    realTimeVoting: 'रीयल-टाइम वोटिंग',
    currentActivePolls: 'सक्रिय पोल',
    currentActiveSub: 'वोटिंग के लिए खुले पोल',
    viewAll: 'सभी देखें',
    noActivePolls: 'कोई सक्रिय पोल नहीं है',
    createToStart: 'शुरू करने के लिए एक पोल बनाएं!',
    quickActions: 'त्वरित कार्रवाई',
    createPollDesc: 'नए विकल्पों के साथ पोल शुरू करें',
    pollHistoryDesc: 'समाप्त और संग्रहीत पोल देखें',
    quickSettings: 'त्वरित सेटिंग्स और थीम्स',
    quickSettingsSub: 'मोड, रंग और भाषा अनुकूलित करें',
    vote: 'वोट दें',
    results: 'परिणाम',
    optionsCount: 'विकल्प',
    by: 'द्वारा',
    hoursLeft: 'घंटे शेष',
    settingsTitle: 'सेटिंग्स और प्राथमिकताएं',
    settingsSubtitle: 'थीम, डार्क मोड, भाषा और लॉगआउट सेटिंग्स',
    tabAppearance: 'दिखावट और थीम्स',
    tabLanguage: 'भाषा',
    tabPreferences: 'ध्वनि और प्राथमिकताएं',
    tabAccount: 'खाता और लॉगआउट',
    colorMode: 'कलर मोड',
    modeLight: 'लाइट मोड',
    modeDark: 'डार्क मोड',
    modeSystem: 'सिस्टम डिफॉल्ट',
    themePalette: 'कलर थीम',
    themeOcean: 'ओशन ब्लू',
    themeEmerald: 'एमराल्ड ग्रीन',
    themePurple: 'रॉयल पर्पल',
    themeAmber: 'सनसेट एम्बर',
    themeNeon: 'साइबरपंक नियॉन',
    themeCrimson: 'क्रिमसन रोज़',
    animationsToggle: 'एनीमेशन प्रभाव',
    animationsSub: 'सहज बदलाव और इंटरैक्शन सक्षम करें',
    compactToggle: 'कॉम्पैक्ट कार्ड्स',
    compactSub: 'पोल कार्ड्स को छोटे लेआउट में देखें',
    languageTitle: 'भाषा चुनें',
    languageSub: 'PollLive इंटरफ़ेस के लिए भाषा का चयन करें',
    soundEffects: 'वोटिंग ऑडियो फ़ीडबैक',
    soundEffectsSub: 'वोट डालते समय ध्वनि प्रभाव बजाएं',
    testSound: 'ध्वनि परीक्षण',
    autoRefresh: 'ऑटो रिफ्रेश',
    autoRefreshSub: 'सक्रिय पोल सूची को अपडेट रखें',
    sessionInfo: 'सक्रिय सत्र विवरण',
    loggedInAs: 'लॉग इन उपयोगकर्ता',
    userId: 'यूज़र आईडी',
    securityStatus: 'सुरक्षा स्थिति',
    securityGood: 'JWT सत्र टोकन से सुरक्षित',
    logoutActions: 'लॉगआउट और सुरक्षा नियंत्रण',
    logoutBtn: 'खाता लॉगआउट करें',
    logoutDesc: 'इस ब्राउज़र पर अपना सत्र सुरक्षित रूप से समाप्त करें',
    resetSettingsBtn: 'सेटिंग्स रीसेट करें',
    resetSettingsDesc: 'डिफ़ॉल्ट थीम और विकल्पों को पुनर्स्थापित करें',
    clearAllBtn: 'कैश साफ करें और लॉगआउट करें',
    clearAllDesc: 'सभी डेटा मिटाएं और लॉगिन स्क्रीन पर जाएं',
    settingsSaved: 'प्राथमिकताएं सहेजी गईं',
    soundPlayed: 'ध्वनि पूर्वावलोकन बजाया गया',
  },
  ja: {
    dashboard: 'ダッシュボード',
    availablePolls: '利用可能な投票',
    createPoll: '投票を作成',
    myPolls: 'マイ投票',
    pollHistory: '投票履歴',
    profile: 'プロフィール',
    settings: '設定',
    logout: 'ログアウト',
    brandSub: 'リアルタイム投票システム',
    greetingMorning: 'おはようございます',
    greetingAfternoon: 'こんにちは',
    greetingEvening: 'こんばんは',
    dashboardSub: '本日のPollLiveの状況です。',
    activePollsStat: '進行中の投票',
    myPollsStat: 'マイ投票',
    completedPollsStat: '完了した投票',
    realTimeVoting: 'リアルタイム投票',
    currentActivePolls: '進行中の投票',
    currentActiveSub: '現在投票を受け付けています',
    viewAll: 'すべて見る',
    noActivePolls: '進行中の投票はありません',
    createToStart: '投票を作成して始めましょう！',
    quickActions: 'クイックアクション',
    createPollDesc: 'カスタム選択肢で新しい投票を設定',
    pollHistoryDesc: '完了したアーカイブ投票を閲覧',
    quickSettings: 'クイック設定 & テーマ',
    quickSettingsSub: 'テーマ、モード、言語をカスタマイズ',
    vote: '投票する',
    results: '結果を見る',
    optionsCount: '件の選択肢',
    by: '作成者',
    hoursLeft: '時間残り',
    settingsTitle: '設定と環境設定',
    settingsSubtitle: 'テーマ、外観、言語、ログアウト設定をカスタマイズ',
    tabAppearance: '外観とテーマ',
    tabLanguage: '言語設定',
    tabPreferences: 'サウンドと設定',
    tabAccount: 'アカウントとログアウト',
    colorMode: 'カラーモード',
    modeLight: 'ライトモード',
    modeDark: 'ダークモード',
    modeSystem: 'システム設定に従う',
    themePalette: 'カラーパレット',
    themeOcean: 'オーシャンブルー',
    themeEmerald: 'エメラルドグリーン',
    themePurple: 'ロイヤルパープル',
    themeAmber: 'サンセットアンバー',
    themeNeon: 'サイバーパンクネオン',
    themeCrimson: 'クリムゾンローズ',
    animationsToggle: 'UIアニメーション',
    animationsSub: 'スムーズなトランジションを有効化',
    compactToggle: 'コンパクト表示',
    compactSub: 'カードをコンパクトに表示',
    languageTitle: '言語の選択',
    languageSub: 'PollLiveの表示言語を選択してください',
    soundEffects: '投票サウンド効果',
    soundEffectsSub: '投票時に確認音を再生',
    testSound: 'サウンドをテスト',
    autoRefresh: '自動更新',
    autoRefreshSub: 'アクティブな投票リストを自動同期',
    sessionInfo: '現在のセッション情報',
    loggedInAs: 'ログイン中:',
    userId: 'ユーザーID',
    securityStatus: 'セキュリティ状態',
    securityGood: 'JWTトークンで保護されています',
    logoutActions: 'ログアウトとセッション操作',
    logoutBtn: 'ログアウト',
    logoutDesc: 'この端末でのセッションを安全に終了',
    resetSettingsBtn: '設定を初期化',
    resetSettingsDesc: 'テーマと設定をデフォルトに戻す',
    clearAllBtn: 'キャッシュを消去してログアウト',
    clearAllDesc: '全ローカルデータを消去してログイン画面へ',
    settingsSaved: '設定が保存されました',
    soundPlayed: 'サウンドテストを再生しました',
  },
  zh: {
    dashboard: '控制面板',
    availablePolls: '进行中的投票',
    createPoll: '创建投票',
    myPolls: '我的投票',
    pollHistory: '历史记录',
    profile: '个人资料',
    settings: '设置',
    logout: '退出登录',
    brandSub: '实时在线投票系统',
    greetingMorning: '早上好',
    greetingAfternoon: '下午好',
    greetingEvening: '晚上好',
    dashboardSub: '以下是 PollLive 今天的最新动态。',
    activePollsStat: '进行中投票',
    myPollsStat: '我创建的投票',
    completedPollsStat: '已结束投票',
    realTimeVoting: '实时计票',
    currentActivePolls: '进行中投票',
    currentActiveSub: '当前开放投票的项目',
    viewAll: '查看全部',
    noActivePolls: '暂无进行中的投票',
    createToStart: '立即创建一个投票开始吧！',
    quickActions: '快捷操作',
    createPollDesc: '自定义选项并开启全新投票',
    pollHistoryDesc: '浏览已归档的历史投票',
    quickSettings: '快速设置与主题',
    quickSettingsSub: '个性化定制您的明暗模式、色彩主题与界面语言',
    vote: '立即投票',
    results: '查看结果',
    optionsCount: '个选项',
    by: '发起人',
    hoursLeft: '小时后截止',
    settingsTitle: '系统设置与偏好',
    settingsSubtitle: '自定义主题风格、明暗模式、语言及退出登录管理',
    tabAppearance: '外观与主题',
    tabLanguage: '界面语言',
    tabPreferences: '音效与偏好',
    tabAccount: '账户与退出',
    colorMode: '显示模式',
    modeLight: '浅色模式',
    modeDark: '深色模式',
    modeSystem: '跟随系统',
    themePalette: '色彩主题',
    themeOcean: '海洋湛蓝',
    themeEmerald: '翡翠葱绿',
    themePurple: '皇家紫罗',
    themeAmber: '日落琥珀',
    themeNeon: '赛博霓虹',
    themeCrimson: '深红玫瑰',
    animationsToggle: '界面动画特效',
    animationsSub: '开启平滑过渡和微动效',
    compactToggle: '紧凑卡片布局',
    compactSub: '以更加精简的方式展示投票列表',
    languageTitle: '选择显示语言',
    languageSub: '选择您在 PollLive 中习惯使用的语言',
    soundEffects: '投票音效反馈',
    soundEffectsSub: '在成功提交投票时播放提示音',
    testSound: '试听音效',
    autoRefresh: '自动刷新数据',
    autoRefreshSub: '自动同步最新的投票动态',
    sessionInfo: '当前登录会话',
    loggedInAs: '当前用户',
    userId: '用户编号',
    securityStatus: '安全状态',
    securityGood: '已启用 JWT 令牌安全加密保护',
    logoutActions: '退出与会话控制',
    logoutBtn: '安全退出登录',
    logoutDesc: '安全结束当前浏览器的登录会话',
    resetSettingsBtn: '恢复默认设置',
    resetSettingsDesc: '重置所有主题和本地偏好设置',
    clearAllBtn: '清除缓存并强制退出',
    clearAllDesc: '清除所有本地存储并返回登录页',
    settingsSaved: '偏好设置已更新',
    soundPlayed: '音效预览已播放',
  }
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  // Mode: light | dark | system
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('polllive_mode') || 'light';
  });

  // Theme: ocean | emerald | purple | amber | neon | crimson
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('polllive_theme') || 'ocean';
  });

  // Language: en | es | fr | de | hi | ja | zh
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('polllive_language') || 'en';
  });

  // Preferences
  const [animations, setAnimationsState] = useState(() => {
    return localStorage.getItem('polllive_animations') !== 'false';
  });

  const [soundEffects, setSoundEffectsState] = useState(() => {
    return localStorage.getItem('polllive_sounds') !== 'false';
  });

  const [compactCards, setCompactCardsState] = useState(() => {
    return localStorage.getItem('polllive_compact') === 'true';
  });

  const [autoRefresh, setAutoRefreshState] = useState(() => {
    return localStorage.getItem('polllive_autorefresh') !== 'false';
  });

  // Sync mode with HTML data-mode
  useEffect(() => {
    const applyMode = () => {
      let resolvedMode = mode;
      if (mode === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedMode = isDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-mode', resolvedMode);
    };

    applyMode();

    if (mode === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyMode();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [mode]);

  // Sync theme palette with HTML data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync animations
  useEffect(() => {
    document.documentElement.setAttribute('data-animations', animations ? 'true' : 'false');
  }, [animations]);

  // Handlers
  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem('polllive_mode', newMode);
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('polllive_theme', newTheme);
  };

  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('polllive_language', newLang);
  };

  const setAnimations = (val) => {
    setAnimationsState(val);
    localStorage.setItem('polllive_animations', val ? 'true' : 'false');
  };

  const setSoundEffects = (val) => {
    setSoundEffectsState(val);
    localStorage.setItem('polllive_sounds', val ? 'true' : 'false');
  };

  const setCompactCards = (val) => {
    setCompactCardsState(val);
    localStorage.setItem('polllive_compact', val ? 'true' : 'false');
  };

  const setAutoRefresh = (val) => {
    setAutoRefreshState(val);
    localStorage.setItem('polllive_autorefresh', val ? 'true' : 'false');
  };

  // Translation helper
  const t = useCallback(
    (key) => {
      const langDict = translations[language] || translations.en;
      return langDict[key] || translations.en[key] || key;
    },
    [language]
  );

  // Synthesized Web Audio Sound Generator (Zero external audio files needed!)
  const playSound = useCallback((type = 'vote') => {
    if (!soundEffects && type !== 'test') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'vote' || type === 'test' || type === 'success') {
        // Dual harmonic chime
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5
        osc2.frequency.setValueAtTime(440.0, now); // A4
        osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } else if (type === 'click') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // AudioContext not allowed before user gesture or unsupported
    }
  }, [soundEffects]);

  // Reset settings
  const resetSettings = () => {
    setMode('light');
    setTheme('ocean');
    setLanguage('en');
    setAnimations(true);
    setSoundEffects(true);
    setCompactCards(false);
    setAutoRefresh(true);
  };

  // Full clean logout
  const clearAllAndLogout = (logoutFn, navigateFn) => {
    localStorage.clear();
    resetSettings();
    if (logoutFn) logoutFn();
    if (navigateFn) navigateFn('/login');
  };

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
