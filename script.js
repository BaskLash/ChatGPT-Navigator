(() => {
    const shareBtn = document.getElementById('shareButton');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');

    const SHARE_URL = 'https://github.com/basklash/chatgpt-navigator';

    function showToast(message) {
        if (!toast) return;
        if (toastText) toastText.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: 'ChatGPT Navigator',
                text: 'Check out ChatGPT Navigator — a minimap sidebar for ChatGPT.',
                url: SHARE_URL
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(shareData.url);
                    showToast('Link copied to clipboard');
                }
            } catch (err) {
                if (err && err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                    showToast('Could not share link');
                }
            }
        });
    }
})();
