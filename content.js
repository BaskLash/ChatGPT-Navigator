let lastArticleCount = 0;
let debounceTimer;

function createNavigator() {
    const articles = document.querySelectorAll('section[data-testid^="conversation-turn-"]');
    if (articles.length === lastArticleCount && articles.length > 0) return;
    lastArticleCount = articles.length;

    const oldSidebar = document.getElementById('chat-minimap');
    if (oldSidebar) oldSidebar.remove();

    const sidebar = document.createElement('div');
    sidebar.id = 'chat-minimap';
    
    Object.assign(sidebar.style, {
        position: 'fixed',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: '10000',
        maxHeight: '85vh',
        // 'visible' ist wichtig, damit Tooltips links daneben nicht abgeschnitten werden
        overflowY: 'visible', 
        paddingRight: '5px',
        pointerEvents: 'none' // Sidebar selbst ignoriert Maus, nur Kinder (Balken) nicht
    });

    articles.forEach((article, index) => {
        // Robuste Erkennung: User-Nachrichten haben oft ein spezifisches Avatar oder Klassen
        const isUser = article.querySelector('img[alt="User"], .user-avatar, [data-testid="user-message"]') || (index % 2 === 0);
        const accentColor = isUser ? '#007bff' : '#10a37f';
        const senderLabel = isUser ? 'You' : 'ChatGPT';
        
        // Text ohne H5/H6 extrahieren
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.innerHTML;
        tempDiv.querySelectorAll('h5, h6, button, svg').forEach(el => el.remove());
        const rawText = tempDiv.innerText.trim();
        const previewText = rawText.substring(0, 60);

        const line = document.createElement('div');
        Object.assign(line.style, {
            width: '35px',
            height: '12px',
            backgroundColor: '#666',
            borderRadius: '3px',
            cursor: 'pointer',
            flexShrink: '0',
            transition: 'all 0.2s ease',
            position: 'relative',
            pointerEvents: 'auto' // Macht den Balken wieder klickbar
        });

        const tooltip = document.createElement('div');
        Object.assign(tooltip.style, {
            position: 'absolute',
            right: '45px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#171717', // Fixer dunkler Hintergrund für bessere Lesbarkeit
            color: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            width: '260px',
            display: 'none',
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            borderLeft: `5px solid ${accentColor}`,
            lineHeight: '1.4',
            zIndex: '10001'
        });

        // Tooltip Inhalt sicher aufbauen
        tooltip.innerHTML = `<b style="color:${accentColor}">${senderLabel}:</b><br>${previewText}${rawText.length > 60 ? '...' : ''}`;

        line.addEventListener('mouseenter', () => {
            line.style.backgroundColor = accentColor;
            line.style.width = '50px';
            tooltip.style.display = 'block';
        });

        line.addEventListener('mouseleave', () => {
            line.style.backgroundColor = '#666';
            line.style.width = '35px';
            tooltip.style.display = 'none';
        });

        line.addEventListener('click', () => {
    // 1. Den echten Scroll-Container von ChatGPT finden
    const scrollContainer = article.closest('.overflow-y-auto') || 
                            document.querySelector('main .flex-1.overflow-hidden') || 
                            window;

    // 2. Zielposition berechnen
    const headerHeight = document.querySelector('header')?.offsetHeight || 60;
    
    // Wir nutzen scrollIntoView mit 'start', was innerhalb von Containern am besten klappt
    article.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });

    // 3. Sicherheits-Offset (nach dem Scrollen kurz korrigieren, falls der Header überdeckt)
    setTimeout(() => {
        if (scrollContainer !== window) {
            scrollContainer.scrollBy({ top: -headerHeight, behavior: 'smooth' });
        } else {
            window.scrollBy({ top: -headerHeight, behavior: 'smooth' });
        }
    }, 500);
});


        line.appendChild(tooltip);
        sidebar.appendChild(line);
    });

    document.body.appendChild(sidebar);
}

// Observer & Startup
const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(createNavigator, 800);
});
observer.observe(document.body, { childList: true, subtree: true });

// Initialer Check
setTimeout(createNavigator, 2000);
