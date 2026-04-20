import { useEffect, useMemo, useState } from 'react';

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

const INITIAL_FILTERS = {
    localisation: '',
    type: '',
};

const INITIAL_COMPETENCE = {
    competence_id: '',
    niveau: 'intermédiaire',
};

const STATUS_OPTIONS = ['en_attente', 'acceptee', 'refusee'];
const PAGE_WINDOW = 2;

function buildPageWindow(currentPage, lastPage) {
    const pages = [];

    if (!lastPage) {
        return pages;
    }

    const start = Math.max(1, currentPage - PAGE_WINDOW);
    const end = Math.min(lastPage, currentPage + PAGE_WINDOW);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    return pages;
}

function mapProfileToForm(profile) {
    if (!profile) {
        return INITIAL_PROFILE;
    }

    return {
        titre: profile.titre ?? '',
        bio: profile.bio ?? '',
        localisation: profile.localisation ?? '',
        disponible: Boolean(profile.disponible),
    };
}

function getStatusLabel(statut) {
    if (statut === 'acceptee') {
        return 'Acceptée';
    }

    if (statut === 'refusee') {
        return 'Refusée';
    }

    return 'En attente';
}

function asList(payload) {
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return [];
}

function asMeta(payload, fallbackPage) {
    if (payload?.meta) {
        return payload.meta;
    }

    return {
        current_page: fallbackPage,
        last_page: 1,
        total: asList(payload).length,
    };
}

