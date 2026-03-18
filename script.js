let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

function saveInventory() {
  localStorage.setItem('inventory', JSON.stringify(inventory));
}

// ─── Section Navigation ───────────────────────────────────────────
function showSection(section) {
  document.getElementById('inventorySection').style.display = section === 'inventory' ? 'block' : 'none';
  document.getElementById('addSection').style.display = section === 'add' ? 'block' : 'none';
  document.getElementById('summarySection').style.display = section === 'summary' ? 'block' : 'none';

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navMap = { inventory: 0, add: 1, summary: 2 };
  document.querySelectorAll('.nav-item')[navMap[section]].classList.add('active');

  const titles = {
    inventory: ['Inventory', 'Manage your stock in real-time'],
    add: ['Add Item', 'Register a new inventory item'],
    summary: ['Summary', 'Overview of your inventory']
  };
  document.getElementById('pageTitle').textContent = titles[section][0];
  document.getElementById('pageSub').textContent = titles[section][1];

  if (section === 'summary') renderSummary();
}

// ─── Add Item ─────────────────────────────────────────────────────
document.getElementById('addItemForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const f = new FormData(this);
  inventory.push({
    itemID: f.get('itemID'),
    itemName: f.get('itemName'),
    category: f.get('category'),
    quantity: parseInt(f.get('quantity')),
    price: parseFloat(f.get('price')),
    supplier: f.get('supplier')
  });
  saveInventory();
  this.reset();
  updateSidebar();
  updateCategoryFilter();
  renderTable(inventory);
  showSection('inventory');
});

// ─── Delete Item ──────────────────────────────────────────────────
function deleteItem(index) {
  if (confirm('Delete this item?')) {
    inventory.splice(index, 1);
    saveInventory();
    updateSidebar();
    updateCategoryFilter();
    filterItems();
  }
}

// ─── Edit Item ────────────────────────────────────────────────────
function openEdit(index) {
  const item = inventory[index];
  document.getElementById('editIndex').value = index;
  document.getElementById('editItemID').value = item.itemID;
  document.getElementById('editItemName').value = item.itemName;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editQuantity').value = item.quantity;
  document.getElementById('editPrice').value = item.price;
  document.getElementById('editSupplier').value = item.supplier;
  document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const index = parseInt(document.getElementById('editIndex').value);
  inventory[index] = {
    itemID: document.getElementById('editItemID').value,
    itemName: document.getElementById('editItemName').value,
    category: document.getElementById('editCategory').value,
    quantity: parseInt(document.getElementById('editQuantity').value),
    price: parseFloat(document.getElementById('editPrice').value),
    supplier: document.getElementById('editSupplier').value
  };
  saveInventory();
  closeModal();
  updateSidebar();
  updateCategoryFilter();
  filterItems();
});

// Close modal on overlay click
document.getElementById('editModal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// ─── Render Table ─────────────────────────────────────────────────
function renderTable(items) {
  const tbody = document.getElementById('inventoryTableBody');
  const emptyMsg = document.getElementById('emptyMsg');
  const itemCount = document.getElementById('itemCount');

  tbody.innerHTML = '';
  itemCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  items.forEach((item) => {
    const realIndex = inventory.indexOf(item);
    const total = (item.quantity * item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const price = item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 });

    let statusClass, statusLabel;
    if (item.quantity === 0) { statusClass = 'out-of-stock'; statusLabel = 'Out of Stock'; }
    else if (item.quantity < 10) { statusClass = 'low-stock'; statusLabel = 'Low Stock'; }
    else { statusClass = 'in-stock'; statusLabel = 'In Stock'; }

    tbody.innerHTML += `
      <tr>
        <td><span style="font-family:'Space Mono',monospace;font-size:12px;color:var(--text-muted)">${item.itemID}</span></td>
        <td><strong>${item.itemName}</strong></td>
        <td>${item.category}</td>
        <td><span style="font-family:'Space Mono',monospace">${item.quantity}</span></td>
        <td><span style="font-family:'Space Mono',monospace">₱${price}</span></td>
        <td><span style="font-family:'Space Mono',monospace">₱${total}</span></td>
        <td style="color:var(--text-muted)">${item.supplier}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="openEdit(${realIndex})">Edit</button>
            <button class="btn-delete" onclick="deleteItem(${realIndex})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
}

// ─── Filter & Search ──────────────────────────────────────────────
function filterItems() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const stock = document.getElementById('stockFilter').value;

  let filtered = inventory.filter(item => {
    const matchSearch =
      item.itemID.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search);

    const matchCategory = !category || item.category === category;

    const matchStock =
      !stock ||
      (stock === 'low' && item.quantity > 0 && item.quantity < 10) ||
      (stock === 'ok' && item.quantity >= 10);

    return matchSearch && matchCategory && matchStock;
  });

  renderTable(filtered);
}

// ─── Category Filter ──────────────────────────────────────────────
function updateCategoryFilter() {
  const select = document.getElementById('categoryFilter');
  const current = select.value;
  const categories = [...new Set(inventory.map(i => i.category))].sort();

  select.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    if (c === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// ─── Sidebar Stats ────────────────────────────────────────────────
function updateSidebar() {
  document.getElementById('totalItemsCount').textContent = inventory.length;
  const low = inventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
  const out = inventory.filter(i => i.quantity === 0).length;
  document.getElementById('lowStockCount').textContent = low + out;
}

// ─── Summary ──────────────────────────────────────────────────────
function renderSummary() {
  const totalItems = inventory.length;
  const totalQty = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
  const outOfStock = inventory.filter(i => i.quantity === 0).length;
  const categories = new Set(inventory.map(i => i.category)).size;

  const grid = document.getElementById('summaryGrid');
  grid.innerHTML = `
    <div class="summary-card">
      <h3>Total Items</h3>
      <div class="val">${totalItems}</div>
    </div>
    <div class="summary-card">
      <h3>Total Quantity</h3>
      <div class="val">${totalQty.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <h3>Total Inventory Value</h3>
      <div class="val">₱${totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-card">
      <h3>Categories</h3>
      <div class="val">${categories}</div>
    </div>
    <div class="summary-card">
      <h3>Low Stock Items</h3>
      <div class="val" style="color:var(--warn)">${lowStock}</div>
    </div>
    <div class="summary-card">
      <h3>Out of Stock</h3>
      <div class="val" style="color:var(--red)">${outOfStock}</div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────
updateSidebar();
updateCategoryFilter();
renderTable(inventory);
