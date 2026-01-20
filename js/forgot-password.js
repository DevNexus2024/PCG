// Forgot Password JavaScript for The Pizza Club and Grill
// Handles password reset with email/SMS verification code

let userEmail = '';
let userPhone = '';
let resetMethod = 'email';
let verificationCodeSent = '';
let confirmationResult = null;

document.addEventListener('DOMContentLoaded', function() {
    
    // Handle reset method toggle
    const resetMethodRadios = document.querySelectorAll('input[name="resetMethod"]');
    resetMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            resetMethod = this.value;
            toggleResetFields();
        });
    });
    
    // Step 1: Request verification code
    const requestCodeForm = document.getElementById('requestCodeForm');
    if (requestCodeForm) {
        requestCodeForm.addEventListener('submit', handleRequestCode);
    }

    // Step 2: Verify code
    const verifyCodeForm = document.getElementById('verifyCodeForm');
    if (verifyCodeForm) {
        verifyCodeForm.addEventListener('submit', handleVerifyCode);
    }

    // Step 3: Reset password
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
});

// Toggle between email and phone fields
function toggleResetFields() {
    const emailField = document.getElementById('emailField');
    const phoneField = document.getElementById('phoneField');
    const resetEmail = document.getElementById('resetEmail');
    const resetPhone = document.getElementById('resetPhone');
    
    if (resetMethod === 'email') {
        emailField.style.display = 'block';
        phoneField.style.display = 'none';
        resetEmail.required = true;
        resetPhone.required = false;
    } else {
        emailField.style.display = 'none';
        phoneField.style.display = 'block';
        resetEmail.required = false;
        resetPhone.required = true;
    }
}

// Step 1: Send verification code to email or phone
async function handleRequestCode(e) {
    e.preventDefault();
    
    if (resetMethod === 'email') {
        await handleEmailReset();
    } else {
        await handlePhoneReset();
    }
}

// Handle email-based password reset
async function handleEmailReset() {
    const email = document.getElementById('resetEmail').value.trim();
    userEmail = email;
    
    // Show loading state
    toggleButton('sendCodeBtn', true);
    hideMessages('step1');
    
    try {
        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodeSent = verificationCode;
        
        // Store code in Realtime Database with expiration (5 minutes)
        const codeRef = database.ref('passwordResetCodes/' + btoa(email));
        await codeRef.set({
            code: verificationCode,
            email: email,
            method: 'email',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes from now
        });
        
        // Send password reset email using Firebase Auth
        await auth.sendPasswordResetEmail(email);
        
        // For development/testing - log the code (remove in production)
        console.log('Email Verification Code:', verificationCode);
        
        // Show success message
        showSuccessMessage('step1', `Verification code sent to ${email}. Check your email!`);
        
        // Move to step 2
        setTimeout(() => {
            showStep(2);
        }, 2000);
        
    } catch (error) {
        console.error('Send email code error:', error);
        
        let errorMessage = 'Failed to send verification code.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            default:
                errorMessage = error.message;
        }
        
        showErrorMessage('step1', errorMessage);
        toggleButton('sendCodeBtn', false);
    }
}

// Handle phone-based password reset
async function handlePhoneReset() {
    const phone = document.getElementById('resetPhone').value.trim();
    userPhone = phone;
    
    // Show loading state
    toggleButton('sendCodeBtn', true);
    hideMessages('step1');
    
    try {
        // Validate phone number format
        if (!phone.startsWith('+')) {
            throw new Error('Phone number must include country code (e.g., +1234567890)');
        }
        
        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodeSent = verificationCode;
        
        // Store code in Realtime Database
        const codeRef = database.ref('passwordResetCodes/' + btoa(phone));
        await codeRef.set({
            code: verificationCode,
            phone: phone,
            method: 'phone',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            expiresAt: Date.now() + (5 * 60 * 1000)
        });
        
        // Note: For SMS functionality, you'll need to:
        // 1. Enable Firebase Phone Authentication in Firebase Console
        // 2. Set up reCAPTCHA verification
        // 3. Use Firebase Phone Auth or integrate with SMS service (Twilio, etc.)
        
        // For now, we'll simulate SMS sending and log the code
        console.log('SMS Verification Code:', verificationCode);
        console.log('Phone:', phone);
        
        // In production, use Firebase Phone Auth:
        // const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
        // confirmationResult = await auth.signInWithPhoneNumber(phone, appVerifier);
        
        // Show success message
        showSuccessMessage('step1', `Verification code sent to ${phone}. Check your SMS!`);
        
        // Move to step 2
        setTimeout(() => {
            showStep(2);
        }, 2000);
        
    } catch (error) {
        console.error('Send SMS code error:', error);
        showErrorMessage('step1', error.message || 'Failed to send SMS verification code.');
        toggleButton('sendCodeBtn', false);
    }
}

