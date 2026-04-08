let lastArticleCount = 0;
let debounceTimer = null;
let scrollUpdateTimer = null;
let navLockTimer = null;
let activeIndex = -1;
let hoveredIndex = -1;
let prevDisplayIdx = -1;   // O(1) highlight: only touch the 2 bars that change
let isNavigating = false;
let chatBars = [];

// ── Shared body-level tooltip ─────────────────────────────────────────────────
// Lives at document.body so it is never clipped by the overflow-y:auto
// bars container.

function ensureTooltip() {
    let tip = document.getElementById('chat-nav-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'chat-nav-tooltip';
        Object.assign(tip.style, {
            position: 'fixed',
            backgroundColor: '#171717',
            color: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            width: '260px',
            display: 'none',
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            lineHeight: '1.4',
            zIndex: '10002',
            wordBreak: 'break-word',
            transform: 'translateY(-50%)'
        });
        document.body.appendChild(tip);
    }
    return tip;
}

// ── Scroll detection ──────────────────────────────────────────────────────────

function onAnyScroll(e) {
    // Ignore scroll events that originate from the sidebar itself
    const minimap = document.getElementById('chat-minimap');
    if (minimap && e.target instanceof Node && minimap.contains(e.target)) return;

    // Ignore scroll events triggered by our own navigateTo() smooth scroll
    if (isNavigating) return;

    clearTimeout(scrollUpdateTimer);
    scrollUpdateTimer = setTimeout(updateActiveByViewport, 80);
}

document.addEventListener('scroll', onAnyScroll, { passive: true, capture: true });
window.addEventListener('scroll', onAnyScroll, { passive: true });

// ── Main builder ──────────────────────────────────────────────────────────────

function createNavigator() {
    const articles = [...document.querySelectorAll('section[data-testid^="conversation-turn-"]')];

    if (articles.length === lastArticleCount && articles.length > 0) return;
    lastArticleCount = articles.length;

    const existing = document.getElementById('chat-minimap');
    if (existing) existing.remove();

    chatBars = [];
    activeIndex = -1;
    hoveredIndex = -1;
    prevDisplayIdx = -1;

    const tip = ensureTooltip();
    tip.style.display = 'none';

    if (articles.length === 0) return;

    // Outer fixed wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'chat-minimap';
    Object.assign(wrapper.style, {
        position: 'fixed',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        zIndex: '10000',
        maxHeight: '85vh',
        pointerEvents: 'none'
    });

    // Up arrow — navigates to previous chat
    const upBtn = makeArrowBtn('\u25B2', 'chat-nav-up');
    upBtn.addEventListener('click', () => {
        if (activeIndex > 0) navigateTo(activeIndex - 1);
    });

    // Scrollable bars container — handles large chat histories
    const barsContainer = document.createElement('div');
    Object.assign(barsContainer.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        maxHeight: 'calc(85vh - 64px)',
        padding: '2px 4px 2px 2px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#555 transparent',
        pointerEvents: 'none'
    });

    // Down arrow — navigates to next chat
    const downBtn = makeArrowBtn('\u25BC', 'chat-nav-down');
    downBtn.addEventListener('click', () => {
        if (activeIndex < chatBars.length - 1) navigateTo(activeIndex + 1);
    });

    // Build one bar per message
    articles.forEach((article, index) => {
        const isUser = article.querySelector('img[alt="User"], .user-avatar, [data-testid="user-message"]') || (index % 2 === 0);
        const accentColor = isUser ? '#007bff' : '#10a37f';
        const senderLabel = isUser ? 'You' : 'ChatGPT';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.innerHTML;
        tempDiv.querySelectorAll('h5, h6, button, svg').forEach(el => el.remove());
        const rawText = tempDiv.innerText.trim();
        const preview = rawText.substring(0, 80) + (rawText.length > 80 ? '\u2026' : '');
        const tooltipHTML = `<b style="color:${accentColor}">${senderLabel}:</b><br>${preview}`;

        const line = document.createElement('div');
        Object.assign(line.style, {
            width: '35px',
            height: '12px',
            backgroundColor: '#666',
            borderRadius: '3px',
            cursor: 'pointer',
            flexShrink: '0',
            transition: 'background-color 0.15s ease, width 0.15s ease, box-shadow 0.15s ease',
            pointerEvents: 'auto'
        });

        // Hover: highlight this bar and show the shared fixed tooltip
        line.addEventListener('mouseenter', () => {
            hoveredIndex = index;
            applyHighlights();

            const rect = line.getBoundingClientRect();
            tip.style.borderLeft = `4px solid ${accentColor}`;
            tip.innerHTML = tooltipHTML;
            tip.style.top = (rect.top + rect.height / 2) + 'px';
            tip.style.right = (window.innerWidth - rect.left + 10) + 'px';
            tip.style.left = 'auto';
            tip.style.display = 'block';
        });

        // Mouse leave: restore scroll-based highlight, hide tooltip
        line.addEventListener('mouseleave', () => {
            hoveredIndex = -1;
            applyHighlights();
            tip.style.display = 'none';
        });

        // Click: navigate precisely to this message
        line.addEventListener('click', () => {
            tip.style.display = 'none';
            navigateTo(index);
        });

        barsContainer.appendChild(line);
        chatBars.push({ line, article, accentColor });
    });

    wrapper.appendChild(upBtn);
    wrapper.appendChild(barsContainer);
    wrapper.appendChild(downBtn);
    document.body.appendChild(wrapper);

    updateActiveByViewport();
}

