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
