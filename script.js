// ============================================
// PRODUCT DATA
// ============================================
const products = [
    { id: 1, name: "Premium Laptop", price: 999.99, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" },
    { id: 2, name: "Smartphone Pro", price: 699.99, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400" },
    { id: 3, name: "Wireless Headphones", price: 199.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
    { id: 4, name: "Smart Watch", price: 299.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" },
    { id: 5, name: "4K Camera", price: 499.99, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400" },
    { id: 6, name: "Gaming Tablet", price: 399.99, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400" }
];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    populateProductSelect();
    setupEventListeners();
    setMinDate();
});

// ============================================
// PRODUCT DISPLAY FUNCTIONS
// ============================================
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <input type="number" class="product-quantity" id="qty-${product.id}" min="1" value="1">
                <button class="order-now-btn" onclick="quickOrder(${product.id})">
                    Order Now <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function populateProductSelect() {
    const productSelect = document.getElementById('productSelect');
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">Choose a product</option>' +
        products.map(product => `
            <option value="${product.id}" data-price="${product.price}">${product.name} - $${product.price}</option>
        `).join('');
    
    productSelect.addEventListener('change', calculateTotal);
}

function calculateTotal() {
    const productSelect = document.getElementById('productSelect');
    const quantity = document.getElementById('quantity');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!productSelect || !quantity || !totalAmount) return;
    
    if (productSelect.value && quantity.value) {
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price);
        const total = price * parseInt(quantity.value);
        totalAmount.value = `$${total.toFixed(2)}`;
    } else {
        totalAmount.value = '$0.00';
    }
}

function quickOrder(productId) {
    const product = products.find(p => p.id === productId);
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = quantityInput ? quantityInput.value : 1;
    
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
    
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.value = productId;
    }
    const quantityField = document.getElementById('quantity');
    if (quantityField) {
        quantityField.value = quantity;
    }
    calculateTotal();
    
    showToast(`${product.name} selected! Please fill your details.`, 'success');
}

function setMinDate() {
    const dateInput = document.getElementById('deliveryDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
}

// ============================================
// LOCAL STORAGE BACKUP (fallback if cloud fails)
// ============================================
function saveOrderToLocalStorage(order) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// ============================================
// SAVE ORDER TO SUPABASE CLOUD
// ============================================
async function saveOrderToSupabase(orderData) {
    try {
        const { data, error } = await window.supabase
            .from('orders')
            .insert([{
                order_id: orderData.orderId,
                customer_name: orderData.customerName,
                address: orderData.address,
                phone: orderData.phone,
                product: orderData.product,
                quantity: orderData.quantity,
                total_amount: orderData.totalAmount,
                delivery_date: orderData.deliveryDate,
                time_slot: orderData.timeSlot,
                status: orderData.status,
                created_at: new Date().toISOString()
            }]);
        
        if (error) {
            console.error('Supabase error:', error);
            return false;
        }
        
        console.log('✅ Order saved to Supabase cloud!', data);
        return true;
        
    } catch (error) {
        console.error('Connection error:', error);
        return false;
    }
}

// ============================================
// SUBMIT ORDER
// ============================================
async function submitOrder(e) {
    e.preventDefault();
    
    // Get form values
    const customerName = document.getElementById('customerName')?.value;
    const address = document.getElementById('address')?.value;
    const phone = document.getElementById('phone')?.value;
    const productId = document.getElementById('productSelect')?.value;
    const quantity = parseInt(document.getElementById('quantity')?.value);
    const deliveryDate = document.getElementById('deliveryDate')?.value;
    const timeSlot = document.getElementById('timeSlot')?.value;
    const totalAmount = parseFloat(document.getElementById('totalAmount')?.value.replace('$', '') || 0);
    
    // Validation
    if (!customerName || !address || !phone || !productId || !deliveryDate || !timeSlot) {
        showToast('Please fill all required fields!', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showToast('Please enter a valid 10-digit phone number!', 'error');
        return;
    }
    
    const selectedProduct = products.find(p => p.id === parseInt(productId));
    
    const orderData = {
        orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerName,
        address,
        phone,
        product: selectedProduct.name,
        productId: parseInt(productId),
        quantity,
        totalAmount,
        deliveryDate,
        timeSlot,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    showLoading(true);
    
    try {
        // 1. Try to save to Supabase cloud first
        const cloudSuccess = await saveOrderToSupabase(orderData);
        
        if (cloudSuccess) {
            showToast('✅ Order saved to cloud!', 'success');
        } else {
            showToast('⚠️ Cloud save failed, saving locally only', 'warning');
        }
        
        // 2. Always save to localStorage as backup
        saveOrderToLocalStorage(orderData);
        
        // 3. Reset form
        document.getElementById('orderForm')?.reset();
        calculateTotal();
        setMinDate();
        
        // 4. Refresh admin dashboard if it's open
        if (window.adminRefreshDashboard) {
            await window.adminRefreshDashboard();
        }
        
        // 5. Scroll to top
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
        
    } catch (error) {
        console.error('Order submission error:', error);
        showToast('Error submitting order!', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    if (type === 'success') toast.style.backgroundColor = '#48bb78';
    else if (type === 'error') toast.style.backgroundColor = '#f56565';
    else toast.style.backgroundColor = '#ed8936'; // warning
    
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

function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }
    
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateTotal);
    }
    
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}
// ========== ALL YOUR EXISTING JAVASCRIPT CODE ABOVE HERE ==========

// === PASTE THE MOBILE MENU JAVASCRIPT CODE HERE (at the bottom) ===
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        document.addEventListener('click', function(event) {
            if (!mobileNav.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                mobileNav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
        
        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }
});