// Desktop Mode Detection and Windows GUI Style Loader
// This script detects if the app is running in desktop mode
// and loads the Windows GUI stylesheet accordingly

(function() {
    'use strict';
    
    // Check if running in desktop mode
    function isDesktopMode() {
        // Check URL parameter (set by desktop-launcher.html)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('desktop') === 'true') {
            return true;
        }
        
        // Check sessionStorage flag (set by desktop-launcher.html)
        // sessionStorage is isolated per window, won't affect PWA
        if (sessionStorage.getItem('desktopApp') === 'true') {
            return true;
        }
        
        return false;
    }
    
    // Load Windows GUI CSS for desktop mode
    function loadWindowsGUIStyle() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/windows-gui.css';
        link.id = 'windows-gui-style';
        document.head.appendChild(link);
        
        // Add desktop mode class to body
        document.body.classList.add('desktop-mode');
        document.body.classList.add('windows-gui');
        
        // Maintain desktop mode during navigation
        addDesktopParamToLinks();
        
        console.log('✅ Windows GUI style loaded for desktop app');
    }
    
    // Add ?desktop=true parameter to all internal links
    function addDesktopParamToLinks() {
        const processLinks = () => {
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                
                // Only process relative links (not external, not anchors, not javascript:)
                if (href && 
                    !href.startsWith('http') && 
                    !href.startsWith('//') && 
                    !href.startsWith('#') && 
                    !href.startsWith('javascript:') &&
                    !href.includes('?desktop=true') &&
                    !href.includes('&desktop=true')) {
                    
                    // Set sessionStorage on link click to maintain desktop mode
                    link.addEventListener('click', function() {
                        sessionStorage.setItem('desktopApp', 'true');
                    });
                    
                    // Add ?desktop=true parameter to URL
                    const separator = href.includes('?') ? '&' : '?';
                    link.setAttribute('href', href + separator + 'desktop=true');
                }
            });
        };
        
        // Process links now and whenever DOM changes
        processLinks();
        
        // Use MutationObserver to catch dynamically added links
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(processLinks);
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    
    // Initialize on page load
    function init() {
        // Check if in desktop mode and load Windows GUI
        if (isDesktopMode()) {
            loadWindowsGUIStyle();
            
            // Add Windows app title attribute
            document.title = document.title + ' - Desktop App';
            console.log('🖥️ Desktop mode: Windows GUI activated');
        } else {
            console.log('🌐 Normal mode: Website styling active');
        }
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose function to check desktop mode
    window.isDesktopApp = isDesktopMode;
    
})();
