// Forgot Password JavaScript for The Pizza Club and Grill
// Handles password reset with email verification code

let userEmail = '';
let verificationCodeSent = '';

document.addEventListener('DOMContentLoaded', function() {
    
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

// Step 1: Send verification code to email
async function handleRequestCode(e) {
    e.preventDefault();
    await handleEmailReset();
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

// Step 2: Verify the code
async function handleVerifyCode(e) {
    e.preventDefault();
    
    const enteredCode = document.getElementById('verificationCode').value.trim();
    
    // Show loading state
    toggleButton('verifyCodeBtn', true);
    hideMessages('step2');
    
    try {
        // Retrieve stored code from Realtime Database
        const codeRef = database.ref('passwordResetCodes/' + btoa(userEmail));
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
    
    try {
        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodeSent = verificationCode;
        
        // Update code in database
        const codeRef = database.ref('passwordResetCodes/' + btoa(userEmail));
        await codeRef.update({
            code: verificationCode,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            expiresAt: Date.now() + (5 * 60 * 1000)
        });
        
        // Send new password reset email
        await auth.sendPasswordResetEmail(userEmail);
        console.log('New Email Verification Code:', verificationCode);
        
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
        const codeRef = database.ref('passwordResetCodes/' + btoa(userEmail));
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
