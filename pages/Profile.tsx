import React, { useState } from 'react';
import { User, VerificationStatus } from '../types';
import { 
  User as UserIcon, 
  MapPin, 
  Settings, 
  Save, 
  X,
  Shield,
  Activity,
  Award,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { updateUserProfile } from '../lib/db';

interface ProfileProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

export default function Profile({ user, onUpdateUser }: ProfileProps) {
  // Mode toggle: Lecture / Édition
  const [isEditing, setIsEditing] = useState(false);
  
  // État local du formulaire
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    isPublic: user.isPublic,
  });

  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronisation conditionnelle (seulement hors édition)
  React.useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        isPublic: user.isPublic,
      });
    }
  }, [user, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const tooglePublic = () => {
    setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage('');

    try {
      // 1. Mise à jour Firestore
      if (user.id) {
        await updateUserProfile(user.id, formData);
      }
      
      // 2. Mise à jour UI parent
      onUpdateUser(formData);
      
      setStatus('success');
      
      // Fermeture automatique après succès
      setTimeout(() => {
        setStatus('idle');
        setIsEditing(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || "Erreur de sauvegarde");
    }
  };

  // VUE LECTURE SEULE
  if (!isEditing) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="relative group">
               <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-slate-100"
              />
              {user.verificationStatus === VerificationStatus.VERIFIED && (
                <div className="absolute -bottom-1 -right-1 bg-green-50 text-green-600 p-1.5 rounded-full border border-green-100 shadow-sm">
                  <Shield className="w-5 h-5 fill-green-600/20" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                {user.name}
                {user.isPublic ? 
                  <span className="bg-green-100/50 text-green-700 border border-green-200 text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Public
                  </span> :
                  <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Privé
                  </span>
                }
              </h1>
              <p className="text-slate-500 font-bold text-lg">{user.email}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-slate-600">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg"><MapPin className="w-4 h-4 text-purple-600" /> {user.location || 'Canada'}</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg"><Award className="w-4 h-4 text-purple-600" /> {user.role}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-200"
          >
            <Settings className="w-5 h-5" />
            Modifier le profil
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <UserIcon className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                <span className="p-2 bg-purple-50 rounded-xl text-purple-600"><UserIcon className="w-6 h-6" /></span>
                Biographie Professionnelle
              </h3>
              <p className="text-slate-600 leading-relaxed text-lg font-medium relative z-10">
                {user.bio || "Aucune biographie renseignée pour le moment."}
              </p>
            </section>

            <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-blue-50 rounded-xl text-blue-600"><Activity className="w-6 h-6" /></span>
                Dernières Activités
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                  <p className="font-bold text-slate-700">Connexion détectée aujourd'hui</p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                  <p className="font-bold text-slate-700">Profil mis à jour le {new Date(user.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
              <h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase tracking-widest relative z-10">Gouvernance</h3>
              <div className="space-y-4 text-sm relative z-10">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-slate-400 font-bold">Statut</span>
                  <span className="font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg border border-green-400/20">{user.status}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-slate-400 font-bold">Vérifié</span>
                  <span className="font-black text-white">{user.verificationStatus === VerificationStatus.VERIFIED ? 'OUI' : 'NON'}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-white/10">
                   <p className="text-xs text-slate-500 font-mono">ID: {user.id}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // VUE MODE ÉDITION (MODAL / FULLSCREEN)
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Settings className="w-7 h-7 text-purple-600" />
            Modifier le profil
          </h2>
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-full transition-all shadow-sm hover:shadow-md"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nom complet</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-bold text-slate-900 text-lg placeholder:text-slate-300"
              placeholder="Votre nom complet"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Biographie</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={5}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-slate-700 text-base resize-none placeholder:text-slate-300"
              placeholder="Parlez-nous de vous..."
            />
          </div>

          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${formData.isPublic ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                 {formData.isPublic ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Profil Public</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Visible dans l'annuaire</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={tooglePublic}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500/20 ${formData.isPublic ? 'bg-purple-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${formData.isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-800 rounded-2xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="px-10 py-4 bg-purple-600 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-200 hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {status === 'saving' ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Enregistrer
                </>
              )}
            </button>
          </div>

          {status === 'success' && (
            <div className="p-4 bg-green-50 text-green-700 font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 border border-green-100 w-full">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span>Modifications enregistrées avec succès ! Fermeture...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 border border-red-100 w-full">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
