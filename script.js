import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import {
    getAnalytics,
    isSupported as analyticsSupported,
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-analytics.js';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    limit as fbLimit,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const CTA_URL = window.location.href.split('#')[0];

let firestore = null;
try {
    const app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    analyticsSupported().then((supported) => {
        if (supported) getAnalytics(app);
    });
} catch (error) {
    console.error('Firebase init failed', error);
}

const menuToggle = document.getElementById('menu-toggle');
const links = document.getElementById('links');
const chevron = document.querySelector('.chevron.svelte-oiwvqb');

const setMenuState = (open) => {
    if (!links || !menuToggle) return;
    links.classList.add('animate');
    links.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    if (chevron) chevron.classList.toggle('open', open);
};

menuToggle?.addEventListener('click', () => {
    const open = !links.classList.contains('open');
    setMenuState(open);
});

window.matchMedia('(min-width: 751px)').addEventListener('change', (event) => {
    if (event.matches) setMenuState(false);
});

document.querySelectorAll('#links a').forEach((anchor) => {
    anchor.addEventListener('click', () => setMenuState(false));
});

const dialog = document.querySelector('dialog.svelte-1lmxhxz');
const dialogBackdropClose = document.querySelector('.dialog-backdrop-close.svelte-1lmxhxz');
const dialogBackdrop = document.querySelector('.dialog-backdrop.svelte-1lmxhxz');

const openDialog = () => {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
};

const closeDialog = () => {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
        dialog.close();
    } else {
        dialog.removeAttribute('open');
    }
};

dialog?.querySelector('[data-close-dialog]')?.addEventListener('click', closeDialog);
dialogBackdropClose?.addEventListener('click', closeDialog);
dialogBackdrop?.addEventListener('click', closeDialog);

dialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
});

const isMobileEnv = () =>
    window.matchMedia('(max-width: 900px)').matches || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const scrollToCTA = () => {
    const target = document.getElementById('cta');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.location.hash = '#cta';
    }
};

const downloadButtons = document.querySelectorAll('[data-download-button]');
downloadButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        hydrateWaitlist();
        openWaitlistModal();
    });
});

const copyButton = dialog?.querySelector('[data-copy]');
const shareButton = dialog?.querySelector('[data-share]');
const remindButton = dialog?.querySelector('[data-remind]');
const copyAnimation = dialog?.querySelector('.copy-animation');

const setCopyAnimation = () => {
    if (!copyAnimation) return;
    copyAnimation.classList.add('check');
    setTimeout(() => copyAnimation.classList.remove('check'), 1500);
};

const copyLink = async () => {
    const url = CTA_URL;
    try {
        await navigator.clipboard.writeText(url);
        setCopyAnimation();
    } catch (_) {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyAnimation();
    }
};

copyButton?.addEventListener('click', (event) => {
    event.preventDefault();
    copyLink();
});

shareButton?.addEventListener('click', async (event) => {
    event.preventDefault();
    const shareData = {
        title: 'Unseal',
        text: 'Publish knowledge and receive feedback without fees or wait times.',
        url: CTA_URL,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            closeDialog();
            return;
        } catch (_) {
            // Ignore failures and fall back to copy.
        }
    }

    copyLink();
});

