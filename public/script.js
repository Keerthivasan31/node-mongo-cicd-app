async function fetchItems() {
  try {
    const res = await fetch('/items');
    const items = await res.json();
    const list = document.getElementById('itemList');
    list.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error fetching items:", err);
  }
}

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

// Fetch items on initial load
fetchItems();
