// Desktop Mode Detection and Windows GUI Style Loader
// This script detects if the app is running in desktop mode
// and loads the Windows GUI stylesheet accordingly

(function() {
    'use strict';
    
    // Check if running in desktop mode
    function isDesktopMode() {
        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('desktop') === 'true') {
            return true;
        }
        
        // Check if launched with --app flag (window will have minimal chrome)
        // In app mode, window.chrome exists but toolbar is hidden
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        
        // Check localStorage flag (persistent across navigation)
        if (localStorage.getItem('desktopMode') === 'true') {
            return true;
        }
        
        return false;
    }
    
    // Set desktop mode flag in localStorage for persistence
    function setDesktopMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('desktop') === 'true') {
            localStorage.setItem('desktopMode', 'true');
            console.log('🖥️ Desktop mode activated');
        }
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
        
        console.log('✅ Windows GUI style loaded for desktop app');
    }
    
    // Initialize on page load
    function init() {
        // Set desktop mode flag first
        setDesktopMode();
        
        // Check if in desktop mode
        if (isDesktopMode()) {
            console.log('🖥️ Running in Desktop Mode');
            console.log('🎨 Applying Windows GUI styling...');
            loadWindowsGUIStyle();
            
            // Add Windows app title attribute
            document.title = document.title + ' - Desktop App';
        } else {
            console.log('🌐 Running in Web Mode');
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
