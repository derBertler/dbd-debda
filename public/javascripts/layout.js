document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookieAccepted')) {
        document.getElementById('cookie-banner').classList.remove('d-none');
    }

    document.getElementById('accept-cookies-btn')?.addEventListener('click', () => {
        localStorage.setItem('cookieAccepted', 'true');
        document.getElementById('cookie-banner').classList.add('d-none');
    });
});