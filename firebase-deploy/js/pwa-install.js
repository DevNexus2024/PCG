// PWA Installation Prompt Handler
// Handles the "Install App" prompt for Progressive Web App

(function() {
    'use strict';
    
    let deferredPrompt = null;
    let installButton = null;
    let installBanner = null;

    // Initialize PWA features
    function initPWA() {
        console.log('🚀 Initializing PWA features...');
        
        // Register Service Worker
        registerServiceWorker();
        
        // Create install banner
        createInstallBanner();
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        // Check if already installed
        window.addEventListener('appinstalled', handleAppInstalled);
        
        // Check if running as PWA
        if (isPWAInstalled()) {
            console.log('✅ Running as installed PWA');
            hideInstallBanner();
        }
    }

    // Register Service Worker
    async function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('✅ New Service Worker available');
                            showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.warn('⚠️ Service Workers not supported');
        }
    }

    // Create install banner UI
    function createInstallBanner() {
        // Check if user has dismissed the banner before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
        
        // Show again after 7 days
        if (dismissed && dismissedTime) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                console.log('📱 Install banner dismissed recently, not showing');
                return;
            }
        }

        // Create banner element
        installBanner = document.createElement('div');
        installBanner.id = 'pwa-install-banner';
        installBanner.className = 'pwa-install-banner';
        installBanner.style.display = 'none'; // Hidden initially
        
        installBanner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="pwa-banner-text">
                    <strong>Install Pizza Club App</strong>
                    <p>Get quick access and offline support!</p>
                </div>
                <div class="pwa-banner-actions">
                    <button id="pwa-install-btn" class="pwa-btn-install">
                        <i class="fas fa-download"></i> Install
                    </button>
                    <button id="pwa-dismiss-btn" class="pwa-btn-dismiss">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(installBanner);
        
        // Get button references
        installButton = document.getElementById('pwa-install-btn');
        const dismissButton = document.getElementById('pwa-dismiss-btn');
        
        // Add event listeners
        if (installButton) {
            installButton.addEventListener('click', handleInstallClick);
        }
        
        if (dismissButton) {
            dismissButton.addEventListener('click', handleDismissClick);
        }
        
        // Add CSS styles
        addInstallBannerStyles();
    }

    // Add CSS styles for install banner
    function addInstallBannerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #DC3545 0%, #C82333 100%);
                color: white;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
                z-index: 9999;
                animation: slideUp 0.4s ease-out;
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }
            
            .pwa-banner-content {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                max-width: 1200px;
                margin: 0 auto;
                gap: 16px;
            }
            
            .pwa-banner-icon {
                font-size: 32px;
                flex-shrink: 0;
            }
            
            .pwa-banner-text {
                flex-grow: 1;
            }
            
            .pwa-banner-text strong {
                display: block;
                font-size: 16px;
                margin-bottom: 4px;
            }
            
            .pwa-banner-text p {
                margin: 0;
                font-size: 13px;
                opacity: 0.9;
            }
            
            .pwa-banner-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .pwa-btn-install,
            .pwa-btn-dismiss {
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .pwa-btn-install {
                background: white;
                color: #DC3545;
            }
            
            .pwa-btn-install:hover {
                background: #f8f9fa;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .pwa-btn-dismiss {
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.5);
                padding: 10px 16px;
            }
            
            .pwa-btn-dismiss:hover {
                background: rgba(255,255,255,0.1);
            }
            
            @media (max-width: 768px) {
                .pwa-banner-content {
                    padding: 12px 16px;
                    gap: 12px;
                }
                
                .pwa-banner-icon {
                    font-size: 24px;
                }
                
                .pwa-banner-text strong {
                    font-size: 14px;
                }
                
                .pwa-banner-text p {
                    font-size: 12px;
                }
                
                .pwa-btn-install {
                    padding: 8px 16px;
                    font-size: 13px;
                }
                
                .pwa-btn-dismiss {
                    padding: 8px 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Handle beforeinstallprompt event
    function handleBeforeInstallPrompt(event) {
        console.log('📱 Install prompt available');
        
        // Prevent default prompt
        event.preventDefault();
        
        // Store the event
        deferredPrompt = event;
        
        // Show custom banner
        showInstallBanner();
    }

    // Show install banner
    function showInstallBanner() {
        if (installBanner && !isPWAInstalled()) {
            installBanner.style.display = 'block';
            console.log('✅ Install banner shown');
        }
    }

    // Hide install banner
    function hideInstallBanner() {
        if (installBanner) {
            installBanner.style.display = 'none';
        }
    }

    // Handle install button click
    async function handleInstallClick() {
        if (!deferredPrompt) {
            console.warn('⚠️ Install prompt not available');
            return;
        }
        
        console.log('📱 Showing install prompt...');
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`📱 User choice: ${outcome}`);
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted installation');
        } else {
            console.log('❌ User dismissed installation');
        }
        
        // Clear the prompt
        deferredPrompt = null;
        
        // Hide banner
        hideInstallBanner();
    }

    // Handle dismiss button click
    function handleDismissClick() {
        console.log('👋 User dismissed install banner');
        
        // Save dismissal to localStorage
        localStorage.setItem('pwa-install-dismissed', 'true');
        localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
        
        // Hide banner
        hideInstallBanner();
    }

    // Handle app installed event
    function handleAppInstalled() {
        console.log('🎉 PWA installed successfully!');
        hideInstallBanner();
        
        // Show success message
        if (typeof alert !== 'undefined') {
            setTimeout(() => {
                alert('App installed successfully! You can now access Pizza Club from your home screen.');
            }, 500);
        }
    }

    // Check if PWA is installed
    function isPWAInstalled() {
        // Check if running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        
        // Check iOS standalone mode
        if (window.navigator.standalone === true) {
            return true;
        }
        
        // Check document referrer for installed PWA
        if (document.referrer.includes('android-app://')) {
            return true;
        }
        
        return false;
    }

    // Show update notification
    function showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'pwa-update-banner';
        updateBanner.innerHTML = `
            <div class="pwa-update-content">
                <i class="fas fa-sync-alt"></i>
                <span>New version available!</span>
                <button onclick="window.location.reload()">Update Now</button>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .pwa-update-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #28a745;
                color: white;
                z-index: 10000;
                padding: 12px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .pwa-update-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }
            .pwa-update-content button {
                background: white;
                color: #28a745;
                border: none;
                padding: 6px 16px;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(style);
        document.body.insertBefore(updateBanner, document.body.firstChild);
    }

    // Expose PWA status check
    window.isPWAInstalled = isPWAInstalled;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

})();
