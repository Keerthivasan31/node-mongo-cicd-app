// Fetch system/MongoDB status from existing /health endpoint
async function checkHealth() {
  const badge = document.getElementById('statusBadge');
  const text = document.getElementById('statusText');
  
  try {
    const res = await fetch('/health');
    const data = await res.json();
    
    if (res.ok && data.mongoConnected) {
      badge.classList.add('online');
      text.textContent = 'Cluster Connected';
    } else {
      badge.classList.remove('online');
      text.textContent = 'DB Offline';
    }
  } catch (err) {
    badge.classList.remove('online');
    text.textContent = 'Service Offline';
  }
}

// Fetch and render items from /items
async function fetchItems() {
  try {
    const res = await fetch('/items');
    const items = await res.json();
    const list = document.getElementById('itemList');
    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox" style="width: 48px; height: 48px; stroke-width: 1.5;"></i>
          <p>No focus items created yet.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'item-card';
      li.innerHTML = `
        <div class="item-content">
          <i data-lucide="check-circle-2" style="width: 18px; height: 18px; color: var(--primary);"></i>
          <span class="item-text">${escapeHtml(item.name)}</span>
        </div>
      `;
      list.appendChild(li);
    });

    lucide.createIcons();
  } catch (err) {
    console.error("Error fetching items:", err);
  }
}

// Add a new item to MongoDB
async function addItem() {
  const input = document.getElementById('itemName');
  const name = input.value.trim();
  if (!name) return;

  try {
    await fetch('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    input.value = '';
    fetchItems();
  } catch (err) {
    console.error("Error adding item:", err);
  }
}

// Helper: Sanitize string input
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Allow keypress 'Enter' to submit item
document.getElementById('itemName').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    addItem();
  }
});

// Initial boot logic
checkHealth();
fetchItems();
// Refresh health status every 10 seconds
setInterval(checkHealth, 10000);
