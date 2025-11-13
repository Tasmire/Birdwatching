import Toast from 'react-native-toast-message';

const queue = [];
let isShowing = false;
const DEFAULT_DURATION = 4000;
const BUFFER_MS = 200;

function processQueue() {
    if (isShowing) return;
    const next = queue.shift();
    if (!next) return;
    isShowing = true;
    const duration = typeof next.visibilityTime === 'number' ? next.visibilityTime : DEFAULT_DURATION;
    // show toast
    Toast.show(next);
    // hide after duration + small buffer, then process next
    setTimeout(() => {
        try { Toast.hide(); } catch (e) { /* ignore */ }
        isShowing = false;
        // allow tiny gap before next
        setTimeout(processQueue, 50);
    }, duration + BUFFER_MS);
}

export function showToast(options) {
    queue.push(options || {});
    processQueue();
}

// convenience wrappers if you prefer
export function showSuccess(text1, text2, opts = {}) {
    showToast({ type: 'success', text1, text2, position: opts.position ?? 'top', visibilityTime: opts.visibilityTime ?? DEFAULT_DURATION });
}
export function showError(text1, text2, opts = {}) {
    showToast({ type: 'error', text1, text2, position: opts.position ?? 'top', visibilityTime: opts.visibilityTime ?? DEFAULT_DURATION });
}

export default { showToast, showSuccess, showError };