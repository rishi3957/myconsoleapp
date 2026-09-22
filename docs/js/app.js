/**
 * Client ABC Pharmacy Single Page Application (SPA)
 * Dual-Mode: REST API (.NET Core / Node.js) with LocalStorage Fallback for GitHub Pages!
 */

document.addEventListener('DOMContentLoaded', () => {
  let medicines = [];
  let sales = [];
  let activeFilter = 'all';
  let searchQuery = '';
  let isLocalStorageMode = false;

  const MEDICINES_STORAGE_KEY = 'abc_pharmacy_medicines';
  const SALES_STORAGE_KEY = 'abc_pharmacy_sales';

  const medicineTbody = document.getElementById('medicine-tbody');
  const emptyState = document.getElementById('empty-state');
  const emptyMessage = document.getElementById('empty-message');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  
  const kpiTotal = document.getElementById('kpi-total');
  const kpiLowStock = document.getElementById('kpi-low-stock');
  const kpiExpiring = document.getElementById('kpi-expiring');
  const kpiRevenue = document.getElementById('kpi-revenue');
  const salesCount = document.getElementById('sales-count');

  const modalAdd = document.getElementById('modal-add-medicine');
  const modalSell = document.getElementById('modal-sell-medicine');
  const modalNotes = document.getElementById('modal-view-notes');
  const modalSales = document.getElementById('modal-sales-history');

  const formMedicine = document.getElementById('form-medicine');
  const formSell = document.getElementById('form-sell');

  initApp();

  async function initApp() {
    await fetchMedicines();
    await fetchSales();
    setupEventListeners();
  }

  async function fetchMedicines() {
    try {
      const response = await fetch('/api/medicines');
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('Static host');
      }
      medicines = await response.json();
      isLocalStorageMode = false;
      renderApp();
    } catch (err) {
      isLocalStorageMode = true;
      medicines = getLocalStorageMedicines();
      renderApp();
    }
  }

  async function fetchSales() {
    if (isLocalStorageMode) {
      sales = getLocalStorageSales();
      updateKPICards();
      renderSalesTable();
      return;
    }

    try {
      const response = await fetch('/api/sales');
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('Static host');
      }
      sales = await response.json();
      updateKPICards();
      renderSalesTable();
    } catch (err) {
      isLocalStorageMode = true;
      sales = getLocalStorageSales();
      updateKPICards();
      renderSalesTable();
    }
  }

  function getLocalStorageMedicines() {
    const data = localStorage.getItem(MEDICINES_STORAGE_KEY);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
    const seedMeds = [
      {
        id: "med-101",
        fullName: "Paracetamol Extra 500mg",
        notes: "Fast acting pain relief and fever reducer. Take after meals.",
        expiryDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        quantity: 45,
        price: 4.50,
        brand: "HealthPharma",
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: "med-102",
        fullName: "Amoxicillin Trihydrate 250mg",
        notes: "Broad spectrum antibiotic capsules. Complete full course as prescribed.",
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(),
        quantity: 8,
        price: 14.99,
        brand: "MedLife Biocare",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: "med-103",
        fullName: "Cetirizine Hydrochloride 10mg",
        notes: "Non-drowsy antihistamine for seasonal allergies and hay fever.",
        expiryDate: new Date(Date.now() + 12 * 86400000).toISOString(),
        quantity: 5,
        price: 6.25,
        brand: "SunCure Labs",
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
      },
      {
        id: "med-104",
        fullName: "Metformin HCl 500mg Prolonged Release",
        notes: "Oral anti-diabetic medication for managing Type 2 Diabetes.",
        expiryDate: new Date(Date.now() + 240 * 86400000).toISOString(),
        quantity: 120,
        price: 18.75,
        brand: "GlycaCare",
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: "med-105",
        fullName: "Ibuprofen 400mg Softgel Capsules",
        notes: "Anti-inflammatory painkiller for joint and muscular ache.",
        expiryDate: new Date(Date.now() + 22 * 86400000).toISOString(),
        quantity: 60,
        price: 8.99,
        brand: "HealthPharma",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: "med-106",
        fullName: "Omeprazole Gastro-Resistant 20mg",
        notes: "Proton pump inhibitor for heartburn and acid reflux relief.",
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        quantity: 4,
        price: 11.50,
        brand: "AstraMed",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(seedMeds));
    return seedMeds;
  }

  function getLocalStorageSales() {
    const data = localStorage.getItem(SALES_STORAGE_KEY);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
    const seedSales = [
      {
        id: "sale-501",
        medicineId: "med-101",
        medicineName: "Paracetamol Extra 500mg",
        brand: "HealthPharma",
        quantitySold: 5,
        unitPrice: 4.50,
        totalPrice: 22.50,
        saleDate: new Date(Date.now() - 3 * 3600000).toISOString()
      },
      {
        id: "sale-502",
        medicineId: "med-104",
        medicineName: "Metformin HCl 500mg Prolonged Release",
        brand: "GlycaCare",
        quantitySold: 2,
        unitPrice: 18.75,
        totalPrice: 37.50,
        saleDate: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(seedSales));
    return seedSales;
  }

  function saveLocalStorageMedicines(data) {
    localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(data));
  }

  function saveLocalStorageSales(data) {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(data));
  }

  function setupEventListeners() {
    document.getElementById('btn-open-add-modal').addEventListener('click', () => {
      openAddModal();
    });

    document.getElementById('btn-sales-history').addEventListener('click', () => {
      openModal(modalSales);
    });

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

    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderTable();
      });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        closeModal(document.getElementById(modalId));
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    formMedicine.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveMedicine();
    });

    formSell.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSellMedicine();
    });

    document.getElementById('sell-quantity').addEventListener('input', () => {
      calculateSellTotal();
    });
  }

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

    let filtered = medicines.filter(m => {
      const matchSearch = !searchQuery || 
        (m.fullName && m.fullName.toLowerCase().includes(searchQuery)) ||
        (m.brand && m.brand.toLowerCase().includes(searchQuery));

      if (!matchSearch) return false;

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

      let rowClass = '';
      if (isExpiring && isLowStock) {
        rowClass = 'row-combined';
      } else if (isExpiring) {
        rowClass = 'row-expiring';
      } else if (isLowStock) {
        rowClass = 'row-low-stock';
      }

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

      const expDateStr = new Date(m.expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

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

  window.openAddModal = function() {
    document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-notes-medical"></i> Add New Medicine`;
    document.getElementById('med-id').value = '';
    formMedicine.reset();
    
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
      id: id || 'med-' + Date.now(),
      fullName,
      brand,
      expiryDate: new Date(expiryDate).toISOString(),
      quantity,
      price: parseFloat(price.toFixed(2)),
      notes,
      createdAt: new Date().toISOString()
    };

    if (isLocalStorageMode) {
      if (id) {
        const idx = medicines.findIndex(m => m.id === id);
        if (idx !== -1) medicines[idx] = payload;
      } else {
        medicines.push(payload);
      }
      saveLocalStorageMedicines(medicines);
      showToast(`Medicine ${id ? 'updated' : 'added'} successfully!`, 'success');
      closeModal(modalAdd);
      renderApp();
      return;
    }

    try {
      let response;
      if (id) {
        response = await fetch(`/api/medicines/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
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

    if (isLocalStorageMode) {
      med.quantity -= quantity;
      const saleRecord = {
        id: 'sale-' + Date.now(),
        medicineId: med.id,
        medicineName: med.fullName,
        brand: med.brand,
        quantitySold: quantity,
        unitPrice: med.price,
        totalPrice: parseFloat((med.price * quantity).toFixed(2)),
        saleDate: new Date().toISOString()
      };
      sales.unshift(saleRecord);
      saveLocalStorageMedicines(medicines);
      saveLocalStorageSales(sales);

      showToast(`Sale recorded! Total: $${saleRecord.totalPrice.toFixed(2)}`, 'success');
      closeModal(modalSell);
      renderApp();
      renderSalesTable();
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
      if (isLocalStorageMode) {
        medicines = medicines.filter(m => m.id !== id);
        saveLocalStorageMedicines(medicines);
        showToast('Medicine deleted successfully', 'success');
        renderApp();
        return;
      }

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