remindButton?.addEventListener('click', (event) => {
    event.preventDefault();
    const subject = 'Try Unseal later';
    const body = `Check out Unseal: ${CTA_URL}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
});

document.querySelectorAll('img.svelte-bkiq9').forEach((img) => {
    const markLoaded = () => img.classList.add('loaded');
    if (img.complete) {
        markLoaded();
    } else {
        img.addEventListener('load', markLoaded, { once: true });
    }
});

const feedbackList = document.getElementById('feedback-items');
const feedbackEmpty = document.getElementById('feedback-empty');
const feedbackForm = document.getElementById('feedback-form');
const feedbackPrev = document.getElementById('feedback-prev');
const feedbackNext = document.getElementById('feedback-next');
const waitlistModal = document.getElementById('waitlist-modal');
const waitlistForm = document.getElementById('waitlist-form');
const waitlistName = document.getElementById('waitlist-name');
const waitlistEmail = document.getElementById('waitlist-email');
const waitlistThanks = document.getElementById('waitlist-thanks');
const waitlistCloseButtons = document.querySelectorAll('[data-close-waitlist]');
const WAITLIST_INFO_KEY = 'unseal-waitlist-info';
let remoteFeedback = [];
const TRUNCATE_LIMIT = 240;

const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const fetchRemoteFeedback = async () => {
    if (!firestore) return [];
    try {
        const q = query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'), fbLimit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((doc) => {
                const data = doc.data() || {};
                const createdAt = data.createdAt?.toDate?.()
                    ? data.createdAt.toDate().toISOString()
                    : data.createdAt;
                return {
                    name: data.name || 'Anonymous',
                    role: data.role || 'Community member',
                    message: data.message || '',
                    createdAt: createdAt || '',
                };
            })
            .filter((item) => item.message);
    } catch (error) {
        console.error('Failed to load feedback from Firestore', error);
        return [];
    }
};

const openWaitlistModal = () => {
    if (!waitlistModal) return;
    waitlistModal.classList.remove('hidden');
    requestAnimationFrame(() => waitlistModal.classList.add('open'));
    document.body.classList.add('waitlist-open');
    if (waitlistEmail) waitlistEmail.focus();
};

const closeWaitlistModal = () => {
    if (!waitlistModal) return;
    waitlistModal.classList.remove('open');
    document.body.classList.remove('waitlist-open');
    setTimeout(() => waitlistModal.classList.add('hidden'), 260);
};

const hydrateWaitlist = () => {
    if (!waitlistThanks) return;
    let info = null;
    try {
        const stored = localStorage.getItem(WAITLIST_INFO_KEY);
        info = stored ? JSON.parse(stored) : null;
        if (!info) {
            const legacyEmail = localStorage.getItem('unseal-waitlist-email');
            if (legacyEmail) info = { name: '', email: legacyEmail };
        }
    } catch (_) {
        info = null;
    }
    if (info) {
        if (waitlistName) waitlistName.value = info.name || '';
        if (waitlistEmail) waitlistEmail.value = info.email || '';
        waitlistThanks.classList.remove('hidden');
    } else {
        if (waitlistName) waitlistName.value = '';
        if (waitlistEmail) waitlistEmail.value = '';
        waitlistThanks.classList.add('hidden');
    }
};

const renderFeedback = () => {
    if (!feedbackList || !feedbackEmpty) return;
    feedbackList.innerHTML = '';
    const combined = [...remoteFeedback].sort((a, b) => {
        const aTime = new Date(a.createdAt || Date.now()).getTime();
        const bTime = new Date(b.createdAt || Date.now()).getTime();
        return bTime - aTime;
    });

    if (!combined.length) {
        feedbackEmpty.classList.remove('hidden');
        return;
    }

    feedbackEmpty.classList.add('hidden');

    combined.forEach((entry) => {
        const card = document.createElement('div');
        card.className = 'feedback-card';

        const meta = document.createElement('div');
        meta.className = 'feedback-meta';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = entry.name || 'Anonymous';
        const roleSpan = document.createElement('span');
        roleSpan.textContent = entry.role || 'Community member';
        const dateSpan = document.createElement('span');
        dateSpan.textContent = formatDate(entry.createdAt);

        meta.append(nameSpan, ' · ', roleSpan);
        if (dateSpan.textContent) {
            meta.append(' · ', dateSpan);
        }

        const message = document.createElement('p');
        message.className = 'feedback-message';
        const fullMessage = (entry.message || '').trim();
        const needsTruncate = fullMessage.length > TRUNCATE_LIMIT;
        const truncated = needsTruncate ? `${fullMessage.slice(0, TRUNCATE_LIMIT).trimEnd()}…` : fullMessage;
        message.textContent = truncated || '—';

        if (needsTruncate) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'button thin truncate-toggle';
            toggle.textContent = 'Show more';
            toggle.addEventListener('click', () => {
                const expanded = toggle.dataset.expanded === 'true';
                toggle.dataset.expanded = String(!expanded);
                message.textContent = expanded ? truncated : fullMessage;
                toggle.textContent = expanded ? 'Show more' : 'Show less';
            });
            card.append(meta, message, toggle);
        } else {
            card.append(meta, message);
        }

        feedbackList.appendChild(card);
    });

    const needsNav = feedbackList.scrollWidth > feedbackList.clientWidth + 8;
    [feedbackPrev, feedbackNext].forEach((btn) => {
        if (btn) btn.classList.toggle('hidden', !needsNav);
    });
};

feedbackForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get('name') || '').toString().trim();
    const role = (formData.get('role') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();

    if (!message) return;

    const newEntry = {
        name: name || 'Anonymous',
        role: role || 'Community member',
        message,
        createdAt: new Date().toISOString(),
    };

    remoteFeedback = [newEntry, ...remoteFeedback];
    renderFeedback();
    feedbackForm.reset();
    hydrateWaitlist();
    openWaitlistModal();
    if (firestore) {
        addDoc(collection(firestore, 'feedback'), {
            name: newEntry.name,
            role: newEntry.role,
            message: newEntry.message,
            createdAt: serverTimestamp(),
        }).catch((error) => console.error('Failed to write feedback to Firestore', error));
    }
});

const scrollFeedback = (direction) => {
    if (!feedbackList) return;
    const amount = feedbackList.clientWidth * 0.9;
    feedbackList.scrollBy({ left: direction * amount, behavior: 'smooth' });
};

feedbackPrev?.addEventListener('click', () => scrollFeedback(-1));
feedbackNext?.addEventListener('click', () => scrollFeedback(1));

waitlistForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!waitlistEmail) return;
    const email = waitlistEmail.value.trim();
    const name = (waitlistName?.value || '').trim();
    if (!email || !email.includes('@') || !name) return;
    try {
        localStorage.setItem(WAITLIST_INFO_KEY, JSON.stringify({ name, email }));
    } catch (_) {
        // Ignore storage failures.
    }
    if (firestore) {
        addDoc(collection(firestore, 'waitlist'), {
            name,
            email,
            createdAt: serverTimestamp(),
        }).catch((error) => console.error('Failed to write waitlist to Firestore', error));
    }
    waitlistThanks?.classList.remove('hidden');
    waitlistEmail.value = '';
});

waitlistCloseButtons.forEach((button) => {
    button.addEventListener('click', closeWaitlistModal);
});

waitlistModal?.addEventListener('click', (event) => {
    if (event.target === waitlistModal) {
        closeWaitlistModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeWaitlistModal();
});

hydrateWaitlist();
fetchRemoteFeedback().then((entries) => {
    remoteFeedback = entries;
    renderFeedback();
});

renderFeedback();
