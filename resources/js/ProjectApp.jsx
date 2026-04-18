import { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = '/api';

const INITIAL_REGISTER = {
    name: '',
    email: '',
    password: '',
    role: 'candidat',
};

const INITIAL_LOGIN = {
    email: '',
    password: '',
};

const INITIAL_PROFILE = {
    titre: '',
    bio: '',
    localisation: '',
    disponible: true,
};

const INITIAL_OFFER = {
    titre: '',
    description: '',
    localisation: '',
    type: 'CDI',
};

const INITIAL_APPLICATION = {
    offre_id: '',
    message: '',
};

function ProjectApp() {
    const [authMode, setAuthMode] = useState('login');
    const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER);
    const [loginForm, setLoginForm] = useState(INITIAL_LOGIN);
    const [profileForm, setProfileForm] = useState(INITIAL_PROFILE);
    const [offerForm, setOfferForm] = useState(INITIAL_OFFER);
    const [applicationForm, setApplicationForm] = useState(INITIAL_APPLICATION);
    const [token, setToken] = useState(() => localStorage.getItem('token') ?? '');
    const [me, setMe] = useState(null);
    const [offers, setOffers] = useState([]);
    const [users, setUsers] = useState([]);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const applicationFormRef = useRef(null);

    const authHeaders = useMemo(() => {
        const headers = { Accept: 'application/json' };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }, [token]);

    useEffect(() => {
        loadOffers();
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            loadMe();
        } else {
            localStorage.removeItem('token');
            setMe(null);
        }
    }, [token]);

    useEffect(() => {
        if (me?.role === 'candidat' && me?.profil) {
            setProfileForm({
                titre: me.profil.titre ?? '',
                bio: me.profil.bio ?? '',
                localisation: me.profil.localisation ?? '',
                disponible: Boolean(me.profil.disponible),
            });
        }
    }, [me]);

    async function request(path, options = {}) {
        const { headers: customHeaders = {}, ...restOptions } = options;

        const response = await fetch(`${API_BASE}${path}`, {
            ...restOptions,
            headers: {
                ...authHeaders,
                ...customHeaders,
            },
        });

        const rawBody = await response.text();
        let payload = null;

        if (rawBody) {
            try {
                payload = JSON.parse(rawBody);
            } catch {
                payload = { message: rawBody };
            }
        }

        if (!response.ok) {
            const validationErrors = payload?.errors ? Object.values(payload.errors).flat().join(' ') : '';
            const message = validationErrors || payload?.message || payload?.error || response.statusText || `Request failed (${response.status})`;
            throw new Error(message);
        }

        return payload;
    }

    async function loadOffers() {
        try {
            const data = await request('/offres', { method: 'GET' });
            setOffers(Array.isArray(data?.data) ? data.data : data ?? []);
        } catch (error) {
            setError(error.message);
        }
    }

    async function loadMe() {
        try {
            const data = await request('/me', { method: 'GET' });
            setMe(data);
        } catch (error) {
            setError(error.message);
            setToken('');
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');

        try {
            const data = await request('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerForm),
            });

            if (data?.token) {
                setToken(data.token);
                setNotice('Compte créé et connecté.');
                setRegisterForm(INITIAL_REGISTER);
                return;
            }

            const loginData = await request('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: registerForm.email,
                    password: registerForm.password,
                }),
            });

            if (!loginData?.token) {
                throw new Error('Réponse invalide du serveur: token absent.');
            }

            setToken(loginData.token);
            setNotice('Compte créé et connecté.');
            setRegisterForm(INITIAL_REGISTER);
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setNotice('');

        try {
            const data = await request('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });

            if (!data?.token) {
                throw new Error('Réponse invalide du serveur: token absent.');
            }

            setToken(data.token);
            setNotice('Connexion réussie.');
            setLoginForm(INITIAL_LOGIN);
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleLogout() {
        try {
            await request('/logout', { method: 'POST' });
        } catch (error) {
            setError(error.message);
        } finally {
            setToken('');
            setNotice('Déconnecté.');
        }
    }

    async function handleProfileSave(event) {
        event.preventDefault();
        setBusy(true);
        setError('');

        try {
            const method = me?.profil ? 'PUT' : 'POST';
            const data = await request('/profil', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm),
            });

            setNotice(me?.profil ? 'Profil mis à jour.' : 'Profil créé.');
            setMe((current) => (current ? { ...current, profil: data } : current));
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleCreateOffer(event) {
        event.preventDefault();
        setBusy(true);
        setError('');

        try {
            await request('/offres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offerForm),
            });

            setNotice('Offre publiée.');
            setOfferForm(INITIAL_OFFER);
            await loadOffers();
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleApply(event) {
        event.preventDefault();
        setBusy(true);
        setError('');

        try {
            await request(`/offres/${applicationForm.offre_id}/candidater`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: applicationForm.message }),
            });

            setNotice('Candidature envoyée.');
            setApplicationForm(INITIAL_APPLICATION);
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function loadUsers() {
        try {
            const data = await request('/admin/users', { method: 'GET' });
            setUsers(Array.isArray(data) ? data : []);
            setNotice('Utilisateurs chargés.');
        } catch (error) {
            setError(error.message);
        }
    }

    async function removeUser(userId) {
        try {
            await request(`/admin/users/${userId}`, { method: 'DELETE' });
            setUsers((current) => current.filter((user) => user.id !== userId));
            setNotice('Utilisateur supprimé.');
        } catch (error) {
            setError(error.message);
        }
    }

    async function toggleOffer(offer) {
        try {
            const updated = await request(`/admin/offres/${offer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actif: !offer.actif }),
            });

            const nextActif = Boolean(updated?.offre?.actif ?? !offer.actif);

            setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, actif: nextActif } : item)));
            setNotice(nextActif ? `Offre ${offer.id} activée.` : `Offre ${offer.id} désactivée.`);

            if (!nextActif) {
                setOffers((current) => current.filter((item) => item.id !== offer.id));
            }
        } catch (error) {
            setError(error.message);
        }
    }

    function handleSelectOffer(offerId) {
        setError('');
        setApplicationForm((current) => ({ ...current, offre_id: String(offerId) }));

        if (!token) {
            setAuthMode('login');
            setNotice('Offre sélectionnée. Connectez-vous en candidat pour postuler.');
            return;
        }

        if (me?.role !== 'candidat') {
            setNotice('Offre sélectionnée. Seul un compte candidat peut envoyer une candidature.');
            return;
        }

        setNotice(`Offre #${offerId} sélectionnée. Complétez votre message puis cliquez sur Postuler.`);
        applicationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const role = me?.role ?? 'visiteur';
    const selectedOfferId = Number(applicationForm.offre_id) || null;

    return (
        <div className="min-h-screen bg-[#07111f] text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 left-[-8rem] h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
                <div className="absolute top-40 right-[-7rem] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
            </div>

            <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
                <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Projet Laravel</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                                Votre espace de recrutement, pas une simple vitrine backend.
                            </h1>
                            <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
                                Connectez-vous, créez votre profil, publiez des offres ou gérez la plateforme selon votre rôle.
                                L’interface parle directement à votre API Laravel.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                            {[
                                { label: 'Mode', value: role },
                                { label: 'Statut', value: token ? 'Connecté' : 'Public' },
                                { label: 'App', value: 'React' },
                            ].map((metric) => (
                                <div key={metric.label} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                                    <div className="text-lg font-semibold text-cyan-300">{metric.value}</div>
                                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(notice || error) && (
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            {notice && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}
                            {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>}
                        </div>
                    )}
                </header>

                <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl lg:p-8">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setAuthMode('login')}
                                className={`rounded-full px-4 py-2 text-sm transition ${authMode === 'login' ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                            >
                                Connexion
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthMode('register')}
                                className={`rounded-full px-4 py-2 text-sm transition ${authMode === 'register' ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                            >
                                Inscription
                            </button>
                            {token && (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-full bg-rose-500/15 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/25"
                                >
                                    Déconnexion
                                </button>
                            )}
                        </div>

                        {!token && authMode === 'login' && (
                            <form onSubmit={handleLogin} className="mt-6 grid gap-4">
                                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
                                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Mot de passe" type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
                                <button disabled={busy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">
                                    Se connecter
                                </button>
                            </form>
                        )}

                        {!token && authMode === 'register' && (
                            <form onSubmit={handleRegister} className="mt-6 grid gap-4">
                                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Nom" value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} />
                                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
                                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Mot de passe" type="password" minLength={8} value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
                                <p className="text-xs text-slate-400">8 caractères minimum.</p>
                                <select className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 outline-none" value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                                    <option value="candidat">Candidat</option>
                                    <option value="recruteur">Recruteur</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button disabled={busy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">
                                    Créer le compte
                                </button>
                            </form>
                        )}

                        {token && me && (
                            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Compte connecté</div>
                                <div className="mt-3 text-xl font-semibold text-white">{me.name}</div>
                                <div className="mt-1 text-sm text-slate-300">{me.email}</div>
                                <div className="mt-3 inline-flex rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-medium text-cyan-100">{role}</div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6">
                        <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-xl lg:p-8">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Offres disponibles</h2>
                                    <p className="text-sm text-slate-400">Liste publique depuis votre API Laravel.</p>
                                </div>
                                <button type="button" onClick={loadOffers} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                                    Rafraîchir
                                </button>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                {offers.map((offer) => (
                                    <article key={offer.id} className={`flex h-full flex-col rounded-3xl border p-5 ${selectedOfferId === offer.id ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-white/10 bg-white/5'}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{offer.titre}</h3>
                                                <p className="mt-1 text-sm text-slate-400">{offer.localisation || 'Localisation non précisée'} • {offer.type}</p>
                                            </div>
                                        </div>
                                        <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{offer.description}</p>
                                        <div className="mt-5 flex items-center justify-between gap-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${offer.actif ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-700/40 text-slate-300'}`}>
                                                {offer.actif ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectOffer(offer.id)}
                                                className={`rounded-full px-4 py-2 text-sm transition ${selectedOfferId === offer.id ? 'bg-cyan-300 text-slate-950' : 'bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25'}`}
                                            >
                                                {selectedOfferId === offer.id ? 'Sélectionnée' : 'Sélectionner'}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {selectedOfferId ? (
                                <p className="mt-4 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                                    Offre sélectionnée: #{selectedOfferId}. Faites défiler vers l'espace candidat pour envoyer la candidature.
                                </p>
                            ) : null}
                        </section>

                        {token && me?.role === 'candidat' && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-xl lg:p-8">
                                <h2 className="text-xl font-semibold text-white">Espace candidat</h2>
                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    <form onSubmit={handleProfileSave} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Profil</h3>
                                        <input className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Titre" value={profileForm.titre} onChange={(event) => setProfileForm({ ...profileForm, titre: event.target.value })} />
                                        <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Bio" value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} />
                                        <input className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Localisation" value={profileForm.localisation} onChange={(event) => setProfileForm({ ...profileForm, localisation: event.target.value })} />
                                        <label className="flex items-center gap-3 text-sm text-slate-300">
                                            <input type="checkbox" checked={profileForm.disponible} onChange={(event) => setProfileForm({ ...profileForm, disponible: event.target.checked })} />
                                            Disponible
                                        </label>
                                        <button disabled={busy} className="rounded-2xl bg-emerald-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60">
                                            Sauvegarder le profil
                                        </button>
                                    </form>

                                    <form ref={applicationFormRef} onSubmit={handleApply} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Candidature</h3>
                                        <input className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="ID de l'offre" value={applicationForm.offre_id} onChange={(event) => setApplicationForm({ ...applicationForm, offre_id: event.target.value })} />
                                        <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Message" value={applicationForm.message} onChange={(event) => setApplicationForm({ ...applicationForm, message: event.target.value })} />
                                        <button disabled={busy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">
                                            Postuler
                                        </button>
                                    </form>
                                </div>
                            </section>
                        )}

                        {token && me?.role === 'recruteur' && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-xl lg:p-8">
                                <h2 className="text-xl font-semibold text-white">Espace recruteur</h2>
                                <form onSubmit={handleCreateOffer} className="mt-5 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Nouvelle offre</h3>
                                    <input className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Titre" value={offerForm.titre} onChange={(event) => setOfferForm({ ...offerForm, titre: event.target.value })} />
                                    <textarea className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Description" value={offerForm.description} onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })} />
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <input className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Localisation" value={offerForm.localisation} onChange={(event) => setOfferForm({ ...offerForm, localisation: event.target.value })} />
                                        <select className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 outline-none" value={offerForm.type} onChange={(event) => setOfferForm({ ...offerForm, type: event.target.value })}>
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                            <option value="stage">stage</option>
                                        </select>
                                    </div>
                                    <button disabled={busy} className="rounded-2xl bg-emerald-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60">
                                        Publier l’offre
                                    </button>
                                </form>
                            </section>
                        )}

                        {token && me?.role === 'admin' && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-xl lg:p-8">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Espace admin</h2>
                                        <p className="text-sm text-slate-400">Gestion des utilisateurs et des offres.</p>
                                    </div>
                                    <button type="button" onClick={loadUsers} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                                        Charger les utilisateurs
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Utilisateurs</h3>
                                        <div className="mt-4 space-y-3">
                                            {users.map((user) => (
                                                <div key={user.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                                                    <div>
                                                        <div className="font-medium text-white">{user.name}</div>
                                                        <div className="text-xs text-slate-400">{user.email} • {user.role}</div>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <button type="button" onClick={() => removeUser(user.id)} className="inline-flex w-full justify-center rounded-full bg-rose-500/15 px-4 py-2 text-xs text-rose-100 transition hover:bg-rose-500/25 sm:w-auto">
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Offres</h3>
                                        <div className="mt-4 space-y-3">
                                            {offers.map((offer) => (
                                                <div key={offer.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-white">{offer.titre}</div>
                                                        <div className="text-xs text-slate-400">ID {offer.id} • {offer.type}</div>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <button type="button" onClick={() => toggleOffer(offer)} className="inline-flex w-full justify-center rounded-full bg-cyan-300/15 px-4 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/25 sm:w-auto">
                                                            Basculer
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default ProjectApp;