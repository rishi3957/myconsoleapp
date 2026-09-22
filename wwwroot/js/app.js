/**
 * Client ABC Pharmacy Single Page Application (SPA)
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let medicines = [];
  let sales = [];
  let activeFilter = 'all';
  let searchQuery = '';

  // DOM Elements
  const medicineTbody = document.getElementById('medicine-tbody');
  const emptyState = document.getElementById('empty-state');
  const emptyMessage = document.getElementById('empty-message');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  
  // KPI Elements
  const kpiTotal = document.getElementById('kpi-total');
  const kpiLowStock = document.getElementById('kpi-low-stock');
  const kpiExpiring = document.getElementById('kpi-expiring');
  const kpiRevenue = document.getElementById('kpi-revenue');
  const salesCount = document.getElementById('sales-count');

  // Modals
  const modalAdd = document.getElementById('modal-add-medicine');
  const modalSell = document.getElementById('modal-sell-medicine');
  const modalNotes = document.getElementById('modal-view-notes');
  const modalSales = document.getElementById('modal-sales-history');

  // Forms
  const formMedicine = document.getElementById('form-medicine');
  const formSell = document.getElementById('form-sell');

  // Initialize
  initApp();

  function initApp() {
    fetchMedicines();
    fetchSales();
    setupEventListeners();
  }

  // --- API Calls ---

  async function fetchMedicines() {
    try {
      const response = await fetch('/api/medicines');
      if (!response.ok) throw new Error('Failed to load medicines');
      medicines = await response.json();
      renderApp();
    } catch (err) {
      showToast('Error loading medicine inventory', 'error');
      console.error(err);
    }
  }

  async function fetchSales() {
    try {
      const response = await fetch('/api/sales');
      if (!response.ok) throw new Error('Failed to load sales history');
      sales = await response.json();
      updateKPICards();
      renderSalesTable();
    } catch (err) {
      console.error(err);
    }
  }

  // --- Event Listeners ---

  function setupEventListeners() {
    // Open Add Modal
    document.getElementById('btn-open-add-modal').addEventListener('click', () => {
      openAddModal();
    });

    // Open Sales History Modal
    document.getElementById('btn-sales-history').addEventListener('click', () => {
      openModal(modalSales);
    });

    // Search Input Event
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderTable();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderTable();
    });

    // Pill Filters
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderTable();
      });
    });

    // Close Modals via data-close attribute
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        closeModal(document.getElementById(modalId));
      });
    });

    // Backdrop click close
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // Save Medicine Form Submit
    formMedicine.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveMedicine();
    });

    // Sell Medicine Form Submit
    formSell.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSellMedicine();
    });

    // Live Total calculation for Sell Quantity
    document.getElementById('sell-quantity').addEventListener('input', (e) => {
      calculateSellTotal();
    });
  }

  // --- Rendering Functions ---

  function renderApp() {
    updateKPICards();
    renderTable();
  }

  function updateKPICards() {
    const totalCount = medicines.length;
    let lowStockCount = 0;
    let expiringCount = 0;

    medicines.forEach(m => {
      if (m.quantity < 10) lowStockCount++;
      const days = getDaysUntil(m.expiryDate);
      if (days < 30) expiringCount++;
    });

    const totalRev = sales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);

    kpiTotal.textContent = totalCount;
    kpiLowStock.textContent = lowStockCount;
    kpiExpiring.textContent = expiringCount;
    kpiRevenue.textContent = `$${totalRev.toFixed(2)}`;
    salesCount.textContent = sales.length;
  }

  function renderTable() {
    medicineTbody.innerHTML = '';

    // Filter Logic
    let filtered = medicines.filter(m => {
      // Search match
      const matchSearch = !searchQuery || 
        (m.fullName && m.fullName.toLowerCase().includes(searchQuery)) ||
        (m.brand && m.brand.toLowerCase().includes(searchQuery));

      if (!matchSearch) return false;

      // Status filter pill
      const days = getDaysUntil(m.expiryDate);
      if (activeFilter === 'expiring') return days < 30;
      if (activeFilter === 'low-stock') return m.quantity < 10;
      return true;
    });

    if (filtered.length === 0) {
      medicineTbody.style.display = 'none';
      emptyState.style.display = 'block';
      emptyMessage.textContent = searchQuery ? `No medicines matching "${searchQuery}"` : 'No inventory records available.';
      return;
    }

    medicineTbody.style.display = '';
    emptyState.style.display = 'none';

    filtered.forEach(m => {
      const daysToExpiry = getDaysUntil(m.expiryDate);
      const isExpiring = daysToExpiry < 30;
      const isLowStock = m.quantity < 10;

      // Classify Row based on requirements:
      // Red background for expiry < 30 days
      // Yellow background for stock quantity < 10
      let rowClass = '';
      if (isExpiring && isLowStock) {
        rowClass = 'row-combined';
      } else if (isExpiring) {
        rowClass = 'row-expiring';
      } else if (isLowStock) {
        rowClass = 'row-low-stock';
      }

      // Status Tag
      let statusTag = '';
      if (isExpiring && isLowStock) {
        statusTag = `<span class="status-tag tag-red"><i class="fa-solid fa-triangle-exclamation"></i> Expiring & Low Stock</span>`;
      } else if (isExpiring) {
        statusTag = `<span class="status-tag tag-red"><i class="fa-solid fa-clock"></i> Expiring (${daysToExpiry < 0 ? 'Expired' : daysToExpiry + 'd'})</span>`;
      } else if (isLowStock) {
        statusTag = `<span class="status-tag tag-yellow"><i class="fa-solid fa-box"></i> Low Stock (${m.quantity})</span>`;
      } else {
        statusTag = `<span class="status-tag tag-green"><i class="fa-solid fa-circle-check"></i> Healthy Stock</span>`;
      }

      // Formatted Expiry Date
      const expDateStr = new Date(m.expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Price formatted to 2 decimal places per requirement
      const priceFormatted = `$${parseFloat(m.price).toFixed(2)}`;

      const tr = document.createElement('tr');
      if (rowClass) tr.className = rowClass;

      tr.innerHTML = `
        <td>
          <div style="font-weight: 600;">${escapeHtml(m.fullName)}</div>
        </td>
        <td>${escapeHtml(m.brand || '-')}</td>
        <td>${expDateStr}</td>
        <td><strong>${m.quantity}</strong> units</td>
        <td><strong style="color: #38bdf8;">${priceFormatted}</strong></td>
        <td>${statusTag}</td>
        <td class="text-right">
          <div class="table-actions">
            <button class="action-btn action-sell" title="Sell Medicine" onclick="openSellModal('${m.id}')">
              <i class="fa-solid fa-cash-register"></i>
            </button>
            <button class="action-btn" title="View Notes" onclick="openNotesModal('${m.id}')">
              <i class="fa-solid fa-file-lines"></i>
            </button>
            <button class="action-btn action-edit" title="Edit Medicine" onclick="openEditModal('${m.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-btn action-delete" title="Delete Medicine" onclick="confirmDelete('${m.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      medicineTbody.appendChild(tr);
    });
  }

  function renderSalesTable() {
    const tbody = document.getElementById('sales-tbody');
    const salesEmpty = document.getElementById('sales-empty');
    tbody.innerHTML = '';

    if (sales.length === 0) {
      salesEmpty.style.display = 'block';
      return;
    }
    salesEmpty.style.display = 'none';

    sales.forEach(s => {
      const dateStr = new Date(s.saleDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><strong>${escapeHtml(s.medicineName)}</strong></td>
        <td>${escapeHtml(s.brand || '-')}</td>
        <td>${s.quantitySold}</td>
        <td>$${parseFloat(s.unitPrice).toFixed(2)}</td>
        <td><strong style="color: #34d399;">$${parseFloat(s.totalPrice).toFixed(2)}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Handlers & Modal Trigger Helpers ---

  window.openAddModal = function() {
    document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-notes-medical"></i> Add New Medicine`;
    document.getElementById('med-id').value = '';
    formMedicine.reset();
    
    // Default expiry date 6 months in future
    const defaultExp = new Date();
    defaultExp.setMonth(defaultExp.getMonth() + 6);
    document.getElementById('med-expiry').value = defaultExp.toISOString().split('T')[0];

    openModal(modalAdd);
  };

  window.openEditModal = function(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;

    document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Medicine`;
    document.getElementById('med-id').value = med.id;
    document.getElementById('med-name').value = med.fullName;
    document.getElementById('med-brand').value = med.brand;
    document.getElementById('med-expiry').value = new Date(med.expiryDate).toISOString().split('T')[0];
    document.getElementById('med-quantity').value = med.quantity;
    document.getElementById('med-price').value = parseFloat(med.price).toFixed(2);
    document.getElementById('med-notes').value = med.notes || '';

    openModal(modalAdd);
  };

  async function handleSaveMedicine() {
    const id = document.getElementById('med-id').value;
    const fullName = document.getElementById('med-name').value.trim();
    const brand = document.getElementById('med-brand').value.trim();
    const expiryDate = document.getElementById('med-expiry').value;
    const quantity = parseInt(document.getElementById('med-quantity').value, 10);
    const price = parseFloat(document.getElementById('med-price').value);
    const notes = document.getElementById('med-notes').value.trim();

    if (!fullName || !brand || !expiryDate || isNaN(quantity) || isNaN(price)) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const payload = {
      fullName,
      brand,
      expiryDate: new Date(expiryDate).toISOString(),
      quantity,
      price: parseFloat(price.toFixed(2)),
      notes
    };

    try {
      let response;
      if (id) {
        // Edit existing
        response = await fetch(`/api/medicines/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        response = await fetch('/api/medicines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error saving medicine');
      }

      showToast(`Medicine ${id ? 'updated' : 'added'} successfully!`, 'success');
      closeModal(modalAdd);
      await fetchMedicines();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.openSellModal = function(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;

    if (med.quantity <= 0) {
      showToast('This medicine is currently out of stock!', 'error');
      return;
    }

    document.getElementById('sell-med-id').value = med.id;
    document.getElementById('sell-med-name').textContent = med.fullName;
    document.getElementById('sell-med-brand').textContent = med.brand;
    document.getElementById('sell-med-stock').textContent = med.quantity;
    document.getElementById('sell-unit-price').textContent = parseFloat(med.price).toFixed(2);
    
    const qtyInput = document.getElementById('sell-quantity');
    qtyInput.value = 1;
    qtyInput.max = med.quantity;
    document.getElementById('sell-qty-error').textContent = '';

    calculateSellTotal();
    openModal(modalSell);
  };

  function calculateSellTotal() {
    const medId = document.getElementById('sell-med-id').value;
    const med = medicines.find(m => m.id === medId);
    if (!med) return;

    const qtyInput = document.getElementById('sell-quantity');
    const errorSpan = document.getElementById('sell-qty-error');
    let qty = parseInt(qtyInput.value, 10);

    if (isNaN(qty) || qty < 1) {
      errorSpan.textContent = 'Quantity must be at least 1';
      document.getElementById('sell-total-price').textContent = '0.00';
      return;
    }

    if (qty > med.quantity) {
      errorSpan.textContent = `Exceeds available stock (${med.quantity})`;
    } else {
      errorSpan.textContent = '';
    }

    const total = parseFloat((qty * med.price).toFixed(2));
    document.getElementById('sell-total-price').textContent = isNaN(total) ? '0.00' : total.toFixed(2);
  }

  async function handleSellMedicine() {
    const medicineId = document.getElementById('sell-med-id').value;
    const quantity = parseInt(document.getElementById('sell-quantity').value, 10);

    const med = medicines.find(m => m.id === medicineId);
    if (!med || quantity <= 0 || quantity > med.quantity) {
      showToast('Invalid sale quantity', 'error');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicineId, quantity })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error processing sale');
      }

      const data = await response.json();
      showToast(`Sale recorded! Total: $${data.sale.totalPrice.toFixed(2)}`, 'success');
      closeModal(modalSell);
      await fetchMedicines();
      await fetchSales();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  window.openNotesModal = function(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;

    document.getElementById('notes-med-title').textContent = med.fullName;
    document.getElementById('notes-med-brand').textContent = `Brand: ${med.brand}`;
    document.getElementById('notes-text').textContent = med.notes && med.notes.trim() ? med.notes : 'No extra notes specified for this medicine.';
    openModal(modalNotes);
  };

  window.confirmDelete = async function(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;

    if (confirm(`Are you sure you want to delete "${med.fullName}"?`)) {
      try {
        const response = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        showToast('Medicine deleted successfully', 'success');
        await fetchMedicines();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  // --- Helper Functions ---

  function getDaysUntil(dateString) {
    if (!dateString) return 999;
    const exp = new Date(dateString);
    const today = new Date();
    exp.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = exp - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function openModal(modal) {
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[match];
    });
  }
});
