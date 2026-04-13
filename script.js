
    document.getElementById('shareButton').addEventListener('click', async () => {
      const shareData = {
        title: 'InstaKeys',
        text: 'Check out InstaKeys! It adds keyboard scrolling and shortcuts to Instagram.',
        url: 'https://github.com/basklash/chatgpt-navigator' // Hier später den Chrome Web Store Link einfügen
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          alert('Link copied to clipboard!');
        }
      } catch (err) {
        console.error('Error sharing:', err);
      }
    });