// ============================================
// ADMIN DASHBOARD LOGIC WITH SUPABASE
// ============================================

// Admin authentication state
let isAdminAuthenticated = false;

// DOM Elements
let adminSection;
let passwordModal;
let closePasswordModalBtn;
let submitPasswordBtn;
let adminPasswordInput;
let passwordError;
let closeAdminBtn;

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    adminSection = document.getElementById('adminSection');
    passwordModal = document.getElementById('passwordModal');
    closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
    submitPasswordBtn = document.getElementById('submitPasswordBtn');
    adminPasswordInput = document.getElementById('adminPasswordInput');
    passwordError = document.getElementById('passwordError');
    closeAdminBtn = document.getElementById('closeAdminBtn');
    
    // Setup admin event listeners
    setupAdminEventListeners();
    
    // Check if already authenticated (session storage)
    if (sessionStorage.getItem('adminAuthenticated') === 'true') {
        isAdminAuthenticated = true;
        showAdminDashboard();
        refreshAdminDashboard();
    }
});

// Setup admin event listeners
function setupAdminEventListeners() {
    const adminNavBtn = document.getElementById('adminNavBtn');
    if (adminNavBtn) {
        adminNavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordModal();
        });
    }
    
    if (closePasswordModalBtn) {
        closePasswordModalBtn.addEventListener('click', () => {
            hidePasswordModal();
        });
    }
    
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', verifyPassword);
    }
    
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyPassword();
            }
        });
    }
    
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            hideAdminDashboard();
        });
    }
    
    // Search and filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => filterAdminOrders());
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => filterAdminOrders());
    }
    
    const refreshBtn = document.getElementById('refreshAdminBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshAdminDashboard();
            showToast('Dashboard refreshed!', 'success');
        });
    }
    
    // Click outside modal to close
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                hidePasswordModal();
            }
        });
    }
}

// Show password modal
function showPasswordModal() {
    if (passwordModal) {
        passwordModal.style.display = 'flex';
        if (adminPasswordInput) {
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
        if (passwordError) {
            passwordError.textContent = '';
        }
    }
}

// Hide password modal
function hidePasswordModal() {
    if (passwordModal) {
        passwordModal.style.display = 'none';
    }
}

// Verify password
function verifyPassword() {
    const password = adminPasswordInput?.value;
    
    if (password === 'admin123') {
        isAdminAuthenticated = true;
        sessionStorage.setItem('adminAuthenticated', 'true');
        hidePasswordModal();
        showAdminDashboard();
        refreshAdminDashboard();
        showToast('Welcome to Admin Dashboard!', 'success');
    } else {
        if (passwordError) {
            passwordError.textContent = '❌ Incorrect password. Please try again.';
        }
        showToast('Incorrect password!', 'error');
        if (adminPasswordInput) {
            adminPasswordInput.value = '';
            adminPasswordInput.focus();
        }
    }
}

// Show admin dashboard
function showAdminDashboard() {
    if (adminSection) {
        adminSection.style.display = 'block';
        adminSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Hide admin dashboard
function hideAdminDashboard() {
    if (adminSection) {
        adminSection.style.display = 'none';
        isAdminAuthenticated = false;
        sessionStorage.removeItem('adminAuthenticated');
        showToast('Logged out from Admin Dashboard', 'success');
    }
}

// ============================================
// GET ORDERS FROM SUPABASE CLOUD
// ============================================
async function getAllOrders() {
    try {
        showLoading(true);
        
        // Fetch orders from Supabase
        const { data, error } = await window.supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('orders') || '[]');
        }
        
        if (!data || data.length === 0) {
            // Try localStorage as fallback
            const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            if (localOrders.length > 0) {
                return localOrders;
            }
            return [];
        }
        
        // Convert Supabase data to match our format
        const orders = data.map(order => ({
            orderId: order.order_id,
            customerName: order.customer_name,
            address: order.address,
            phone: order.phone,
            product: order.product,
            quantity: order.quantity,
            totalAmount: order.total_amount,
            deliveryDate: order.delivery_date,
            timeSlot: order.time_slot,
            status: order.status,
            createdAt: order.created_at
        }));
        
        console.log(`📦 Loaded ${orders.length} orders from Supabase cloud`);
        return orders;
        
    } catch (error) {
        console.error('Connection error:', error);
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('orders') || '[]');
    } finally {
        showLoading(false);
    }
}

