import React, { useMemo } from 'react';
import { User, UserRole } from '../types.ts';
import { 
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  MapPin,
  Search,
  Globe,
  Headphones,
  Zap,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { MOCK_NEWS, MOCK_REQUESTS, MOCK_USERS } from '../constants.tsx';

type IconComponent = React.ComponentType<{ className?: string }>;

function parseBudgetAverage(budget?: string): number | null {
  if (!budget) return null;
  const matches = budget
    .replace(',', '.')
    .match(/\d+(?:\.\d+)?/g)
    ?.map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (!matches || matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return (matches[0] + matches[1]) / 2;
}

function renderStatCard(params: {
  label: string;
  value: string;
  trend: string;
  icon: IconComponent;
}): React.ReactNode {
  const { label, value, trend, icon: Icon } = params;
  const isPositive = !trend.trim().startsWith('-');

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
          <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend}
          </div>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  user: User;
  navigate: (path: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, navigate }) => {
  const myDossier = useMemo(
    () => MOCK_REQUESTS.find((r) => r.requesterId === user.id),
    [user.id]
  );

  const assignedExpert = useMemo(() => {
    if (!myDossier?.expertId) return null;
    return MOCK_USERS.find((u) => u.id === myDossier.expertId) ?? null;
  }, [myDossier?.expertId]);

  const expertActiveRequests = useMemo(
    () => {
      // Si l'utilisateur est un mock (ID court) ou un user réel (ID long), on adapte la logique
      // Pour la démo, si c'est un user réel mais sans dossiers, on peut renvoyer vide ou simuler
      if (user.id.length > 5 && MOCK_REQUESTS.every(r => r.expertId.length <= 2)) {
         // C'est un user Firebase réel vs Mocks. On ne trouvera rien.
         // On peut décider d'afficher tous les mocks pour la démo si on veut peupler le dashboard
         return MOCK_REQUESTS.filter(r => r.status !== 'Clôturé');
      }
      return MOCK_REQUESTS.filter(
        (r) => r.expertId === user.id && r.status !== 'Clôturé'
      );
    },
    [user.id]
  );

  const expertRevenue = useMemo(() => {
    const total = expertActiveRequests.reduce((sum, r) => {
      const avg = parseBudgetAverage(r.budget);
      return sum + (avg ?? 0);
    }, 0);
    return total;
  }, [expertActiveRequests]);

  const governancePosts = useMemo(() => {
    return MOCK_NEWS
      .filter((p) => p.isAlert || /\b(IRCC|MIFI)\b/i.test(p.content) || p.category === 'OFFICIEL')
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, []);

  const activity7d = useMemo(
    () => [
      { day: 'Lun', value: 6 },
      { day: 'Mar', value: 9 },
      { day: 'Mer', value: 4 },
      { day: 'Jeu', value: 11 },
      { day: 'Ven', value: 8 },
      { day: 'Sam', value: 3 },
      { day: 'Dim', value: 7 },
    ],
    []
  );

  const demandeurSteps = useMemo(() => {
    const docs = myDossier?.documents ?? [];
    const docsValidated = docs.length > 0 && docs.every((d) => d.status === 'VALIDATED');
    const paymentDone = Boolean(myDossier?.expertId);
    const depotDone = docsValidated && paymentDone;
    const suiviDone = myDossier?.status === 'En cours' && depotDone;
    const decisionDone = myDossier?.status === 'Clôturé';

    const steps = [
      { key: 'docs', label: 'Documents', done: docsValidated },
      { key: 'payment', label: 'Paiement', done: paymentDone },
      { key: 'depot', label: 'Dépôt', done: depotDone },
      { key: 'suivi', label: 'Suivi', done: suiviDone },
      { key: 'decision', label: 'Décision', done: decisionDone },
    ];

    const doneCount = steps.filter((s) => s.done).length;
    const progressPct = Math.round((doneCount / steps.length) * 100);
    return { steps, doneCount, progressPct };
  }, [myDossier]);

  const renderDemandeurDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="mauve-gradient rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit text-[10px] font-bold uppercase tracking-widest">
              <MapPin className="w-3 h-3" /> Espace Demandeur - Capitune Canada
            </div>
            <h1 className="text-4xl font-black">Bienvenue dans votre projet, {user.name}</h1>
            <p className="text-purple-100 max-w-xl text-lg font-medium">Votre écosystème sécurisé pour réussir votre installation au Canada avec des experts certifiés.</p>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Conforme CRIC
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Gouvernance & Traçabilité
              </span>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={() => navigate('directory')} className="px-8 py-3.5 bg-white text-purple-700 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                Trouver un Expert Certifié
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStatCard({
                label: 'Étapes du dossier',
                value: `${demandeurSteps.doneCount}/5`,
                trend: '+12.5%',
                icon: BarChart3,
              })}
              {renderStatCard({
                label: 'Documents validés',
                value: `${(myDossier?.documents ?? []).filter((d) => d.status === 'VALIDATED').length}`, 
                trend: '+4.1%',
                icon: FileText,
              })}
              {renderStatCard({
                label: 'Sécurité & conformité',
                value: 'CRIC',
                trend: '+0.0%',
                icon: ShieldCheck,
              })}
              {renderStatCard({
                label: 'Support expert',
                value: assignedExpert ? 'Assigné' : 'À assigner',
                trend: assignedExpert ? '+2.0%' : '-1.0%',
                icon: Users,
              })}
            </div>

            <section className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-6">
                <h3 className="text-lg font-black text-slate-900">Progression du dossier</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{demandeurSteps.progressPct}%</p>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {demandeurSteps.steps.map((s) => (
                  <div key={s.key} className={`h-3 rounded-full ${s.done ? 'mauve-gradient' : 'bg-slate-100'}`} />
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
                {demandeurSteps.steps.map((s) => (
                  <div key={s.key} className={`px-4 py-3 rounded-2xl border text-center ${s.done ? 'bg-purple-50/60 border-purple-100' : 'bg-white border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${s.done ? 'text-purple-700' : 'text-slate-400'}`}>{s.label}</p>
                    <p className={`text-xs font-bold mt-1 ${s.done ? 'text-slate-900' : 'text-slate-500'}`}>{s.done ? 'OK' : 'À faire'}</p>
                  </div>
                ))}
              </div>
            </section>

            {assignedExpert && (
              <section className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-600" /> Mon Expert Assigné
                </h3>
                <div className="flex items-center gap-6">
                  <img src={assignedExpert.avatar} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" alt="" />
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{assignedExpert.name}</h4>
                    <p className="text-sm font-bold text-purple-600 uppercase tracking-widest">{assignedExpert.specialty}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-5">Analyse de performance (7 jours)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity7d} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 900 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10, fontWeight: 900 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-4">Activité estimée (mock) : dépôts, échanges et validations.</p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">News MIFI / IRCC</h3>
                </div>
                <div className="space-y-3">
                  {governancePosts.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex gap-2 group cursor-pointer hover:bg-white/5 p-2 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-snug line-clamp-3">
                          {p.content}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                          {p.category}{p.isAlert ? ' • ALERTE' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Zap className="w-4 h-4 text-purple-600" /> Gouvernance Express
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem('capitune:v3:marketplace:create', '1');
                    navigate('marketplace');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Créer un nouveau dossier</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('capitune:v3:system-notification', {
                        detail: {
                          title: 'Rapport hebdomadaire',
                          message: 'Votre rapport hebdomadaire a été généré (simulé).',
                        },
                      })
                    );
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Générer un rapport hebdomadaire</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  onClick={() => {
                    window.open('https://www.canada.ca/fr/immigration-refugies-citoyennete.html', '_blank', 'noreferrer');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Consulter les dernières lois</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderExpertDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="mauve-gradient rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Espace Expert CRIC - Capitune Canada
            </div>
            <h1 className="text-4xl font-black">Tableau de bord, {user.name}</h1>
            <p className="text-purple-100 max-w-2xl text-lg font-medium">Pilotez vos dossiers actifs, suivez vos performances et restez conforme aux standards CRIC.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStatCard({
                label: 'Revenus (dossiers actifs)',
                value: `${Math.round(expertRevenue)}$`,
                trend: '+8.2%',
                icon: DollarSign,
              })}
              {renderStatCard({
                label: 'Dossiers actifs',
                value: `${expertActiveRequests.length}`,
                trend: '+3.4%',
                icon: FileText,
              })}
              {renderStatCard({
                label: 'Satisfaction',
                value: '4.9/5',
                trend: '+0.4%',
                icon: Star,
              })}
              {renderStatCard({
                label: 'Clients servis',
                value: `${new Set(expertActiveRequests.map((r) => r.requesterId)).size}`,
                trend: '+1.1%',
                icon: Users,
              })}
            </div>

            <section className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-5">Analyse de performance (7 jours)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity7d} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 900 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10, fontWeight: 900 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-4">Activité estimée (mock) : consultations, retours et validations.</p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Veille Gouvernance</h3>
                </div>
                <div className="space-y-3">
                  {governancePosts.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex gap-2 group cursor-pointer hover:bg-white/5 p-2 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                      <p className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-snug line-clamp-3">
                        {p.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Zap className="w-4 h-4 text-purple-600" /> Gouvernance Express
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('marketplace')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Accéder à mes dossiers</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('capitune:v3:system-notification', {
                        detail: {
                          title: 'Rapport hebdomadaire',
                          message: 'Rapport hebdomadaire expert généré (simulé).',
                        },
                      })
                    );
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Générer un rapport hebdo</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={() => window.open('https://www.canada.ca/fr/immigration-refugies-citoyennete.html', '_blank', 'noreferrer')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Consulter IRCC</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  switch (user.role) {
    case UserRole.ADMIN: return <div className="p-8 font-black text-2xl text-slate-800">Admin Dashboard</div>;
    case UserRole.PROFESSIONNEL: return renderExpertDashboard();
    default: return renderDemandeurDashboard();
  }
};

export default Dashboard;