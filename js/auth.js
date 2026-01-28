// Authentication JavaScript for The Pizza Club and Grill
// This file handles login, signup, and authentication with Firebase

// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - auth.js');
    
    // Don't run auto-redirect on signup page or login page
    const isSignupPage = window.location.pathname.includes('signup.html');
    const isLoginPage = window.location.pathname.includes('login.html');
    
    console.log('Is Signup Page:', isSignupPage);
    console.log('Is Login Page:', isLoginPage);

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Login form found, attaching event listener');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.log('Login form not found');
    }

    // Google Login Button Handler
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    // Google Signup Button Handler
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleLogin);
    }

    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Check if user is already logged in (only on pages other than login/signup)
    if (typeof auth !== 'undefined' && !isSignupPage && !isLoginPage) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                console.log('User is logged in:', user.email);
                
                try {
                    // Get user data to check role
                    const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
                    let userData = userDataSnapshot.val();
                    
                    // Determine correct role based on email pattern
                    let correctRole = 'customer';
                    const emailLower = user.email.toLowerCase();
                    
                    if (emailLower.includes('pcg-a')) {
                        // Accountant (pcg-a001@gmail.com, etc.)
                        correctRole = 'accountant';
                    } else if (emailLower.match(/pcg\d+@/)) {
                        // Admin/Supervisor/Cashier (pcg001@gmail.com, pcg002@gmail.com, etc.)
                        correctRole = 'admin';
                    } else {
                        // Regular customer email
                        correctRole = 'customer';
                    }
                    
                    // Create or update user data in database
                    if (!userData) {
                        // User doesn't exist - create new
                        userData = {
                            email: user.email,
                            role: correctRole,
                            name: user.displayName || user.email.split('@')[0],
                            createdAt: new Date().toISOString()
                        };
                        await database.ref('users/' + user.uid).set(userData);
                    } else if (userData.role !== correctRole) {
                        // User exists but role is wrong - update it
                        userData.role = correctRole;
                        await database.ref('users/' + user.uid).update({ role: correctRole });
                    }
                    
                    // Redirect based on role
                    if (userData.role === 'accountant') {
                        if (!window.location.pathname.includes('accountant-dashboard.html')) {
                            window.location.href = 'accountant-dashboard.html';
                        }
                    } else if (userData.role === 'admin' || userData.role === 'supervisor' || userData.role === 'cashier') {
                        if (!window.location.pathname.includes('admin-dashboard.html')) {
                            window.location.href = 'admin-dashboard.html';
                        }
                    } else {
                        if (!window.location.pathname.includes('menu.html')) {
                            window.location.href = 'menu.html';
                        }
                    }
                } catch (error) {
                    console.error('Error checking user role:', error);
                }
            } else {
                // User is signed out
                console.log('User is not logged in');
            }
        });
    }
});

// Handle Email/Password Login
async function handleLogin(e) {
    console.log('handleLogin function called!');
    e.preventDefault();
    console.log('preventDefault called');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    console.log('Login attempt:', email);
    
    // Show loading state
    toggleLoginButton(true);
    hideMessages();
    
    try {
        // Set persistence BEFORE signing in
        if (rememberMe) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Login successful:', user.email);
        
        // Get user data to check role
        const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
        let userData = userDataSnapshot.val();
        
        // Determine correct role based on email pattern
        let correctRole = 'customer';
        const emailLower = email.toLowerCase();
        
        if (emailLower.includes('pcg-a')) {
            // Accountant (pcg-a001@gmail.com, etc.)
            correctRole = 'accountant';
        } else if (emailLower.match(/pcg\d+@/)) {
            // Admin/Supervisor/Cashier (pcg001@gmail.com, pcg002@gmail.com, etc.)
            correctRole = 'admin';
        } else {
            // Regular customer email
            correctRole = 'customer';
        }
        
        // Create or update user data in database
        if (!userData) {
            // User doesn't exist - create new
            userData = {
                email: user.email,
                role: correctRole,
                name: user.displayName || email.split('@')[0],
                createdAt: new Date().toISOString()
            };
            await database.ref('users/' + user.uid).set(userData);
        } else if (userData.role !== correctRole) {
            // User exists but role is wrong - update it
            userData.role = correctRole;
            await database.ref('users/' + user.uid).update({ role: correctRole });
        }
        
        // Determine redirect based on role
        let redirectUrl = 'menu.html'; // Default for customers
        
        // Check if there's a returnUrl parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        
        if (returnUrl) {
            // If returnUrl is provided, use it (for any user)
            redirectUrl = returnUrl;
        } else if (userData.role === 'accountant') {
            redirectUrl = 'accountant-dashboard.html';
        } else if (userData.role === 'admin' || userData.role === 'supervisor' || userData.role === 'cashier') {
            redirectUrl = 'admin-dashboard.html';
        } else {
            redirectUrl = 'menu.html';
        }
        
        // Show success message
        showSuccessMessage('Login successful! Redirecting...');
        
        // Redirect to appropriate page
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 500);
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Show error message
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage = error.message;
        }
        
        showErrorMessage(errorMessage);
        toggleLoginButton(false);
    }
}