// ============================================
// UPDATE ORDER STATUS IN SUPABASE
// ============================================
async function updateOrderStatusInStorage(orderId, newStatus) {
    try {
        showLoading(true);
        
        // Update in Supabase
        const { error } = await window.supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('order_id', orderId);
        
        if (error) {
            console.error('Update error:', error);
            // Fallback to localStorage
            let orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders = orders.map(order => 
                order.orderId === orderId ? { ...order, status: newStatus } : order
            );
            localStorage.setItem('orders', JSON.stringify(orders));
        } else {
            console.log(`✅ Order ${orderId} updated to ${newStatus}`);
        }
        
        // Also update localStorage backup
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders = orders.map(order => 
            order.orderId === orderId ? { ...order, status: newStatus } : order
        );
        localStorage.setItem('orders', JSON.stringify(orders));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// ============================================
// DELETE ORDER FROM SUPABASE
// ============================================
async function deleteOrderFromStorage(orderId) {
    try {
        showLoading(true);
        
        // Delete from Supabase
        const { error } = await window.supabase
            .from('orders')
            .delete()
            .eq('order_id', orderId);
        
        if (error) {
            console.error('Delete error:', error);
        } else {
            console.log(`✅ Order ${orderId} deleted from cloud`);
        }
        
        // Also delete from localStorage backup
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders = orders.filter(order => order.orderId !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// ============================================
// REFRESH ADMIN DASHBOARD
// ============================================
async function refreshAdminDashboard() {
    if (!isAdminAuthenticated) return;
    
    try {
        const orders = await getAllOrders();
        updateStatistics(orders);
        displayOrders(orders);
    } catch (error) {
        console.error('Refresh error:', error);
        showToast('Error loading orders from cloud!', 'error');
    }
}

// Make refresh function available globally
window.adminRefreshDashboard = refreshAdminDashboard;

// ============================================
// UPDATE STATISTICS CARDS
// ============================================
function updateStatistics(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalSales = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const totalOrdersElem = document.getElementById('totalOrders');
    const pendingOrdersElem = document.getElementById('pendingOrders');
    const deliveredOrdersElem = document.getElementById('deliveredOrders');
    const totalSalesElem = document.getElementById('totalSales');
    
    if (totalOrdersElem) totalOrdersElem.textContent = totalOrders;
    if (pendingOrdersElem) pendingOrdersElem.textContent = pendingOrders;
    if (deliveredOrdersElem) deliveredOrdersElem.textContent = deliveredOrders;
    if (totalSalesElem) totalSalesElem.textContent = `$${totalSales.toFixed(2)}`;
}

// ============================================
// DISPLAY ORDERS IN TABLE
// ============================================
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!tbody) return;
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-text">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map((order, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</td>
            <td>${escapeHtml(order.customerName)}</td>
            <td>${escapeHtml(order.address.substring(0, 30))}${order.address.length > 30 ? '...' : ''}</td>
            <td>${order.product}</td>
            <td>${order.quantity}</td>
            <td>$${order.totalAmount.toFixed(2)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status.toUpperCase()}
                </span>
            </td>
            <td class="action-buttons">
                ${order.status === 'pending' ? 
                    `<button class="deliver-btn" onclick="window.updateOrderStatus('${order.orderId}', 'delivered')">
                        <i class="fas fa-check"></i> Deliver
                    </button>` : 
                    `<button class="deliver-btn" onclick="window.updateOrderStatus('${order.orderId}', 'pending')">
                        <i class="fas fa-undo"></i> Pending
                    </button>`
                }
                <button class="delete-btn" onclick="window.deleteOrder('${order.orderId}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// FILTER ORDERS (Search & Status)
// ============================================
let allOrdersCache = [];

async function filterAdminOrders() {
    if (!isAdminAuthenticated) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    // Get fresh orders
    let filteredOrders = await getAllOrders();
    allOrdersCache = filteredOrders;
    
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }
    
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(o => 
            o.customerName.toLowerCase().includes(searchTerm) ||
            o.orderId.toLowerCase().includes(searchTerm) ||
            o.phone.includes(searchTerm)
        );
    }
    
    displayOrders(filteredOrders);
}

// ============================================
// EXPOSE FUNCTIONS FOR HTML BUTTONS
// ============================================
window.updateOrderStatus = async function(orderId, newStatus) {
    const modal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('modalMessage');
    
    modalMessage.textContent = `Are you sure you want to mark this order as ${newStatus}?`;
    modal.style.display = 'flex';
    
    const confirmHandler = async () => {
        await updateOrderStatusInStorage(orderId, newStatus);
        await refreshAdminDashboard();
        showToast(`Order marked as ${newStatus}!`, 'success');
        modal.style.display = 'none';
        cleanup();
    };
    
    const cancelHandler = () => {
        modal.style.display = 'none';
        cleanup();
    };
    
    const cleanup = () => {
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        if (confirmBtn) confirmBtn.removeEventListener('click', confirmHandler);
        if (cancelBtn) cancelBtn.removeEventListener('click', cancelHandler);
    };
    
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (confirmBtn) confirmBtn.addEventListener('click', confirmHandler);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelHandler);
};

window.deleteOrder = async function(orderId) {
    const modal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('modalMessage');
    
    modalMessage.textContent = 'Are you sure you want to delete this order? This action cannot be undone.';
    modal.style.display = 'flex';
    
    const confirmHandler = async () => {
        await deleteOrderFromStorage(orderId);
        await refreshAdminDashboard();
        showToast('Order deleted successfully!', 'success');
        modal.style.display = 'none';
        cleanup();
    };
    
    const cancelHandler = () => {
        modal.style.display = 'none';
        cleanup();
    };
    
    const cleanup = () => {
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        if (confirmBtn) confirmBtn.removeEventListener('click', confirmHandler);
        if (cancelBtn) cancelBtn.removeEventListener('click', cancelHandler);
    };
    
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (confirmBtn) confirmBtn.addEventListener('click', confirmHandler);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelHandler);
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    if (type === 'success') toast.style.backgroundColor = '#48bb78';
    else if (type === 'error') toast.style.backgroundColor = '#f56565';
    else toast.style.backgroundColor = '#ed8936';
    
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}