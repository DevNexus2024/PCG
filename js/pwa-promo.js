// PWA Promotion Banner with QR Code
// Displays a banner promoting the mobile app installation with QR code

(function() {
    'use strict';
    
    // Configuration
    const PROMO_DISMISSED_KEY = 'pwa-promo-dismissed';
    const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    // Check if promotion should be shown
    function shouldShowPromo() {
        // Don't show in desktop mode (Windows GUI app)
        if (window.location.search.includes('desktop=true') || 
            sessionStorage.getItem('desktopApp') === 'true') {
            return false;
        }
        
        // Check if user dismissed it recently
        const dismissed = localStorage.getItem(PROMO_DISMISSED_KEY);
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const now = Date.now();
            if (now - dismissedTime < DISMISS_DURATION) {
                return false;
            }
        }
        
        // Always show on website (PWA or not)
        return true;
    }
    
    // Get current page URL for QR code
    function getCurrentURL() {
        return window.location.origin + '/';
    }
    
    // Generate QR Code using qrcodejs library
    function generateQRCode(elementId, url) {
        const qrElement = document.getElementById(elementId);
        if (!qrElement) {
            console.error('QR code element not found:', elementId);
            return;
        }
        
        // Wait for QRCode library to be available
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not loaded yet, retrying...');
            setTimeout(() => generateQRCode(elementId, url), 200);
            return;
        }
        
        try {
            // Clear existing content
            qrElement.innerHTML = '';
            
            // Generate QR code
            const qr = new QRCode(qrElement, {
                text: url,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
            
            console.log('📱 QR Code generated successfully for:', url);
        } catch (error) {
            console.error('Error generating QR code:', error);
            qrElement.innerHTML = '<p style="color: #333; font-size: 12px; padding: 20px;">QR Code generation failed. Please try refreshing the page.</p>';
        }
    }
    
    // Handle close button
    function handleClose() {
        const promoSection = document.getElementById('pwa-promo-section');
        if (promoSection) {
            promoSection.style.display = 'none';
            // Save dismissal timestamp
            localStorage.setItem(PROMO_DISMISSED_KEY, Date.now().toString());
            console.log('PWA promotion dismissed');
        }
    }
    
    // Handle install button click
    function handleInstallClick() {
        // Trigger the install prompt if available
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    handleClose();
                }
                window.deferredPrompt = null;
            });
        } else {
            // Show manual installation instructions
            alert('To install:\n\n' +
                  '📱 Mobile: Tap the menu button and select "Add to Home Screen"\n\n' +
                  '💻 Desktop: Click the install icon in the address bar');
        }
    }
    
    // Initialize promotion banner
    function init() {
        console.log('🎯 PWA Promo: Initializing...');
        
        // Check if banner element already exists in HTML
        const existingBanner = document.getElementById('pwa-promo-banner');
        if (!existingBanner) {
            console.log('❌ PWA banner element not found in HTML');
            return;
        }
        
        // Check if we should show the promo
        if (!shouldShowPromo()) {
            console.log('❌ PWA promotion hidden (dismissed or desktop mode)');
            const promoSection = document.getElementById('pwa-promo-section');
            if (promoSection) {
                promoSection.style.display = 'none';
            }
            return;
        }
        
        console.log('✅ PWA promotion will be shown');
        
        // Generate QR code after a short delay to ensure element is rendered
        setTimeout(() => {
            const currentURL = getCurrentURL();
            console.log('🔗 Generating QR code for:', currentURL);
            generateQRCode('pwa-qr-code', currentURL);
        }, 100);
        
        // Attach event listeners
        const closeBtn = document.getElementById('close-pwa-promo');
        if (closeBtn) {
            closeBtn.addEventListener('click', handleClose);
        }
        
        const installBtn = document.getElementById('promo-install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', handleInstallClick);
        }
        
        console.log('📱 PWA promotion banner displayed successfully');
    }
    
    // Load QRCode library from CDN
    function loadQRCodeLibrary() {
        console.log('📦 Loading QRCode library...');
        
        // Check if already loaded
        if (typeof QRCode !== 'undefined') {
            console.log('✅ QRCode library already loaded');
            init();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.async = false;
        script.onload = function() {
            console.log('✅ QRCode library loaded successfully');
            init();
        };
        script.onerror = function() {
            console.error('❌ Failed to load QRCode library from CDN');
            // Try alternative CDN
            const altScript = document.createElement('script');
            altScript.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
            altScript.onload = function() {
                console.log('✅ QRCode library loaded from alternative CDN');
                init();
            };
            altScript.onerror = function() {
                console.error('❌ All CDN attempts failed');
            };
            document.head.appendChild(altScript);
        };
        document.head.appendChild(script);
    }
    
    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadQRCodeLibrary);
    } else {
        loadQRCodeLibrary();
    }
    
})();
