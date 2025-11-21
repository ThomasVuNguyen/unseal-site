const CTA_URL = window.location.href.split('#')[0];

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
        if (isMobileEnv()) {
            openDialog();
            return;
        }
        scrollToCTA();
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

const FEEDBACK_STORAGE_KEY = 'unseal-feedback';
const seedFeedback = [
    {
        name: 'Dr. Malik R.',
        role: 'Clinical researcher',
        message: 'Keep rapid dissemination but add lightweight quality checks that don’t slow us down.',
        createdAt: '2024-04-12T12:00:00Z',
    },
    {
        name: 'Irene K.',
        role: 'Open science lead',
        message: 'Let authors pick licenses easily so code, data, and text reuse is clear from the start.',
        createdAt: '2024-04-18T12:00:00Z',
    },
    {
        name: 'Gavin T.',
        role: 'Reader & developer',
        message: 'Build space for post-publication review—upvotes alone don’t capture expertise.',
        createdAt: '2024-04-24T12:00:00Z',
    },
];

const feedbackList = document.getElementById('feedback-items');
const feedbackEmpty = document.getElementById('feedback-empty');
const feedbackForm = document.getElementById('feedback-form');
const waitlistModal = document.getElementById('waitlist-modal');
const waitlistForm = document.getElementById('waitlist-form');
const waitlistEmail = document.getElementById('waitlist-email');
const waitlistThanks = document.getElementById('waitlist-thanks');
const waitlistCloseButtons = document.querySelectorAll('[data-close-waitlist]');
const WAITLIST_EMAIL_KEY = 'unseal-waitlist-email';

const loadUserFeedback = () => {
    try {
        const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (_) {
        return [];
    }
};

const saveUserFeedback = (entries) => {
    try {
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
    } catch (_) {
        // Ignore storage failures.
    }
};

let userFeedback = loadUserFeedback();

const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
    if (!waitlistEmail || !waitlistThanks) return;
    const storedEmail = (() => {
        try {
            return localStorage.getItem(WAITLIST_EMAIL_KEY);
        } catch (_) {
            return null;
        }
    })();
    if (storedEmail) {
        waitlistEmail.value = storedEmail;
        waitlistThanks.classList.remove('hidden');
    } else {
        waitlistThanks.classList.add('hidden');
    }
};

const renderFeedback = () => {
    if (!feedbackList || !feedbackEmpty) return;
    feedbackList.innerHTML = '';
    const combined = [...userFeedback, ...seedFeedback].sort((a, b) => {
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
        message.textContent = entry.message;

        card.append(meta, message);
        feedbackList.appendChild(card);
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

    userFeedback = [newEntry, ...userFeedback];
    saveUserFeedback(userFeedback);
    renderFeedback();
    feedbackForm.reset();
    hydrateWaitlist();
    openWaitlistModal();
});

waitlistForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!waitlistEmail) return;
    const email = waitlistEmail.value.trim();
    if (!email || !email.includes('@')) return;
    try {
        localStorage.setItem(WAITLIST_EMAIL_KEY, email);
    } catch (_) {
        // Ignore storage failures.
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

renderFeedback();
