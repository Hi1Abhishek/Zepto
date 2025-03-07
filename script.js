// script.js
let cart = JSON.parse(localStorage.getItem("cart")) || []; // Global cart variable

function changeQuantity(index, operation) {
    if (operation === 'increase') {
        cart[index].quantity++;
    } else if (operation === 'decrease' && cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }
    saveCart();
    updateCartDisplay();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptModal').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Order Receipt - Coffee Lovers</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .receipt-total { text-align: right; margin-top: 20px; }
                    h3 { color: #333; text-align: center; }
                </style>
            </head>
            <body onload="window.print(); window.close()">
                ${receiptContent}
            </body>
        </html>
    `);
    printWindow.document.close();
}

function closeReceipt() {
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
        receiptModal.style.display = 'none';
    } else {
        console.error('Receipt modal not found during close');
    }
}

function toggleCart() {
    const cartSection = document.getElementById('Cart');
    const isVisible = cartSection.style.display === 'none' || cartSection.style.display === '';
    cartSection.style.display = isVisible ? 'block' : 'none';
    localStorage.setItem('cartVisible', isVisible ? 'true' : 'false');
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore cart visibility state
    const cartVisible = localStorage.getItem('cartVisible') === 'true';
    document.getElementById('Cart').style.display = cartVisible ? 'block' : 'none';

    updateCartDisplay();
    console.log('Initial cart on page load:', cart);

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            const name = productCard.dataset.productName;
            const price = parseFloat(productCard.dataset.productPrice);
            addToCart(name, price);
        });
    });

    function addToCart(name, price) {
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        saveCart();
        updateCartDisplay();
        console.log('Cart after adding item:', cart);
    }

    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function updateCartDisplay() {
        const cartItems = document.querySelector('.cart_items');
        const cartTotal = document.querySelector('#cart_total_amount');
        const cartCount = document.querySelectorAll('#cart-count');
        const cartBtn = document.getElementById('cart-icon');

        if (!cartItems || !cartTotal || cartCount.length === 0) {
            console.error('One or more cart display elements not found');
            return;
        }

        cartItems.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart_item';
            itemElement.innerHTML = `
                <p>${item.name} (${item.quantity}x)</p>
                <p>₹${(item.price * item.quantity).toFixed(2)}</p>
                <div class="quantity-controls">
                    <button onclick="changeQuantity(${index}, 'decrease')">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 'increase')">+</button>
                </div>
                <button onclick="removeItem(${index})" class="remove-btn">Remove</button>
            `;
            cartItems.appendChild(itemElement);
            total += item.price * item.quantity;
            totalItems += item.quantity;
        });

        cartTotal.textContent = total.toFixed(2);
        cartCount.forEach(count => count.textContent = totalItems);
        cartBtn.classList.toggle('active', cart.length > 0);
        console.log('Updated cart count:', totalItems);
    }

    document.getElementById('cart-icon').addEventListener('click', toggleCart);

    document.querySelector('.cart_checkout_btn').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        console.log('Showing payment modal');
        document.getElementById('paymentModal').style.display = 'block';
    });

    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.getElementById('paymentModal').style.display = 'none';
            document.getElementById('receiptModal').style.display = 'none';
        });
    });

    document.getElementById('paymentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const address = document.getElementById('address').value.trim();
        const paymentMethod = document.getElementById('paymentMethod').value;

        if (!name || !address || !paymentMethod) {
            alert('Please fill all required fields');
            return;
        }

        if (confirm('Are you sure you want to complete the payment? This will clear your cart.')) {
            console.log('Generating receipt for:', { name, address, paymentMethod, cart });
            generateReceipt(name, address, paymentMethod);
            
            cart = [];
            saveCart();
            updateCartDisplay();
            
            document.getElementById('paymentModal').style.display = 'none';
            document.getElementById('Cart').style.display = 'none';
        }
    });

    function generateReceipt(name, address, paymentMethod) {
        const receiptModal = document.getElementById('receiptModal');
        if (!receiptModal) {
            console.error('Receipt modal not found');
            return;
        }

        receiptModal.style.display = 'block';

        const orderNumber = `ORD-${Date.now()}`;
        
        document.getElementById('receipt-name').innerHTML = `<strong>Name:</strong> ${name}`;
        document.getElementById('receipt-address').innerHTML = `<strong>Address:</strong> ${address}`;
        document.getElementById('receipt-date').innerHTML = `<strong>Date & Time:</strong> ${new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })} <br><strong>Order Number:</strong> ${orderNumber}`;
        document.getElementById('receipt-payment-method').textContent = paymentMethod;

        const tbody = document.querySelector('#receipt-items tbody');
        if (!tbody) {
            console.error('Receipt items table body not found');
            return;
        }

        tbody.innerHTML = '';
        let grandTotal = 0;

        cart.forEach(item => {
            const row = document.createElement('tr');
            const itemTotal = item.price * item.quantity;
            grandTotal += itemTotal;
            
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${itemTotal.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('receipt-total-amount').textContent = grandTotal.toFixed(2);
        console.log('Receipt modal should now be visible');
    }
});