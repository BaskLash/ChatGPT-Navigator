let lastArticleCount = 0;
let debounceTimer = null;
let scrollUpdateTimer = null;
let activeIndex = -1;
let hoveredIndex = -1;
let chatBars = [];

// ── Scroll detection (capture phase catches any scroll container) ────────────

function onAnyScroll() {
    clearTimeout(scrollUpdateTimer);
    scrollUpdateTimer = setTimeout(updateActiveByViewport, 80);
}

document.addEventListener('scroll', onAnyScroll, { passive: true, capture: true });
window.addEventListener('scroll', onAnyScroll, { passive: true });

// ── Main builder ─────────────────────────────────────────────────────────────

function createNavigator() {
    const articles = [...document.querySelectorAll('section[data-testid^="conversation-turn-"]')];

    if (articles.length === lastArticleCount && articles.length > 0) return;
    lastArticleCount = articles.length;

    const existing = document.getElementById('chat-minimap');
    if (existing) existing.remove();

    chatBars = [];
    activeIndex = -1;
    hoveredIndex = -1;

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

    // Scrollable bars container (handles large chat histories)
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
        const preview = rawText.substring(0, 60) + (rawText.length > 60 ? '\u2026' : '');

        const line = document.createElement('div');
        Object.assign(line.style, {
            width: '35px',
            height: '12px',
            backgroundColor: '#666',
            borderRadius: '3px',
            cursor: 'pointer',
            flexShrink: '0',
            transition: 'background-color 0.2s ease, width 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            pointerEvents: 'auto'
        });

        const tooltip = document.createElement('div');
        Object.assign(tooltip.style, {
            position: 'absolute',
            right: '45px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#171717',
            color: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            width: '260px',
            display: 'none',
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            borderLeft: `4px solid ${accentColor}`,
            lineHeight: '1.4',
            zIndex: '10001',
            wordBreak: 'break-word'
        });
        tooltip.innerHTML = `<b style="color:${accentColor}">${senderLabel}:</b><br>${preview}`;

        // Hover: temporarily highlight this bar in white
        line.addEventListener('mouseenter', () => {
            hoveredIndex = index;
            applyHighlights();
            tooltip.style.display = 'block';
        });

        // Mouse leave: restore scroll-based highlight
        line.addEventListener('mouseleave', () => {
            hoveredIndex = -1;
            applyHighlights();
            tooltip.style.display = 'none';
        });

        // Click: scroll to message and set as active
        line.addEventListener('click', () => navigateTo(index));

        line.appendChild(tooltip);
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
        transition: 'color 0.2s ease, opacity 0.2s ease',
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

// ── Highlight logic ───────────────────────────────────────────────────────────

function applyHighlights() {
    // Hover takes precedence over scroll-based active
    const displayIdx = hoveredIndex !== -1 ? hoveredIndex : activeIndex;

    chatBars.forEach(({ line }, i) => {
        if (i === displayIdx) {
            line.style.backgroundColor = '#ffffff';
            line.style.width = '50px';
            line.style.boxShadow = '0 0 8px rgba(255,255,255,0.45)';
        } else {
            line.style.backgroundColor = '#666';
            line.style.width = '35px';
            line.style.boxShadow = 'none';
        }
    });
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigateTo(index) {
    if (index < 0 || index >= chatBars.length) return;

    activeIndex = index;
    applyHighlights();
    updateArrowStates();

    // Scroll the sidebar bar into view (instant, no page-scroll conflict)
    chatBars[index].line.scrollIntoView({ block: 'nearest' });

    // Scroll the chat message into view
    const { article } = chatBars[index];
    article.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Compensate for fixed header after smooth scroll settles
    const headerHeight = document.querySelector('header')?.offsetHeight || 60;
    setTimeout(() => {
        const scrollContainer =
            article.closest('.overflow-y-auto') ||
            document.querySelector('main .flex-1.overflow-hidden') ||
            window;
        if (scrollContainer !== window) {
            scrollContainer.scrollBy({ top: -headerHeight, behavior: 'smooth' });
        } else {
            window.scrollBy({ top: -headerHeight, behavior: 'smooth' });
        }
    }, 500);
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
    if (chatBars.length === 0) return;

    // The active message is the last one whose top edge is above 40% of viewport
    const threshold = window.innerHeight * 0.4;
    let newIdx = 0;

    chatBars.forEach(({ article }, i) => {
        if (article.getBoundingClientRect().top <= threshold) {
            newIdx = i;
        }
    });

    if (newIdx !== activeIndex) {
        activeIndex = newIdx;
        applyHighlights();
        updateArrowStates();
        // Keep the active bar visible in the sidebar (instant, avoids jitter)
        chatBars[newIdx].line.scrollIntoView({ block: 'nearest' });
    }
}

// ── MutationObserver & startup ────────────────────────────────────────────────

const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(createNavigator, 800);
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(createNavigator, 2000);