// ── Arrow button factory ──────────────────────────────────────────────────────

function makeArrowBtn(symbol, id) {
    const btn = document.createElement('div');
    btn.id = id;
    Object.assign(btn.style, {
        width: '35px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        pointerEvents: 'auto',
        color: '#888',
        fontSize: '11px',
        userSelect: 'none',
        transition: 'color 0.15s ease, opacity 0.15s ease',
        flexShrink: '0',
        opacity: '0.4'
    });
    btn.textContent = symbol;
    btn.addEventListener('mouseenter', () => {
        if (parseFloat(btn.style.opacity) > 0.3) btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => btn.style.color = '#888');
    return btn;
}

// ── O(1) highlight — only the 2 bars that change get a DOM write ──────────────

function applyHighlights() {
    const displayIdx = hoveredIndex !== -1 ? hoveredIndex : activeIndex;
    if (displayIdx === prevDisplayIdx) return;

    // Deactivate the previously highlighted bar
    if (prevDisplayIdx >= 0 && prevDisplayIdx < chatBars.length) {
        const { line } = chatBars[prevDisplayIdx];
        line.style.backgroundColor = '#666';
        line.style.width = '35px';
        line.style.boxShadow = 'none';
    }

    // Activate the new bar
    if (displayIdx >= 0 && displayIdx < chatBars.length) {
        const { line } = chatBars[displayIdx];
        line.style.backgroundColor = '#ffffff';
        line.style.width = '50px';
        line.style.boxShadow = '0 0 8px rgba(255,255,255,0.45)';
    }

    prevDisplayIdx = displayIdx;
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigateTo(index) {
    if (index < 0 || index >= chatBars.length) return;

    // Lock scroll detection for 900 ms so our smooth scroll doesn't fight
    // updateActiveByViewport and flip the highlight to a wrong bar mid-scroll.
    clearTimeout(navLockTimer);
    clearTimeout(scrollUpdateTimer);
    isNavigating = true;
    navLockTimer = setTimeout(() => { isNavigating = false; }, 900);

    activeIndex = index;
    applyHighlights();
    updateArrowStates();

    // Keep the active bar visible inside the sidebar (instant, no conflict)
    chatBars[index].line.scrollIntoView({ block: 'nearest' });

    // Scroll the page to the target message
    scrollToArticle(chatBars[index].article);
}

// Walk up the DOM to find the true scrollable container, then issue one
// precise scrollTo — no two-step hacks, no arbitrary timeouts.
function scrollToArticle(article) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 60;
    const padding = 8;

    let container = article.parentElement;
    while (container && container !== document.body && container !== document.documentElement) {
        const oy = window.getComputedStyle(container).overflowY;
        if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') break;
        container = container.parentElement;
    }

    if (!container || container === document.body || container === document.documentElement) {
        // Window-level scroll fallback
        const top = article.getBoundingClientRect().top + window.scrollY - headerHeight - padding;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        return;
    }

    // Single-step: current scrollTop + article's offset from container top
    const targetScrollTop =
        container.scrollTop +
        article.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        headerHeight - padding;

    container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
}

function updateArrowStates() {
    const upBtn = document.getElementById('chat-nav-up');
    const downBtn = document.getElementById('chat-nav-down');
    if (!upBtn || !downBtn) return;

    const canUp = activeIndex > 0;
    const canDown = activeIndex < chatBars.length - 1;

    upBtn.style.opacity = canUp ? '1' : '0.3';
    upBtn.style.pointerEvents = canUp ? 'auto' : 'none';
    upBtn.style.cursor = canUp ? 'pointer' : 'default';

    downBtn.style.opacity = canDown ? '1' : '0.3';
    downBtn.style.pointerEvents = canDown ? 'auto' : 'none';
    downBtn.style.cursor = canDown ? 'pointer' : 'default';
}

// ── Viewport-based active detection ──────────────────────────────────────────

function updateActiveByViewport() {
    if (chatBars.length === 0 || isNavigating) return;

    // Active = last article whose top edge is above 40 % of the viewport height
    const threshold = window.innerHeight * 0.4;
    let newIdx = 0;

    chatBars.forEach(({ article }, i) => {
        if (article.getBoundingClientRect().top <= threshold) newIdx = i;
    });

    if (newIdx === activeIndex) return;

    activeIndex = newIdx;
    applyHighlights();
    updateArrowStates();
    chatBars[newIdx].line.scrollIntoView({ block: 'nearest' });
}

// ── MutationObserver & startup ────────────────────────────────────────────────

const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(createNavigator, 800);
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(createNavigator, 2000);