// Handle Google Login
async function handleGoogleLogin() {
    hideMessages();
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('Google login successful:', user.email);
        
        // Get user data to check role
        const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
        let userData = userDataSnapshot.val();
        
        // Determine correct role based on email pattern
        let correctRole = 'customer';
        const emailLower = user.email.toLowerCase();
        
        if (emailLower.includes('pcg-a')) {
            // Accountant (pcg-a001@gmail.com, etc.)
            correctRole = 'accountant';
        } else if (emailLower.match(/pcg\d+@/)) {
            // Admin/Supervisor/Cashier (pcg001@gmail.com, pcg002@gmail.com, etc.)
            correctRole = 'admin';
        } else {
            // Regular customer email
            correctRole = 'customer';
        }
        
        // Create or update user data in database
        if (!userData) {
            // User doesn't exist - create new
            userData = {
                email: user.email,
                role: correctRole,
                name: user.displayName || user.email.split('@')[0],
                createdAt: new Date().toISOString()
            };
            await database.ref('users/' + user.uid).set(userData);
        } else if (userData.role !== correctRole) {
            // User exists but role is wrong - update it
            userData.role = correctRole;
            await database.ref('users/' + user.uid).update({ role: correctRole });
        }
        
        // Determine redirect based on role
        let redirectUrl = 'menu.html'; // Default for customers
        
        if (userData.role === 'accountant') {
            redirectUrl = 'accountant-dashboard.html';
        } else if (userData.role === 'admin' || userData.role === 'supervisor' || userData.role === 'cashier') {
            redirectUrl = 'admin-dashboard.html';
        } else {
            redirectUrl = 'menu.html';
        }
        
        // Show success message
        showSuccessMessage('Login successful! Redirecting...');
        
        // Redirect to appropriate page
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
        
    } catch (error) {
        console.error('Google login error:', error);
        
        let errorMessage = 'Google login failed. Please try again.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Login cancelled.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup blocked. Please allow popups for this site.';
        } else {
            errorMessage = error.message;
        }
        
        showErrorMessage(errorMessage);
    }
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const agreeTerms = document.getElementById('agreeTerms')?.checked;
    
    // Validate terms agreement
    if (!agreeTerms) {
        showErrorMessage('Please agree to the Terms & Conditions.');
        return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match.');
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        showErrorMessage('Password must be at least 6 characters long.');
        return;
    }
    
    // Validate phone number (basic validation)
    if (phone && phone.length < 10) {
        showErrorMessage('Please enter a valid phone number.');
        return;
    }
    
    // Show loading state
    toggleSignupButton(true);
    hideMessages();
    
    try {
        // Create user with Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile with display name
        if (fullName) {
            await user.updateProfile({
                displayName: fullName
            });
        }
        
        // Determine role based on email pattern
        let userRole = 'customer'; // Default role
        const emailLower = email.toLowerCase();
        
        if (emailLower.includes('pcg') || emailLower.includes('@pizzaclubgrill.com')) {
            // Staff email - assign role based on email pattern
            if (emailLower.includes('pcg-a')) {
                userRole = 'accountant';
            } else if (emailLower.includes('admin')) {
                userRole = 'admin';
            } else if (emailLower.includes('supervisor')) {
                userRole = 'supervisor';
            } else if (emailLower.includes('cashier')) {
                userRole = 'cashier';
            } else {
                // For pcg emails without specific role keywords, default to supervisor
                userRole = 'supervisor';
            }
        }
        
        // Save additional user data to Realtime Database
        await database.ref('users/' + user.uid).set({
            fullName: fullName,
            email: email,
            phone: phone,
            address: address,
            role: userRole,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        console.log('Signup successful:', user.email);
        
        // Sign out the user so they need to login
        await auth.signOut();
        
        // Show success message
        showSuccessMessage('Account created successfully! Redirecting to login...');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Use at least 6 characters.';
                break;
            default:
                errorMessage = error.message;
        }
        
        showErrorMessage(errorMessage);
        toggleSignupButton(false);
    }
}

// Handle Logout
function handleLogout() {
    auth.signOut().then(() => {
        console.log('User logged out');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// UI Helper Functions
function toggleLoginButton(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnLoader = document.getElementById('loginBtnLoader');
    
    if (loading) {
        loginBtn.disabled = true;
        loginBtnText.style.display = 'none';
        loginBtnLoader.style.display = 'inline-flex';
    } else {
        loginBtn.disabled = false;
        loginBtnText.style.display = 'inline';
        loginBtnLoader.style.display = 'none';
    }
}

function toggleSignupButton(loading) {
    const signupBtn = document.getElementById('signupBtn');
    const signupBtnText = document.getElementById('signupBtnText');
    const signupBtnLoader = document.getElementById('signupBtnLoader');
    
    if (signupBtn) {
        if (loading) {
            signupBtn.disabled = true;
            if (signupBtnText) signupBtnText.style.display = 'none';
            if (signupBtnLoader) signupBtnLoader.style.display = 'inline-flex';
        } else {
            signupBtn.disabled = false;
            if (signupBtnText) signupBtnText.style.display = 'inline';
            if (signupBtnLoader) signupBtnLoader.style.display = 'none';
        }
    }
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
    }
}

function hideMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) errorDiv.classList.remove('show');
    if (successDiv) successDiv.classList.remove('show');
}
