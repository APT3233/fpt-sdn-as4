// public/js/app.js — Shared JS for all pages

// ─── Toast Notification ────────────────────────────────
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast--${type} toast--visible`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.className = 'toast';
    }, 3500);
}

// ─── Close modal on Escape key ─────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
    }
});

// ─── JWT Token Helper ──────────────────────────────────
function getToken() {
    return localStorage.getItem('jwt_token');
}

/**
 * authFetch — wrapper around fetch() that:
 *  1. Auto-attaches Authorization: Bearer <token> header
 *  2. Includes credentials (cookies) for httpOnly JWT fallback
 *  3. Redirects to /login on 401
 */
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // also send httpOnly cookie
    });

    // Auto-redirect on session expiry
    if (response.status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        showToast('⏰ Phiên đăng nhập hết hạn. Đang chuyển hướng...', 'error');
        setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }, 1500);
        throw new Error('Unauthorized');
    }

    return response;
}

// ─── Logout ────────────────────────────────────────────
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (_) { /* ignore */ }

    // Clear local storage
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');

    showToast('👋 Đã đăng xuất thành công!', 'success');
    setTimeout(() => { window.location.href = '/login'; }, 700);
}