function ProjectApp() {
    const [authMode, setAuthMode] = useState('login');
    const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER);
    const [loginForm, setLoginForm] = useState(INITIAL_LOGIN);
    const [profileForm, setProfileForm] = useState(INITIAL_PROFILE);
    const [offerForm, setOfferForm] = useState(INITIAL_OFFER);
    const [editOfferForm, setEditOfferForm] = useState(INITIAL_OFFER);
    const [applicationForm, setApplicationForm] = useState(INITIAL_APPLICATION);
    const [competenceForm, setCompetenceForm] = useState(INITIAL_COMPETENCE);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [currentPage, setCurrentPage] = useState(1);

    const [token, setToken] = useState(() => localStorage.getItem('token') ?? '');
    const [me, setMe] = useState(null);

    const [offers, setOffers] = useState([]);
    const [offersMeta, setOffersMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loadingOffers, setLoadingOffers] = useState(false);

    const [availableCompetences, setAvailableCompetences] = useState([]);
    const [myApplications, setMyApplications] = useState([]);

    const [recruiterOffers, setRecruiterOffers] = useState([]);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [selectedRecruiterOfferId, setSelectedRecruiterOfferId] = useState(null);
    const [recruiterOfferApplications, setRecruiterOfferApplications] = useState([]);
    const [recruiterStatusDrafts, setRecruiterStatusDrafts] = useState({});

    const [users, setUsers] = useState([]);
    const [adminOffers, setAdminOffers] = useState([]);

    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busyAction, setBusyAction] = useState('');

    const authHeaders = useMemo(() => {
        const headers = { Accept: 'application/json' };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }, [token]);

    const role = me?.role ?? 'visiteur';
    const isCandidate = role === 'candidat';
    const isRecruiter = role === 'recruteur';
    const isAdmin = role === 'admin';
    const isBusy = Boolean(busyAction);

    const selectedOfferId = Number(applicationForm.offre_id) || null;
    const currentOffersPage = offersMeta?.current_page ?? currentPage;
    const lastOffersPage = offersMeta?.last_page ?? 1;
    const totalOffers = offersMeta?.total ?? offers.length;
    const visiblePages = buildPageWindow(currentOffersPage, lastOffersPage);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            loadMe();
        } else {
            localStorage.removeItem('token');
            setMe(null);
            setProfileForm(INITIAL_PROFILE);
            setApplicationForm(INITIAL_APPLICATION);
            setCompetenceForm(INITIAL_COMPETENCE);
            setMyApplications([]);
            setAvailableCompetences([]);
            setRecruiterOffers([]);
            setEditingOfferId(null);
            setSelectedRecruiterOfferId(null);
            setRecruiterOfferApplications([]);
            setRecruiterStatusDrafts({});
            setUsers([]);
            setAdminOffers([]);
        }
    }, [token]);

    useEffect(() => {
        if (!token || role === 'candidat') {
            loadOffers(currentPage, filters);
        }
    }, [token, role, currentPage, filters]);

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
            const requestError = new Error(message);
            requestError.status = response.status;
            requestError.payload = payload;
            throw requestError;
        }

        return payload;
    }

    function setSuccess(message) {
        setError('');
        setNotice(message);
    }

    function applyProfile(profile) {
        setMe((current) => (current ? { ...current, profil: profile } : current));
        setProfileForm(mapProfileToForm(profile));
    }

    async function loadOffers(page = currentPage, nextFilters = filters) {
        setLoadingOffers(true);

        try {
            const query = new URLSearchParams();

            if (nextFilters.localisation) {
                query.set('localisation', nextFilters.localisation);
            }

            if (nextFilters.type) {
                query.set('type', nextFilters.type);
            }

            if (page > 1) {
                query.set('page', String(page));
            }

            const path = query.toString() ? `/offres?${query.toString()}` : '/offres';
            const payload = await request(path, { method: 'GET' });

            setOffers(asList(payload));
            setOffersMeta(asMeta(payload, page));
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoadingOffers(false);
        }
    }

    async function loadCandidateProfile() {
        try {
            const payload = await request('/profil', { method: 'GET' });
            applyProfile(payload);
        } catch (requestError) {
            if (requestError.status === 404) {
                applyProfile(null);
                return;
            }

            throw requestError;
        }
    }

    async function loadCompetences() {
        const payload = await request('/competences', { method: 'GET' });
        setAvailableCompetences(Array.isArray(payload) ? payload : []);
    }

    async function loadMyApplications() {
        try {
            const payload = await request('/mes-candidatures', { method: 'GET' });
            setMyApplications(Array.isArray(payload) ? payload : []);
        } catch (requestError) {
            if (requestError.status === 404) {
                setMyApplications([]);
                return;
            }

            throw requestError;
        }
    }

    async function loadCandidateContext() {
        try {
            await Promise.all([loadCandidateProfile(), loadCompetences(), loadMyApplications()]);
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function loadRecruiterOffers() {
        try {
            const payload = await request('/mes-offres', { method: 'GET' });
            const list = asList(payload);
            setRecruiterOffers(list);

            if (selectedRecruiterOfferId && !list.some((offer) => offer.id === selectedRecruiterOfferId)) {
                setSelectedRecruiterOfferId(null);
                setRecruiterOfferApplications([]);
                setRecruiterStatusDrafts({});
            }
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function loadRecruiterOfferApplications(offerId) {
        try {
            const payload = await request(`/offres/${offerId}/candidatures`, { method: 'GET' });
            const applications = Array.isArray(payload) ? payload : [];

            setSelectedRecruiterOfferId(offerId);
            setRecruiterOfferApplications(applications);
            setRecruiterStatusDrafts(
                applications.reduce((accumulator, candidature) => ({
                    ...accumulator,
                    [candidature.id]: candidature.statut,
                }), {}),
            );
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function loadUsers() {
        try {
            const payload = await request('/admin/users', { method: 'GET' });
            setUsers(Array.isArray(payload) ? payload : []);
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function loadAdminOffers() {
        try {
            const payload = await request('/admin/offres', { method: 'GET' });
            setAdminOffers(Array.isArray(payload) ? payload : []);
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function loadMe() {
        try {
            const payload = await request('/me', { method: 'GET' });
            setMe(payload);

            if (payload?.role === 'candidat') {
                setProfileForm(mapProfileToForm(payload?.profil));
                await loadCandidateContext();
                return;
            }

            if (payload?.role === 'recruteur') {
                await loadRecruiterOffers();
                return;
            }

            if (payload?.role === 'admin') {
                await Promise.all([loadUsers(), loadAdminOffers()]);
            }
        } catch (requestError) {
            setError(requestError.message);
            setToken('');
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        setBusyAction('register');
        setError('');
        setNotice('');

        try {
            const payload = await request('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerForm),
            });

            if (!payload?.token) {
                throw new Error('Réponse invalide du serveur: token absent.');
            }

            setToken(payload.token);
            setRegisterForm(INITIAL_REGISTER);
            setAuthMode('login');
            setSuccess('Compte créé et connecté.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        setBusyAction('login');
        setError('');
        setNotice('');

        try {
            const payload = await request('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });

            if (!payload?.token) {
                throw new Error('Réponse invalide du serveur: token absent.');
            }

            setToken(payload.token);
            setLoginForm(INITIAL_LOGIN);
            setSuccess('Connexion réussie.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleLogout() {
        setBusyAction('logout');
        setError('');

        try {
            await request('/logout', { method: 'POST' });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setToken('');
            setBusyAction('');
            setSuccess('Déconnecté.');
        }
    }

    async function handleProfileSave(event) {
        event.preventDefault();
        setBusyAction('save-profile');
        setError('');

        try {
            const body = JSON.stringify(profileForm);
            let payload = null;
            let method = me?.profil ? 'PUT' : 'POST';

            try {
                payload = await request('/profil', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body,
                });
            } catch (requestError) {
                const shouldRetryAsUpdate = method === 'POST' && requestError.status === 422 && /profil already exists/i.test(requestError.message);

                if (!shouldRetryAsUpdate) {
                    throw requestError;
                }

                method = 'PUT';
                payload = await request('/profil', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body,
                });
            }

            applyProfile(payload);
            setSuccess(method === 'POST' ? 'Profil créé.' : 'Profil mis à jour.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleAddCompetence(event) {
        event.preventDefault();
        setBusyAction('add-competence');
        setError('');

        try {
            const competenceId = Number(competenceForm.competence_id);

            if (!competenceId) {
                throw new Error('Choisissez une compétence.');
            }

            const payload = await request('/profil/competences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competence_id: competenceId,
                    niveau: competenceForm.niveau,
                }),
            });

            applyProfile(payload?.profil ?? me?.profil ?? null);
            setCompetenceForm(INITIAL_COMPETENCE);
            setSuccess('Compétence ajoutée.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleRemoveCompetence(competenceId) {
        setBusyAction(`remove-competence-${competenceId}`);
        setError('');

        try {
            const payload = await request(`/profil/competences/${competenceId}`, { method: 'DELETE' });
            applyProfile(payload?.profil ?? me?.profil ?? null);
            setSuccess('Compétence retirée.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleApply(event) {
        event.preventDefault();
        setBusyAction('apply');
        setError('');

        try {
            if (!applicationForm.offre_id) {
                throw new Error('Sélectionnez une offre avant de postuler.');
            }

            if (!me?.profil) {
                throw new Error('Créez d’abord votre profil.');
            }

            await request(`/offres/${applicationForm.offre_id}/candidater`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: applicationForm.message }),
            });

            setApplicationForm((current) => ({ ...current, message: '' }));
            await loadMyApplications();
            setSuccess('Candidature envoyée.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleCreateOffer(event) {
        event.preventDefault();
        setBusyAction('create-offer');
        setError('');

        try {
            await request('/offres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offerForm),
            });

            setOfferForm(INITIAL_OFFER);
            await loadRecruiterOffers();
            setSuccess('Offre créée.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    function startEditOffer(offer) {
        setEditingOfferId(offer.id);
        setEditOfferForm({
            titre: offer.titre ?? '',
            description: offer.description ?? '',
            localisation: offer.localisation ?? '',
            type: offer.type ?? 'CDI',
        });
    }

    function cancelEditOffer() {
        setEditingOfferId(null);
        setEditOfferForm(INITIAL_OFFER);
    }

    async function handleUpdateOffer(event) {
        event.preventDefault();

        if (!editingOfferId) {
            return;
        }

        setBusyAction('update-offer');
        setError('');

        try {
            await request(`/offres/${editingOfferId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editOfferForm),
            });

            await loadRecruiterOffers();
            cancelEditOffer();
            setSuccess('Offre mise à jour.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleDeleteOffer(offerId) {
        setBusyAction(`delete-offer-${offerId}`);
        setError('');

        try {
            await request(`/offres/${offerId}`, { method: 'DELETE' });
            await loadRecruiterOffers();

            if (editingOfferId === offerId) {
                cancelEditOffer();
            }

            if (selectedRecruiterOfferId === offerId) {
                setSelectedRecruiterOfferId(null);
                setRecruiterOfferApplications([]);
                setRecruiterStatusDrafts({});
            }

            setSuccess('Offre supprimée.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleUpdateCandidatureStatus(candidatureId) {
        const statut = recruiterStatusDrafts[candidatureId];

        if (!statut) {
            setError('Choisissez un statut.');
            return;
        }

        setBusyAction(`update-candidature-${candidatureId}`);
        setError('');

        try {
            await request(`/candidatures/${candidatureId}/statut`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut }),
            });

            if (selectedRecruiterOfferId) {
                await loadRecruiterOfferApplications(selectedRecruiterOfferId);
            }

            setSuccess('Statut de candidature mis à jour.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleRemoveUser(userId) {
        setBusyAction(`remove-user-${userId}`);
        setError('');

        try {
            await request(`/admin/users/${userId}`, { method: 'DELETE' });
            setUsers((current) => current.filter((item) => item.id !== userId));
            setSuccess('Utilisateur supprimé.');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    async function handleToggleAdminOffer(offer) {
        setBusyAction(`toggle-admin-offer-${offer.id}`);
        setError('');

        try {
            const payload = await request(`/admin/offres/${offer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actif: !offer.actif }),
            });

            const nextOffer = payload?.offre ?? null;

            setAdminOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, ...nextOffer } : item)));
            setSuccess(nextOffer?.actif ? `Offre ${offer.id} activée.` : `Offre ${offer.id} désactivée.`);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyAction('');
        }
    }

    function handleSelectOffer(offerId) {
        setError('');
        setApplicationForm((current) => ({ ...current, offre_id: String(offerId) }));
        setSuccess(`Offre #${offerId} sélectionnée.`);
    }

    function handleFiltersChange(partialFilters) {
        setCurrentPage(1);
        setFilters((current) => ({ ...current, ...partialFilters }));
    }

    function resetFilters() {
        setCurrentPage(1);
        setFilters(INITIAL_FILTERS);
    }

    const usedCompetenceIds = new Set((me?.profil?.competences ?? []).map((item) => item.id));

    return (
        <div className="min-h-screen bg-[#07111f] text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-36 left-[-8rem] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute top-40 right-[-7rem] h-80 w-80 rounded-full bg-emerald-500/18 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-500/14 blur-3xl" />
            </div>

            <main className="relative mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                <header className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl lg:p-8">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Mini LinkedIn • Laravel + React</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                                Démo backend claire et sans blocage.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                                Les écrans changent selon le rôle. Les données existantes sont affichées et modifiables.
                            </p>
                        </div>

                        <div className="grid min-w-[16rem] grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:min-w-[26rem] xl:grid-cols-4">
                            {[
                                { label: 'Mode', value: role },
                                { label: 'Session', value: token ? 'Connecté' : 'Public' },
                                { label: 'Offres', value: String(totalOffers).padStart(2, '0') },
                                { label: 'Page', value: String(currentOffersPage) },
                            ].map((metric) => (
                                <div key={metric.label} className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-center shadow-lg shadow-black/10">
                                    <div className="text-lg font-semibold leading-none text-cyan-300">{metric.value}</div>
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

                <section className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
                    <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                        <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
                            <div className="flex flex-wrap gap-3">
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
                                        disabled={isBusy}
                                    >
                                        Déconnexion
                                    </button>
                                )}
                            </div>

                            {!token && authMode === 'login' && (
                                <form onSubmit={handleLogin} className="mt-6 grid gap-4">
                                    <div className="grid gap-1">
                                        <label htmlFor="login_email" className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</label>
                                        <input id="login_email" name="email" autoComplete="email" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
                                    </div>
                                    <div className="grid gap-1">
                                        <label htmlFor="login_password" className="text-xs uppercase tracking-[0.2em] text-slate-400">Mot de passe</label>
                                        <input id="login_password" name="password" autoComplete="current-password" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Mot de passe" type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
                                    </div>
                                    <button disabled={isBusy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                                        Se connecter
                                    </button>
                                </form>
                            )}

                            {!token && authMode === 'register' && (
                                <form onSubmit={handleRegister} className="mt-6 grid gap-4">
                                    <div className="grid gap-1">
                                        <label htmlFor="register_name" className="text-xs uppercase tracking-[0.2em] text-slate-400">Nom</label>
                                        <input id="register_name" name="name" autoComplete="name" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Nom" value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} />
                                    </div>
                                    <div className="grid gap-1">
                                        <label htmlFor="register_email" className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</label>
                                        <input id="register_email" name="email" autoComplete="email" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
                                    </div>
                                    <div className="grid gap-1">
                                        <label htmlFor="register_password" className="text-xs uppercase tracking-[0.2em] text-slate-400">Mot de passe</label>
                                        <input id="register_password" name="password" autoComplete="new-password" required minLength={8} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Mot de passe" type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
                                    </div>
                                    <div className="grid gap-1">
                                        <label htmlFor="register_role" className="text-xs uppercase tracking-[0.2em] text-slate-400">Rôle</label>
                                        <select id="register_role" name="role" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none" value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                                            <option value="candidat">Candidat</option>
                                            <option value="recruteur">Recruteur</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <button disabled={isBusy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
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
                        </section>
                    </aside>

                    <div className="space-y-6">
                        {!token && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl lg:p-8">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Offres publiques</h2>
                                        <p className="text-sm text-slate-400">Consultez les offres, puis connectez-vous pour agir.</p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[38rem]">
                                        <input
                                            id="public_filter_localisation"
                                            name="localisation"
                                            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                            placeholder="Filtrer par localisation"
                                            value={filters.localisation}
                                            onChange={(event) => handleFiltersChange({ localisation: event.target.value })}
                                        />
                                        <select
                                            id="public_filter_type"
                                            name="type"
                                            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
                                            value={filters.type}
                                            onChange={(event) => handleFiltersChange({ type: event.target.value })}
                                        >
                                            <option value="">Tous les types</option>
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                            <option value="stage">stage</option>
                                        </select>
                                        <button type="button" onClick={resetFilters} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10">
                                            Effacer
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{loadingOffers ? 'Chargement...' : `${offers.length} offre(s)`}</span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Page {currentOffersPage} / {lastOffersPage}</span>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                    {loadingOffers ? (
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <div key={index} className="h-52 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
                                        ))
                                    ) : offers.length ? (
                                        offers.map((offer) => (
                                            <article key={offer.id} className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-lg font-semibold text-white">{offer.titre}</h3>
                                                        <p className="mt-1 text-sm text-slate-400">{offer.localisation || 'Localisation non précisée'} • {offer.type}</p>
                                                    </div>
                                                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${offer.actif ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-700/40 text-slate-300'}`}>
                                                        {offer.actif ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{offer.description}</p>
                                            </article>
                                        ))
                                    ) : (
                                        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300 md:col-span-2 2xl:col-span-3">
                                            Aucune offre ne correspond à ces filtres.
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {isCandidate && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl lg:p-8">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Espace candidat</h2>
                                        <p className="text-sm text-slate-400">Profil, compétences, offres et candidatures.</p>
                                    </div>
                                    {me?.profil ? <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">Profil existant</span> : <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-100">Profil à créer</span>}
                                </div>

                                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                                    <div className="grid gap-5">
                                        {me?.profil && (
                                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                                <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Profil actuel</h3>
                                                <div className="mt-4 space-y-2 text-sm text-slate-200">
                                                    <p><span className="text-slate-400">Titre:</span> {me.profil.titre || '-'}</p>
                                                    <p><span className="text-slate-400">Bio:</span> {me.profil.bio || '-'}</p>
                                                    <p><span className="text-slate-400">Localisation:</span> {me.profil.localisation || '-'}</p>
                                                    <p><span className="text-slate-400">Disponible:</span> {me.profil.disponible ? 'Oui' : 'Non'}</p>
                                                </div>
                                            </div>
                                        )}

                                        <form onSubmit={handleProfileSave} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">{me?.profil ? 'Modifier le profil' : 'Créer le profil'}</h3>

                                            <div className="grid gap-1">
                                                <label htmlFor="profile_titre" className="text-xs uppercase tracking-[0.2em] text-slate-400">Titre</label>
                                                <input id="profile_titre" name="titre" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Titre" value={profileForm.titre} onChange={(event) => setProfileForm({ ...profileForm, titre: event.target.value })} />
                                            </div>

                                            <div className="grid gap-1">
                                                <label htmlFor="profile_bio" className="text-xs uppercase tracking-[0.2em] text-slate-400">Bio</label>
                                                <textarea id="profile_bio" name="bio" required className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Bio" value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} />
                                            </div>

                                            <div className="grid gap-1">
                                                <label htmlFor="profile_localisation" className="text-xs uppercase tracking-[0.2em] text-slate-400">Localisation</label>
                                                <input id="profile_localisation" name="localisation" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Localisation" value={profileForm.localisation} onChange={(event) => setProfileForm({ ...profileForm, localisation: event.target.value })} />
                                            </div>

                                            <label htmlFor="profile_disponible" className="flex items-center gap-3 text-sm text-slate-300">
                                                <input id="profile_disponible" name="disponible" type="checkbox" checked={profileForm.disponible} onChange={(event) => setProfileForm({ ...profileForm, disponible: event.target.checked })} />
                                                Disponible
                                            </label>

                                            <button disabled={isBusy} className="rounded-2xl bg-emerald-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
                                                {me?.profil ? 'Sauvegarder les modifications' : 'Créer le profil'}
                                            </button>
                                        </form>

                                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Compétences</h3>

                                            {me?.profil ? (
                                                <>
                                                    <form onSubmit={handleAddCompetence} className="mt-4 grid gap-3">
                                                        {availableCompetences.length ? (
                                                            <select id="competence_id" name="competence_id" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none" value={competenceForm.competence_id} onChange={(event) => setCompetenceForm({ ...competenceForm, competence_id: event.target.value })}>
                                                                <option value="">Ajouter une compétence</option>
                                                                {availableCompetences.map((competence) => (
                                                                    <option key={competence.id} value={competence.id}>
                                                                        {competence.nom} {usedCompetenceIds.has(competence.id) ? '(déjà ajoutée)' : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input id="competence_id" name="competence_id" required type="number" min="1" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="ID compétence" value={competenceForm.competence_id} onChange={(event) => setCompetenceForm({ ...competenceForm, competence_id: event.target.value })} />
                                                        )}

                                                        <select id="competence_niveau" name="niveau" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none" value={competenceForm.niveau} onChange={(event) => setCompetenceForm({ ...competenceForm, niveau: event.target.value })}>
                                                            <option value="débutant">débutant</option>
                                                            <option value="intermédiaire">intermédiaire</option>
                                                            <option value="expert">expert</option>
                                                        </select>

                                                        <button disabled={isBusy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                                                            Ajouter compétence
                                                        </button>
                                                    </form>

                                                    <div className="mt-4 space-y-2">
                                                        {(me?.profil?.competences ?? []).length ? (
                                                            me.profil.competences.map((competence) => (
                                                                <div key={competence.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                                                                    <div>
                                                                        <div className="font-medium">{competence.nom}</div>
                                                                        <div className="text-xs text-slate-400">Niveau: {competence.pivot?.niveau || '-'}</div>
                                                                    </div>
                                                                    <button type="button" onClick={() => handleRemoveCompetence(competence.id)} className="rounded-full bg-rose-500/15 px-3 py-2 text-xs text-rose-100 hover:bg-rose-500/25" disabled={isBusy}>
                                                                        Retirer
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Aucune compétence ajoutée.</p>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Créez le profil avant d'ajouter des compétences.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-5">
                                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Candidater</h3>
                                            <p className="mt-3 text-sm text-slate-300">
                                                {selectedOfferId ? `Offre #${selectedOfferId} sélectionnée.` : 'Sélectionnez une offre ci-dessous puis envoyez la candidature.'}
                                            </p>

                                            <form onSubmit={handleApply} className="mt-4 grid gap-3">
                                                <div className="grid gap-1">
                                                    <label htmlFor="application_offer_id" className="text-xs uppercase tracking-[0.2em] text-slate-400">Offre</label>
                                                    <input id="application_offer_id" name="offre_id" readOnly className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" value={applicationForm.offre_id} placeholder="Sélectionnez une offre" />
                                                </div>

                                                <div className="grid gap-1">
                                                    <label htmlFor="application_message" className="text-xs uppercase tracking-[0.2em] text-slate-400">Message</label>
                                                    <textarea id="application_message" name="message" required className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Message de candidature" value={applicationForm.message} onChange={(event) => setApplicationForm({ ...applicationForm, message: event.target.value })} />
                                                </div>

                                                <button disabled={isBusy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                                                    Postuler
                                                </button>
                                            </form>
                                        </div>

                                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Mes candidatures</h3>
                                            <div className="mt-4 space-y-3">
                                                {myApplications.length ? (
                                                    myApplications.map((candidature) => (
                                                        <div key={candidature.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="text-sm font-medium text-white">{candidature.offre?.titre || `Offre #${candidature.offre_id}`}</div>
                                                                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{getStatusLabel(candidature.statut)}</span>
                                                            </div>
                                                            <div className="mt-2 text-xs text-slate-400">{candidature.message || 'Sans message.'}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Aucune candidature pour le moment.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div>
                                            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Offres actives</h3>
                                            <p className="mt-2 text-sm text-slate-300">Sélectionnez une offre pour pré-remplir la candidature.</p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[36rem]">
                                            <input
                                                id="candidate_filter_localisation"
                                                name="localisation"
                                                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                                placeholder="Filtrer par localisation"
                                                value={filters.localisation}
                                                onChange={(event) => handleFiltersChange({ localisation: event.target.value })}
                                            />
                                            <select
                                                id="candidate_filter_type"
                                                name="type"
                                                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
                                                value={filters.type}
                                                onChange={(event) => handleFiltersChange({ type: event.target.value })}
                                            >
                                                <option value="">Tous les types</option>
                                                <option value="CDI">CDI</option>
                                                <option value="CDD">CDD</option>
                                                <option value="stage">stage</option>
                                            </select>
                                            <button type="button" onClick={resetFilters} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10">
                                                Effacer
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                            disabled={currentOffersPage <= 1 || loadingOffers}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Précédent
                                        </button>

                                        {visiblePages.map((page) => (
                                            <button
                                                type="button"
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                disabled={loadingOffers}
                                                className={`rounded-full px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${page === currentOffersPage ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage((page) => Math.min(lastOffersPage, page + 1))}
                                            disabled={currentOffersPage >= lastOffersPage || loadingOffers}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Suivant
                                        </button>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                        {loadingOffers ? (
                                            Array.from({ length: 4 }).map((_, index) => (
                                                <div key={index} className="h-52 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
                                            ))
                                        ) : offers.length ? (
                                            offers.map((offer) => (
                                                <article key={offer.id} className={`flex h-full flex-col rounded-3xl border p-5 ${selectedOfferId === offer.id ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-white/10 bg-white/5'}`}>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <h3 className="truncate text-lg font-semibold text-white">{offer.titre}</h3>
                                                            <p className="mt-1 text-sm text-slate-400">{offer.localisation || 'Localisation non précisée'} • {offer.type}</p>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${offer.actif ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-700/40 text-slate-300'}`}>
                                                            {offer.actif ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{offer.description}</p>
                                                    <div className="mt-5 flex items-center justify-between gap-3">
                                                        <span className="text-xs text-slate-400">#{offer.id}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectOffer(offer.id)}
                                                            className={`rounded-full px-4 py-2 text-sm transition ${selectedOfferId === offer.id ? 'bg-cyan-300 text-slate-950' : 'bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25'}`}
                                                        >
                                                            {selectedOfferId === offer.id ? 'Sélectionnée' : 'Sélectionner'}
                                                        </button>
                                                    </div>
                                                </article>
                                            ))
                                        ) : (
                                            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300 md:col-span-2 2xl:col-span-3">
                                                Aucune offre ne correspond à ces filtres.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {isRecruiter && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl lg:p-8">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Espace recruteur</h2>
                                        <p className="text-sm text-slate-400">Créer, modifier, supprimer offres et gérer candidatures.</p>
                                    </div>
                                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">CRUD complet</span>
                                </div>

                                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                                    <div className="grid gap-5">
                                        <form onSubmit={handleCreateOffer} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                                            <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Nouvelle offre</h3>

                                            <div className="grid gap-1">
                                                <label htmlFor="offer_create_titre" className="text-xs uppercase tracking-[0.2em] text-slate-400">Titre</label>
                                                <input id="offer_create_titre" name="titre" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Titre" value={offerForm.titre} onChange={(event) => setOfferForm({ ...offerForm, titre: event.target.value })} />
                                            </div>

                                            <div className="grid gap-1">
                                                <label htmlFor="offer_create_description" className="text-xs uppercase tracking-[0.2em] text-slate-400">Description</label>
                                                <textarea id="offer_create_description" name="description" required className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Description" value={offerForm.description} onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })} />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="grid gap-1">
                                                    <label htmlFor="offer_create_localisation" className="text-xs uppercase tracking-[0.2em] text-slate-400">Localisation</label>
                                                    <input id="offer_create_localisation" name="localisation" required className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Localisation" value={offerForm.localisation} onChange={(event) => setOfferForm({ ...offerForm, localisation: event.target.value })} />
                                                </div>
                                                <div className="grid gap-1">
                                                    <label htmlFor="offer_create_type" className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</label>
                                                    <select id="offer_create_type" name="type" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none" value={offerForm.type} onChange={(event) => setOfferForm({ ...offerForm, type: event.target.value })}>
                                                        <option value="CDI">CDI</option>
                                                        <option value="CDD">CDD</option>
                                                        <option value="stage">stage</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <button disabled={isBusy} className="rounded-2xl bg-emerald-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
                                                Créer l’offre
                                            </button>
                                        </form>

                                        {editingOfferId && (
                                            <form onSubmit={handleUpdateOffer} className="grid gap-4 rounded-3xl border border-cyan-300/35 bg-cyan-300/10 p-5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-sm uppercase tracking-[0.3em] text-cyan-100">Modifier l’offre #{editingOfferId}</h3>
                                                    <button type="button" onClick={cancelEditOffer} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/15">
                                                        Annuler
                                                    </button>
                                                </div>

                                                <input id="offer_edit_titre" name="titre" required className="rounded-2xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none" value={editOfferForm.titre} onChange={(event) => setEditOfferForm({ ...editOfferForm, titre: event.target.value })} />
                                                <textarea id="offer_edit_description" name="description" required className="min-h-28 rounded-2xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none" value={editOfferForm.description} onChange={(event) => setEditOfferForm({ ...editOfferForm, description: event.target.value })} />

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <input id="offer_edit_localisation" name="localisation" required className="rounded-2xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none" value={editOfferForm.localisation} onChange={(event) => setEditOfferForm({ ...editOfferForm, localisation: event.target.value })} />
                                                    <select id="offer_edit_type" name="type" className="rounded-2xl border border-white/20 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none" value={editOfferForm.type} onChange={(event) => setEditOfferForm({ ...editOfferForm, type: event.target.value })}>
                                                        <option value="CDI">CDI</option>
                                                        <option value="CDD">CDD</option>
                                                        <option value="stage">stage</option>
                                                    </select>
                                                </div>

                                                <button disabled={isBusy} className="rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                                                    Sauvegarder les modifications
                                                </button>
                                            </form>
                                        )}
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Mes offres</h3>

                                        <div className="mt-4 space-y-3">
                                            {recruiterOffers.length ? (
                                                recruiterOffers.map((offer) => (
                                                    <div key={offer.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="font-medium text-white">{offer.titre}</div>
                                                                <div className="text-xs text-slate-400">#{offer.id} • {offer.type} • {offer.localisation || '-'}</div>
                                                                <div className="mt-1 text-xs text-slate-400">Candidatures: {offer.candidatures_count ?? 0}</div>
                                                            </div>
                                                            <span className={`rounded-full px-3 py-1 text-xs ${offer.actif ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-700/40 text-slate-300'}`}>
                                                                {offer.actif ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <button type="button" onClick={() => startEditOffer(offer)} className="rounded-full bg-cyan-300/15 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-300/25">
                                                                Modifier
                                                            </button>
                                                            <button type="button" onClick={() => handleDeleteOffer(offer.id)} className="rounded-full bg-rose-500/15 px-3 py-2 text-xs text-rose-100 hover:bg-rose-500/25" disabled={isBusy}>
                                                                Supprimer
                                                            </button>
                                                            <button type="button" onClick={() => loadRecruiterOfferApplications(offer.id)} className="rounded-full bg-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/15">
                                                                Candidatures
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Aucune offre créée pour l’instant.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedRecruiterOfferId && (
                                    <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Candidatures reçues pour l’offre #{selectedRecruiterOfferId}</h3>

                                        <div className="mt-4 space-y-3">
                                            {recruiterOfferApplications.length ? (
                                                recruiterOfferApplications.map((candidature) => (
                                                    <div key={candidature.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="font-medium text-white">{candidature.profil?.user?.name || 'Candidat'}</div>
                                                                <div className="text-xs text-slate-400">Statut actuel: {getStatusLabel(candidature.statut)}</div>
                                                            </div>
                                                            <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">#{candidature.id}</span>
                                                        </div>

                                                        <p className="mt-3 text-sm text-slate-300">{candidature.message || 'Sans message.'}</p>

                                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                                            <select
                                                                id={`status_${candidature.id}`}
                                                                name={`status_${candidature.id}`}
                                                                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none"
                                                                value={recruiterStatusDrafts[candidature.id] || candidature.statut}
                                                                onChange={(event) => setRecruiterStatusDrafts((current) => ({ ...current, [candidature.id]: event.target.value }))}
                                                            >
                                                                {STATUS_OPTIONS.map((status) => (
                                                                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                                                                ))}
                                                            </select>

                                                            <button type="button" onClick={() => handleUpdateCandidatureStatus(candidature.id)} className="rounded-full bg-cyan-300/15 px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-300/25" disabled={isBusy}>
                                                                Mettre à jour
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Aucune candidature reçue.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {isAdmin && (
                            <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 backdrop-blur-xl lg:p-8">
                                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Administration</h2>
                                        <p className="text-sm text-slate-400">Gestion complète des utilisateurs et des offres.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button type="button" onClick={loadUsers} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10" disabled={isBusy}>
                                            Recharger utilisateurs
                                        </button>
                                        <button type="button" onClick={loadAdminOffers} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10" disabled={isBusy}>
                                            Recharger offres
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Utilisateurs</h3>
                                        <div className="mt-4 space-y-3">
                                            {users.length ? (
                                                users.map((user) => (
                                                    <div key={user.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                                                        <div>
                                                            <div className="font-medium text-white">{user.name}</div>
                                                            <div className="text-xs text-slate-400">{user.email} • {user.role}</div>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveUser(user.id)} className="rounded-full bg-rose-500/15 px-3 py-2 text-xs text-rose-100 hover:bg-rose-500/25" disabled={isBusy}>
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Aucun utilisateur chargé.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                        <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Offres</h3>
                                        <div className="mt-4 space-y-3">
                                            {adminOffers.length ? (
                                                adminOffers.map((offer) => (
                                                    <div key={offer.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <div className="font-medium text-white">{offer.titre}</div>
                                                                <div className="text-xs text-slate-400">#{offer.id} • {offer.type} • {offer.recruteur?.name || 'Recruteur'}</div>
                                                            </div>
                                                            <span className={`rounded-full px-3 py-1 text-xs ${offer.actif ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-700/40 text-slate-300'}`}>
                                                                {offer.actif ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 flex justify-end">
                                                            <button type="button" onClick={() => handleToggleAdminOffer(offer)} className="rounded-full bg-cyan-300/15 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-300/25" disabled={isBusy}>
                                                                {offer.actif ? 'Désactiver' : 'Activer'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Aucune offre chargée.</p>
                                            )}
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
