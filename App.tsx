import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Users, 
  FolderOpen, 
  Calendar, 
  MessageSquare, 
  LayoutDashboard, 
  ShieldCheck, 
  Menu, 
  ChevronRight,
  Plus,
  Globe,
  Bell,
  Search,
  MessageCirclePlus,
  FilePlus,
  FileText,
  UserPlus,
  LogOut,
  Loader2
} from 'lucide-react';
import { User, UserRole, Notification, VerificationStatus } from './types.ts';
import { MOCK_USERS, MOCK_NOTIFICATIONS } from './constants.tsx';
import { auth, onAuthStateChanged, signOut } from './lib/firebase.ts';
import { getUserProfile, createUserProfile } from './lib/db.ts';

// Components
import ChatWidget from './components/ChatWidget.tsx';
import Login from './pages/Login.tsx';

// Pages
import Dashboard from './pages/Dashboard.tsx';
import Directory from './pages/Directory.tsx';
import Marketplace from './pages/Marketplace.tsx';
import Events from './pages/Events.tsx';
import Community from './pages/Community.tsx';
import Admin from './pages/Admin.tsx';
import Profile from './pages/Profile.tsx';
import ProNetwork from './pages/ProNetwork.tsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('[App] Initializing auth listener...');
    
    // Timeout de sécurité pour ne pas bloquer l'UI indéfiniment
    const timer = setTimeout(() => {
      console.warn('[App] Auth timeout reached - Forcing release of loading state');
      setAuthLoading(false);
    }, 6000); // 6 secondes max

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[App] Auth state changed:', user ? `User ${user.uid}` : 'No user');
      clearTimeout(timer); // On annule le timeout si Firebase répond
      setFirebaseUser(user);
      if (user) {
        try {
          // Tenter de récupérer le profil existant
          const existingProfile = await getUserProfile(user.uid);
          
          if (existingProfile) {
            setCurrentUser(existingProfile);
          } else {
            // Créer un nouveau profil si inexistant
            const newUser: User = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || "Utilisateur",
              email: user.email || "",
              avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
              role: user.email?.includes('admin') ? UserRole.ADMIN : user.email?.includes('pro') ? UserRole.PROFESSIONNEL : UserRole.PARTICULIER,
              verificationStatus: VerificationStatus.VERIFIED, // À ajuster selon logique métier réelle
              joinedAt: new Date().toISOString(),
              status: 'ACTIF',
              isPublic: true
            };
            try {
              await createUserProfile(newUser);
              setCurrentUser(newUser);
            } catch (createError) {
              console.error("Erreur création profil, utilisation fallback locaux", createError);
              setCurrentUser(newUser); // On utilise l'objet local même si la save Firestore échoue
            }
          }
        } catch (error) {
          console.error("Erreur lors de la gestion du profil utilisateur:", error);
          // Fallback en cas d'erreur DB pour ne pas bloquer l'UI complètement
           const fallbackUser: User = {
            id: user.uid,
            name: user.displayName || "Utilisateur",
            email: user.email || "",
            avatar: user.photoURL || "", 
            role: UserRole.PARTICULIER,
            verificationStatus: VerificationStatus.PENDING,
            joinedAt: new Date().toISOString(),
            status: 'ACTIF',
            isPublic: false
          };
          setCurrentUser(fallbackUser);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
      console.log('[App] Auth loading complete');
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (tab: string) => {
    window.location.hash = tab;
    setActiveTab(tab);
    setIsSidebarOpen(false);
    setIsNotifOpen(false);
    setIsQuickActionOpen(false);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const container = headerActionsRef.current;
      if (!container) return;
      if (!(event.target instanceof Node)) return;
      if (!container.contains(event.target)) {
        setIsNotifOpen(false);
        setIsQuickActionOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsNotifOpen(false);
      setIsQuickActionOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const pushSystemNotification = useCallback((title: string, message: string) => {
    setNotifications((prev) => [
      {
        id: `not-${Date.now()}`,
        title,
        message,
        type: 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ title?: string; message?: string }>;
      const title = custom.detail?.title;
      const message = custom.detail?.message;
      if (!title || !message) return;
      pushSystemNotification(title, message);
    };

    window.addEventListener('capitune:v3:system-notification', handler as EventListener);
    return () => window.removeEventListener('capitune:v3:system-notification', handler as EventListener);
  }, [pushSystemNotification]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Initialisation Capitune...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const navItems = [
    { id: 'home', label: 'Tableau de bord', icon: LayoutDashboard, roles: [UserRole.PARTICULIER, UserRole.PROFESSIONNEL, UserRole.ADMIN] },
    { id: 'marketplace', label: 'Mes Dossiers', icon: FolderOpen, roles: [UserRole.PARTICULIER, UserRole.PROFESSIONNEL, UserRole.ADMIN] },
    { id: 'directory', label: 'Annuaire Experts', icon: Users, roles: [UserRole.PARTICULIER, UserRole.PROFESSIONNEL, UserRole.ADMIN] },
    { id: 'network', label: 'Réseau Pro', icon: Globe, roles: [UserRole.PROFESSIONNEL, UserRole.ADMIN] },
    { id: 'events', label: 'Webinaires', icon: Calendar, roles: [UserRole.PARTICULIER, UserRole.PROFESSIONNEL, UserRole.ADMIN] },
    { id: 'community', label: 'Communauté', icon: MessageSquare, roles: [UserRole.PARTICULIER, UserRole.PROFESSIONNEL, UserRole.ADMIN] },
    { id: 'admin', label: 'Administration', icon: ShieldCheck, roles: [UserRole.ADMIN] },
  ];

  const handleUpdateUser = useCallback((data: Partial<User>) => {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev));
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard user={currentUser} navigate={navigate} />;
      case 'directory': return <Directory />;
      case 'marketplace': return <Marketplace user={currentUser} />;
      case 'events': return <Events user={currentUser} />;
      case 'community': return <Community user={currentUser} />;
      case 'network': return <ProNetwork />;
      case 'admin': return <Admin />;
      case 'profile': return currentUser ? <Profile user={currentUser} onUpdateUser={handleUpdateUser} /> : <div>Chargement...</div>;
      default: return currentUser ? <Dashboard user={currentUser} navigate={navigate} /> : <div>Chargement...</div>;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 mauve-gradient rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-200">
            C
          </div>
          <div>
             <span className="text-2xl font-black text-slate-800 tracking-tight block">Capitune</span>
             <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest text-left">Canada Edition</span>
          </div>
        </div>

        <nav className="mt-8 px-6 space-y-2">
          {navItems.filter(item => item.roles.includes(currentUser.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-[20px] text-sm font-bold transition-all
                ${activeTab === item.id 
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-100 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 bg-white">
          <div 
            onClick={() => navigate('profile')}
            className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100"
          >
            <img src={currentUser.avatar} alt="User" className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover" />
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase">{currentUser.role === UserRole.PROFESSIONNEL ? 'Expert CRIC' : currentUser.role}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 h-20 px-8 flex items-center justify-between">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="lg:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher un dossier, un expert, une formation..." 
                className="w-full pl-12 pr-6 py-3 bg-slate-100/50 border-2 border-transparent rounded-[20px] text-sm focus:bg-white focus:border-purple-200 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div ref={headerActionsRef} className="flex items-center gap-4 relative">
            <button
              type="button"
              aria-label="Ouvrir les actions rapides"
              onClick={() => {
                setIsQuickActionOpen((v) => !v);
                setIsNotifOpen(false);
              }}
              className={`p-3 rounded-full relative transition-all ${isQuickActionOpen ? 'bg-purple-100 text-purple-600' : 'text-slate-600 hover:bg-slate-100'}`}
              title="Actions rapides"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`p-3 rounded-full relative transition-all ${isNotifOpen ? 'bg-purple-100 text-purple-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isQuickActionOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Actions rapides</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gouvernance Express</p>
                </div>

                <div className="p-3 space-y-2">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('capitune:v3:marketplace:create', '1');
                      navigate('marketplace');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <FilePlus className="w-5 h-5 text-purple-600" />
                    Créer un nouveau dossier
                  </button>

                  <button
                    onClick={() => {
                      pushSystemNotification('Rapport hebdomadaire', 'Votre rapport hebdomadaire a été généré (simulé).');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-purple-600" />
                    Générer un rapport hebdomadaire
                  </button>

                  <button
                    onClick={() => {
                      pushSystemNotification('Législation', 'Ouverture des dernières mises à jour MIFI/IRCC (simulé).');
                      window.open('https://www.canada.ca/fr/immigration-refugies-citoyennete.html', '_blank', 'noreferrer');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-purple-600" />
                    Consulter les dernières lois
                  </button>
                </div>
              </div>
            )}

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700"
                    >
                      Tout lire
                    </button>
                  )}
                </div>

                <div className="max-h-105 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-slate-500">Aucune notification.</div>
                  ) : (
                    notifications
                      .slice()
                      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                      .map((n) => (
                        <button
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`w-full text-left px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${n.isRead ? '' : 'bg-purple-50/40'}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className={`text-sm font-black truncate ${n.isRead ? 'text-slate-800' : 'text-slate-900'}`}>{n.title}</p>
                              <p className="text-xs text-slate-500 font-medium leading-snug mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{n.type}</p>
                            </div>
                            {!n.isRead && <span className="mt-1 w-2 h-2 rounded-full bg-purple-600 shrink-0" />}
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-10 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      </main>

      <ChatWidget currentUser={currentUser} />
    </div>
  );
};

export default App;