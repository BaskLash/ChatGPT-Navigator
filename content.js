let lastArticleCount = 0;
let debounceTimer = null;
let scrollUpdateTimer = null;
let navLockTimer = null;
let activeIndex = -1;
let hoveredIndex = -1;
let prevDisplayIdx = -1;
let isNavigating = false;
let chatBars = [];

const PALETTE = {
    user: '#8b9eff',
    assistant: '#e5e7eb',
    bar: 'rgba(255,255,255,0.16)',
    barHover: 'rgba(255,255,255,0.32)',
    active: '#ffffff',
    surface: 'rgba(18,18,20,0.85)',
    surfaceSolid: '#0f0f10',
    border: 'rgba(255,255,255,0.08)',
    muted: 'rgba(255,255,255,0.55)'
};

// ── Styles injected once ──────────────────────────────────────────────────────

function ensureStyles() {
    if (document.getElementById('chat-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'chat-nav-styles';
    style.textContent = `
        #chat-minimap {
            font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        #chat-minimap-shell {
            background: ${PALETTE.surface};
            backdrop-filter: blur(20px) saturate(140%);
            -webkit-backdrop-filter: blur(20px) saturate(140%);
            border: 1px solid ${PALETTE.border};
            border-radius: 16px;
            padding: 10px 8px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.25);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            pointer-events: auto;
            transition: opacity 0.25s ease, transform 0.25s ease;
        }
        #chat-minimap-shell.cn-collapsed .cn-bars,
        #chat-minimap-shell.cn-collapsed .cn-arrow {
            display: none;
        }
        .cn-bars {
            display: flex;
            flex-direction: column;
            gap: 5px;
            overflow-y: auto;
            padding: 4px 2px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.15) transparent;
            mask-image: linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%);
        }
        .cn-bars::-webkit-scrollbar { width: 4px; }
        .cn-bars::-webkit-scrollbar-track { background: transparent; }
        .cn-bars::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.12);
            border-radius: 999px;
        }
        .cn-bars::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

        .cn-bar {
            width: 22px;
            height: 6px;
            background: ${PALETTE.bar};
            border-radius: 999px;
            cursor: pointer;
            flex-shrink: 0;
            transition: width 0.18s cubic-bezier(.2,.8,.2,1),
                        background-color 0.18s ease,
                        box-shadow 0.18s ease,
                        transform 0.18s ease;
        }
        .cn-bar:hover {
            background: ${PALETTE.barHover};
            width: 30px;
        }
        .cn-bar.cn-bar--active {
            background: ${PALETTE.active};
            width: 34px;
            box-shadow: 0 0 12px rgba(255,255,255,0.35);
        }
        .cn-bar.cn-bar--user {
            background: linear-gradient(90deg, ${PALETTE.user}, rgba(139,158,255,0.55));
        }
        .cn-bar.cn-bar--user:hover { filter: brightness(1.15); }
        .cn-bar.cn-bar--user.cn-bar--active {
            background: ${PALETTE.user};
            box-shadow: 0 0 14px rgba(139,158,255,0.55);
        }

        .cn-arrow {
            width: 28px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${PALETTE.muted};
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
        }
        .cn-arrow svg { width: 12px; height: 12px; display: block; }
        .cn-arrow:hover {
            background: rgba(255,255,255,0.08);
            color: #fff;
        }
        .cn-arrow:active { transform: scale(0.94); }
        .cn-arrow.cn-disabled {
            opacity: 0.25;
            pointer-events: none;
        }
        .cn-toggle {
            width: 28px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${PALETTE.muted};
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.15s ease, color 0.15s ease;
        }
        .cn-toggle:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .cn-toggle svg { width: 12px; height: 12px; }

        #chat-nav-tooltip {
            position: fixed;
            background: ${PALETTE.surfaceSolid};
            color: #f3f4f6;
            padding: 12px 14px;
            border-radius: 14px;
            font-size: 13px;
            line-height: 1.45;
            font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
            width: 280px;
            display: none;
            pointer-events: none;
            box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px ${PALETTE.border};
            z-index: 10002;
            word-break: break-word;
            transform: translateY(-50%);
            opacity: 0;
            transition: opacity 0.16s ease, transform 0.16s ease;
        }
        #chat-nav-tooltip.cn-visible {
            display: block;
            opacity: 1;
        }
        #chat-nav-tooltip .cn-tip-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.55);
            margin-bottom: 6px;
        }
        #chat-nav-tooltip .cn-tip-body {
            color: #e7e7ea;
            font-size: 13.5px;
            font-weight: 400;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
            .cn-bar, .cn-arrow, #chat-nav-tooltip { transition: none !important; }
        }
    `;
    document.head.appendChild(style);
}

// ── Shared body-level tooltip ─────────────────────────────────────────────────

function ensureTooltip() {
    let tip = document.getElementById('chat-nav-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'chat-nav-tooltip';
        tip.innerHTML = `
            <div class="cn-tip-label"></div>
            <div class="cn-tip-body"></div>
        `;
        document.body.appendChild(tip);
    }
    return tip;
}

// ── Scroll detection ──────────────────────────────────────────────────────────

function onAnyScroll(e) {
    const minimap = document.getElementById('chat-minimap');
    if (minimap && e.target instanceof Node && minimap.contains(e.target)) return;
    if (isNavigating) return;

    clearTimeout(scrollUpdateTimer);
    scrollUpdateTimer = setTimeout(updateActiveByViewport, 80);
}

document.addEventListener('scroll', onAnyScroll, { passive: true, capture: true });
window.addEventListener('scroll', onAnyScroll, { passive: true });

// ── Icons ─────────────────────────────────────────────────────────────────────

const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
const ICON_COLLAPSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
const ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

// ── Main builder ──────────────────────────────────────────────────────────────

function createNavigator() {
    ensureStyles();

    const articles = [...document.querySelectorAll('section[data-testid^="conversation-turn-"]')];

    if (articles.length === lastArticleCount && articles.length > 0) return;
    lastArticleCount = articles.length;

    const existing = document.getElementById('chat-minimap');
    const wasCollapsed = existing?.querySelector('#chat-minimap-shell')?.classList.contains('cn-collapsed');
    if (existing) existing.remove();

    chatBars = [];
    activeIndex = -1;
    hoveredIndex = -1;
    prevDisplayIdx = -1;

    const tip = ensureTooltip();
    tip.classList.remove('cn-visible');

    if (articles.length === 0) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'chat-minimap';
    Object.assign(wrapper.style, {
        position: 'fixed',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: '10000',
        maxHeight: '85vh',
        pointerEvents: 'none'
    });

    const shell = document.createElement('div');
    shell.id = 'chat-minimap-shell';
    if (wasCollapsed) shell.classList.add('cn-collapsed');

    // Collapse toggle
    const toggle = document.createElement('div');
    toggle.className = 'cn-toggle';
    toggle.title = 'Toggle minimap';
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-label', 'Toggle minimap');
    toggle.innerHTML = shell.classList.contains('cn-collapsed') ? ICON_EXPAND : ICON_COLLAPSE;
    toggle.addEventListener('click', () => {
        const collapsed = shell.classList.toggle('cn-collapsed');
        toggle.innerHTML = collapsed ? ICON_EXPAND : ICON_COLLAPSE;
    });

    // Up arrow
    const upBtn = makeArrowBtn(ICON_UP, 'chat-nav-up', 'Previous message');
    upBtn.addEventListener('click', () => {
        if (activeIndex > 0) navigateTo(activeIndex - 1);
    });

    // Bars container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'cn-bars';
    Object.assign(barsContainer.style, {
        maxHeight: 'calc(85vh - 110px)'
    });

    // Down arrow
    const downBtn = makeArrowBtn(ICON_DOWN, 'chat-nav-down', 'Next message');
    downBtn.addEventListener('click', () => {
        if (activeIndex < chatBars.length - 1) navigateTo(activeIndex + 1);
    });

    articles.forEach((article, index) => {
        const isUser = !!article.querySelector('img[alt="User"], .user-avatar, [data-testid="user-message"]') || (index % 2 === 0);
        const senderLabel = isUser ? 'You' : 'ChatGPT';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.innerHTML;
        tempDiv.querySelectorAll('h4,h5,h6,button,svg').forEach(el => el.remove());
        const rawText = tempDiv.innerText.trim().replace(/\s+/g, ' ');
        const preview = rawText.substring(0, 140) + (rawText.length > 140 ? '…' : '');

        const line = document.createElement('div');
        line.className = 'cn-bar' + (isUser ? ' cn-bar--user' : '');
        line.setAttribute('role', 'button');
        line.setAttribute('aria-label', `Jump to ${senderLabel} message ${index + 1}`);
        line.tabIndex = 0;

        line.addEventListener('mouseenter', () => {
            hoveredIndex = index;
            applyHighlights();
            showTooltipFor(line, senderLabel, preview);
        });

        line.addEventListener('mouseleave', () => {
            hoveredIndex = -1;
            applyHighlights();
            hideTooltip();
        });

        line.addEventListener('focus', () => {
            hoveredIndex = index;
            applyHighlights();
            showTooltipFor(line, senderLabel, preview);
        });
        line.addEventListener('blur', () => {
            hoveredIndex = -1;
            applyHighlights();
            hideTooltip();
        });

        line.addEventListener('click', () => {
            hideTooltip();
            navigateTo(index);
        });
        line.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateTo(index);
            }
        });

        barsContainer.appendChild(line);
        chatBars.push({ line, article, isUser });
    });

    shell.appendChild(toggle);
    shell.appendChild(upBtn);
    shell.appendChild(barsContainer);
    shell.appendChild(downBtn);
    wrapper.appendChild(shell);
    document.body.appendChild(wrapper);

    updateActiveByViewport();
    updateArrowStates();
}

