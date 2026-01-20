// Manage Menu Items JavaScript
let editingItemId = null;
let allMenuItems = [];
let categories = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCategories();
    loadMenuItems();
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

// Load categories for dropdown
function loadCategories() {
    const categoriesRef = database.ref('categories');
    
    categoriesRef.on('value', (snapshot) => {
        categories = [];
        const categoryFilter = document.getElementById('categoryFilter');
        const itemCategory = document.getElementById('itemCategory');
        
        // Reset dropdowns
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        itemCategory.innerHTML = '<option value="">Select Category</option>';
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const category = childSnapshot.val();
                categories.push({
                    id: childSnapshot.key,
                    name: category.name
                });
                
                // Add to filter dropdown
                categoryFilter.innerHTML += `<option value="${childSnapshot.key}">${category.name}</option>`;
                
                // Add to item category dropdown
                itemCategory.innerHTML += `<option value="${childSnapshot.key}">${category.name}</option>`;
            });
        }
    });
}

// Load all menu items from Firebase
function loadMenuItems() {
    const menuItemsRef = database.ref('menuItems');
    
    menuItemsRef.on('value', (snapshot) => {
        allMenuItems = [];
        const tableBody = document.getElementById('menuItemsTableBody');
        
        if (!snapshot.exists()) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-utensils"></i>
                        <h3>No Menu Items Yet</h3>
                        <p>Click "Add Menu Item" to create your first item</p>
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const item = childSnapshot.val();
            allMenuItems.push({
                id: childSnapshot.key,
                ...item
            });
        });

        displayMenuItems(allMenuItems);
    });
}

// Display menu items in table
function displayMenuItems(items) {
    const tableBody = document.getElementById('menuItemsTableBody');
    
    if (items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No items found matching your filters</p>
                </td>
            </tr>
        `;
        return;
    }

    let tableHTML = '';
    items.forEach(item => {
        const category = categories.find(cat => cat.id === item.category);
        const categoryName = category ? category.name : 'Unknown';
        
        tableHTML += `
            <tr>
                <td class="item-image-cell">
                    <img src="${item.imageUrl || './images/placeholder.jpg'}" alt="${item.name}">
                </td>
                <td>
                    <span class="item-id">${item.id || 'N/A'}</span>
                </td>
                <td><strong>${item.name}</strong></td>
                <td>
                    <span class="item-category-badge">${categoryName}</span>
                </td>
                <td>${item.size || 'N/A'}</td>
                <td class="item-price">R${parseFloat(item.price).toFixed(2)}</td>
                <td>
                    <span class="item-status ${item.available ? 'status-available' : 'status-unavailable'}">
                        ${item.available ? 'Available' : 'Unavailable'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editItem('${item.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteItem('${item.id}', '${item.name}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

// Filter items
function filterItems() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredItems = allMenuItems;
    
    // Filter by category
    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    // Filter by status
    if (statusFilter !== '') {
        const available = statusFilter === 'true';
        filteredItems = filteredItems.filter(item => item.available === available);
    }
    
    displayMenuItems(filteredItems);
}

// Open add modal
function openAddModal() {
    editingItemId = null;
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuItemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('displayItemId').value = 'Auto-generated';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('menuItemModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('menuItemModal').classList.remove('active');
    editingItemId = null;
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

// Edit item
async function editItem(itemId) {
    editingItemId = itemId;
    
    const itemSnapshot = await database.ref('menuItems/' + itemId).once('value');
    const item = itemSnapshot.val();
    
    if (!item) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemId').value = itemId;
    document.getElementById('displayItemId').value = itemId;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category || '';
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemSize').value = item.size || '';
    document.getElementById('itemPrice').value = item.price || '';
    document.getElementById('itemStatus').value = item.available ? 'true' : 'false';
    document.getElementById('itemStock').value = item.stock || '';
    
    // Show image preview if exists
    if (item.imageUrl) {
        const preview = document.getElementById('imagePreview');
        preview.src = item.imageUrl;
        preview.style.display = 'block';
    }
    
    document.getElementById('menuItemModal').classList.add('active');
}

// Delete item
async function deleteItem(itemId, itemName) {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await database.ref('menuItems/' + itemId).remove();
        alert('Menu item deleted successfully!');
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item: ' + error.message);
    }
}

// Handle form submission
document.getElementById('menuItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const description = document.getElementById('itemDescription').value.trim();
    const size = document.getElementById('itemSize').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);
    const available = document.getElementById('itemStatus').value === 'true';
    const stock = document.getElementById('itemStock').value.trim();
    const imageFile = document.getElementById('itemImage').files[0];
    
    if (!category) {
        alert('Please select a category');
        return;
    }
    
    try {
        // Show loading
        const submitBtn = e.target.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        let imageUrl = null;
        
        // Upload image if provided
        if (imageFile) {
            const storageRef = storage.ref('menuItems/' + Date.now() + '_' + imageFile.name);
            const uploadTask = await storageRef.put(imageFile);
            imageUrl = await uploadTask.ref.getDownloadURL();
        } else if (editingItemId) {
            // Keep existing image if editing and no new image provided
            const existingItem = await database.ref('menuItems/' + editingItemId).once('value');
            imageUrl = existingItem.val()?.imageUrl || null;
        }
        
        // Prepare item data
        const itemData = {
            name,
            category,
            description,
            size: size || null,
            price,
            available,
            stock: stock ? parseInt(stock) : null,
            imageUrl,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        if (editingItemId) {
            // Update existing item
            itemData.id = editingItemId;
            await database.ref('menuItems/' + editingItemId).update(itemData);
            alert('Menu item updated successfully!');
        } else {
            // Create new item
            itemData.createdAt = firebase.database.ServerValue.TIMESTAMP;
            const newItemRef = await database.ref('menuItems').push(itemData);
            // Update with the generated ID
            await database.ref('menuItems/' + newItemRef.key).update({
                id: newItemRef.key
            });
            alert('Menu item added successfully!');
        }
        
        // Reset form and close modal
        closeModal();
        document.getElementById('menuItemForm').reset();
        
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Failed to save item: ' + error.message);
        
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
window.editItem = editItem;
window.deleteItem = deleteItem;
window.filterItems = filterItems;
window.handleLogout = handleLogout;
