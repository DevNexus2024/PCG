// Manage Categories JavaScript
let editingCategoryId = null;
let customFields = [];

// Load categories on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCategories();
});

// Check authentication
function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Check if user is staff
        const email = user.email.toLowerCase();
        if (!email.includes('pcg') && !email.includes('@pizzaclubgrill.com')) {
            alert('Access denied. This page is for staff only.');
            window.location.href = 'menu.html';
            return;
        }

        // Verify role in database
        const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
        const userData = userDataSnapshot.val();

        if (!userData || !['admin', 'supervisor', 'cashier'].includes(userData.role)) {
            alert('Access denied. Insufficient permissions.');
            window.location.href = 'menu.html';
        }
    });
}

// Load all categories from Firebase
function loadCategories() {
    const categoriesRef = database.ref('categories');
    
    categoriesRef.on('value', (snapshot) => {
        const categoriesGrid = document.getElementById('categories-grid');
        
        if (!snapshot.exists()) {
            categoriesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-layer-group"></i>
                    <h3>No Categories Yet</h3>
                    <p>Click "Add Category" to create your first category</p>
                </div>
            `;
            return;
        }

        let categoriesHTML = '';
        snapshot.forEach((childSnapshot) => {
            const category = childSnapshot.val();
            const categoryId = childSnapshot.key;
            
            const fieldsHTML = category.fields && category.fields.length > 0
                ? `<div class="category-fields">
                     <h4>Custom Fields:</h4>
                     <div class="field-tags">
                       ${category.fields.map(field => `<span class="field-tag">${field}</span>`).join('')}
                     </div>
                   </div>`
                : '';

            categoriesHTML += `
                <div class="category-card">
                    <div class="category-image">
                        <img src="${category.imageUrl || './images/placeholder.jpg'}" alt="${category.name}">
                        <span class="category-status status-${category.status}">
                            ${category.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="category-content">
                        <h3 class="category-name">${category.name}</h3>
                        <p class="category-description">${category.description || 'No description'}</p>
                        ${fieldsHTML}
                        <div class="category-actions">
                            <button class="btn-edit" onclick="editCategory('${categoryId}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-delete" onclick="deleteCategory('${categoryId}', '${category.name}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        categoriesGrid.innerHTML = categoriesHTML;
    });
}

// Open add modal
function openAddModal() {
    editingCategoryId = null;
    customFields = [];
    document.getElementById('modalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('fieldsBuilder').innerHTML = '';
    document.getElementById('categoryModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('categoryModal').classList.remove('active');
    editingCategoryId = null;
    customFields = [];
}

// Preview image
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Add field input
function addFieldInput() {
    const fieldsBuilder = document.getElementById('fieldsBuilder');
    const fieldItem = document.createElement('div');
    fieldItem.className = 'field-item';
    fieldItem.innerHTML = `
        <input type="text" placeholder="Field name (e.g., Size, Extras)" class="field-input">
        <button type="button" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    fieldsBuilder.appendChild(fieldItem);
}

// Edit category
async function editCategory(categoryId) {
    editingCategoryId = categoryId;
    
    const categorySnapshot = await database.ref('categories/' + categoryId).once('value');
    const category = categorySnapshot.val();
    
    if (!category) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value = categoryId;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryStatus').value = category.status;
    
    // Show image preview if exists
    if (category.imageUrl) {
        const preview = document.getElementById('imagePreview');
        preview.src = category.imageUrl;
        preview.style.display = 'block';
    }
    
    // Load custom fields
    const fieldsBuilder = document.getElementById('fieldsBuilder');
    fieldsBuilder.innerHTML = '';
    
    if (category.fields && category.fields.length > 0) {
        category.fields.forEach(field => {
            const fieldItem = document.createElement('div');
            fieldItem.className = 'field-item';
            fieldItem.innerHTML = `
                <input type="text" value="${field}" class="field-input">
                <button type="button" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fieldsBuilder.appendChild(fieldItem);
        });
    }
    
    document.getElementById('categoryModal').classList.add('active');
}

// Delete category
async function deleteCategory(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await database.ref('categories/' + categoryId).remove();
        alert('Category deleted successfully!');
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category: ' + error.message);
    }
}

// Handle form submission
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const status = document.getElementById('categoryStatus').value;
    const imageFile = document.getElementById('categoryImage').files[0];
    
    // Collect custom fields
    const fieldInputs = document.querySelectorAll('.field-input');
    const fields = Array.from(fieldInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');
    
    try {
        // Show loading
        const submitBtn = e.target.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        let imageUrl = null;
        
        // Upload image if provided
        if (imageFile) {
            const storageRef = storage.ref('categories/' + Date.now() + '_' + imageFile.name);
            const uploadTask = await storageRef.put(imageFile);
            imageUrl = await uploadTask.ref.getDownloadURL();
        } else if (editingCategoryId) {
            // Keep existing image if editing and no new image provided
            const existingCategory = await database.ref('categories/' + editingCategoryId).once('value');
            imageUrl = existingCategory.val()?.imageUrl || null;
        }
        
        // Prepare category data
        const categoryData = {
            name,
            description,
            status,
            fields,
            imageUrl,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        if (editingCategoryId) {
            // Update existing category
            await database.ref('categories/' + editingCategoryId).update(categoryData);
            alert('Category updated successfully!');
        } else {
            // Create new category
            categoryData.createdAt = firebase.database.ServerValue.TIMESTAMP;
            await database.ref('categories').push(categoryData);
            alert('Category added successfully!');
        }
        
        // Reset form and close modal
        closeModal();
        document.getElementById('categoryForm').reset();
        
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Failed to save category: ' + error.message);
        
        // Reset button
        const submitBtn = e.target.querySelector('.btn-submit');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        });
    }
}

// Make functions globally available
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.previewImage = previewImage;
window.addFieldInput = addFieldInput;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.handleLogout = handleLogout;