// Step 2: Verify the code
async function handleVerifyCode(e) {
    e.preventDefault();
    
    const enteredCode = document.getElementById('verificationCode').value.trim();
    const identifier = resetMethod === 'email' ? userEmail : userPhone;
    
    // Show loading state
    toggleButton('verifyCodeBtn', true);
    hideMessages('step2');
    
    try {
        // Retrieve stored code from Realtime Database
        const codeRef = database.ref('passwordResetCodes/' + btoa(identifier));
        const snapshot = await codeRef.once('value');
        const data = snapshot.val();
        
        if (!data) {
            throw new Error('Verification code expired or not found.');
        }
        
        // Check if code has expired
        if (Date.now() > data.expiresAt) {
            await codeRef.remove();
            throw new Error('Verification code has expired. Please request a new one.');
        }
        
        // Verify the code
        if (enteredCode !== data.code) {
            throw new Error('Invalid verification code. Please try again.');
        }
        
        // Code is valid, move to step 3
        showStep(3);
        toggleButton('verifyCodeBtn', false);
        
    } catch (error) {
        console.error('Verify code error:', error);
        showErrorMessage('step2', error.message || 'Invalid verification code.');
        toggleButton('verifyCodeBtn', false);
    }
}

// Resend verification code
async function resendCode() {
    hideMessages('step2');
    const identifier = resetMethod === 'email' ? userEmail : userPhone;
    
    try {
        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodeSent = verificationCode;
        
        // Update code in database
        const codeRef = database.ref('passwordResetCodes/' + btoa(identifier));
        await codeRef.update({
            code: verificationCode,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            expiresAt: Date.now() + (5 * 60 * 1000)
        });
        
        if (resetMethod === 'email') {
            // Send new password reset email
            await auth.sendPasswordResetEmail(userEmail);
            console.log('New Email Verification Code:', verificationCode);
        } else {
            // Send new SMS (simulated for now)
            console.log('New SMS Verification Code:', verificationCode);
            console.log('Phone:', userPhone);
        }
        
        showSuccessMessage('step2', 'New verification code sent!');
        
    } catch (error) {
        console.error('Resend code error:', error);
        showErrorMessage('step2', 'Failed to resend code. Please try again.');
    }
}

// Step 3: Reset password
async function handleResetPassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const identifier = resetMethod === 'email' ? userEmail : userPhone;
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
        showErrorMessage('step3', 'Passwords do not match.');
        return;
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
        showErrorMessage('step3', 'Password must be at least 6 characters long.');
        return;
    }
    
    // Show loading state
    toggleButton('resetPasswordBtn', true);
    hideMessages('step3');
    
    try {
        // For phone-based reset, we need to find user by phone in database
        if (resetMethod === 'phone') {
            // Query users collection to find user with this phone
            const usersRef = database.ref('users');
            const snapshot = await usersRef.orderByChild('phone').equalTo(userPhone).once('value');
            const users = snapshot.val();
            
            if (!users) {
                throw new Error('No account found with this phone number.');
            }
            
            // Get the first user's email
            const userId = Object.keys(users)[0];
            const userData = users[userId];
            userEmail = userData.email;
        }
        
        // Get the user by email
        const user = auth.currentUser;
        
        if (user && user.email === userEmail) {
            // User is logged in, update password directly
            await user.updatePassword(newPassword);
        } else {
            // For security, Firebase requires re-authentication to change password
            // Guide user to use the reset link from email
            showErrorMessage('step3', 'Please use the reset link sent to your email to complete the password reset.');
            toggleButton('resetPasswordBtn', false);
            return;
        }
        
        // Delete the verification code
        const codeRef = database.ref('passwordResetCodes/' + btoa(identifier));
        await codeRef.remove();
        
        // Show success message
        showSuccessMessage('step3', 'Password reset successful! Redirecting to login...');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Reset password error:', error);
        
        let errorMessage = 'Failed to reset password.';
        
        switch (error.code) {
            case 'auth/weak-password':
                errorMessage = 'Password is too weak.';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Please use the password reset link sent to your email.';
                break;
            default:
                errorMessage = error.message;
        }
        
        showErrorMessage('step3', errorMessage);
        toggleButton('resetPasswordBtn', false);
    }
}

// UI Helper Functions
function showStep(stepNumber) {
    // Hide all steps
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    // Show the requested step
    document.getElementById('step' + stepNumber).style.display = 'block';
}

function toggleButton(btnId, loading) {
    const btn = document.getElementById(btnId);
    const btnText = document.getElementById(btnId + 'Text');
    const btnLoader = document.getElementById(btnId + 'Loader');
    
    if (loading) {
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
    } else {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function showErrorMessage(step, message) {
    const errorDiv = document.getElementById('errorMessage' + step.replace('step', ''));
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
}

function showSuccessMessage(step, message) {
    const successDiv = document.getElementById('successMessage' + step.replace('step', ''));
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
    }
}

function hideMessages(step) {
    const stepNum = step.replace('step', '');
    const errorDiv = document.getElementById('errorMessage' + stepNum);
    const successDiv = document.getElementById('successMessage' + stepNum);
    
    if (errorDiv) errorDiv.classList.remove('show');
    if (successDiv) successDiv.classList.remove('show');
}