// ── Tooltip helpers ───────────────────────────────────────────────────────────

function showTooltipFor(line, label, preview) {
    const tip = ensureTooltip();
    tip.querySelector('.cn-tip-label').textContent = label;
    tip.querySelector('.cn-tip-body').textContent = preview;

    const rect = line.getBoundingClientRect();
    tip.style.top = (rect.top + rect.height / 2) + 'px';
    tip.style.right = (window.innerWidth - rect.left + 12) + 'px';
    tip.style.left = 'auto';
    tip.classList.add('cn-visible');
}

function hideTooltip() {
    const tip = document.getElementById('chat-nav-tooltip');
    if (tip) tip.classList.remove('cn-visible');
}

// ── Arrow button factory ──────────────────────────────────────────────────────

function makeArrowBtn(svg, id, label) {
    const btn = document.createElement('div');
    btn.id = id;
    btn.className = 'cn-arrow';
    btn.innerHTML = svg;
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.tabIndex = 0;
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });
    return btn;
}

// ── O(1) highlight ───────────────────────────────────────────────────────────

function applyHighlights() {
    const displayIdx = hoveredIndex !== -1 ? hoveredIndex : activeIndex;
    if (displayIdx === prevDisplayIdx) return;

    if (prevDisplayIdx >= 0 && prevDisplayIdx < chatBars.length) {
        chatBars[prevDisplayIdx].line.classList.remove('cn-bar--active');
    }
    if (displayIdx >= 0 && displayIdx < chatBars.length) {
        chatBars[displayIdx].line.classList.add('cn-bar--active');
    }
    prevDisplayIdx = displayIdx;
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigateTo(index) {
    if (index < 0 || index >= chatBars.length) return;

    clearTimeout(navLockTimer);
    clearTimeout(scrollUpdateTimer);
    isNavigating = true;
    navLockTimer = setTimeout(() => { isNavigating = false; }, 900);

    activeIndex = index;
    applyHighlights();
    updateArrowStates();

    chatBars[index].line.scrollIntoView({ block: 'nearest' });
    scrollToArticle(chatBars[index].article);
}

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
        const top = article.getBoundingClientRect().top + window.scrollY - headerHeight - padding;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        return;
    }

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

    upBtn.classList.toggle('cn-disabled', !canUp);
    downBtn.classList.toggle('cn-disabled', !canDown);
}

// ── Viewport-based active detection ──────────────────────────────────────────

function updateActiveByViewport() {
    if (chatBars.length === 0 || isNavigating) return;

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
