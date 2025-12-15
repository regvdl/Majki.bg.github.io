document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('site-search');
  const searchResults = document.getElementById('search-results');
  let searchIndex = [];
  let selectedIndex = -1;

  if (!searchInput || !searchResults) return;

  // Fetch the search index
  fetch('/search-index.json')
    .then(response => response.json())
    .then(data => {
      searchIndex = data;
    })
    .catch(error => console.error('Error loading search index:', error));

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    selectedIndex = -1;
    searchResults.innerHTML = '';

    if (query.length < 2) {
      searchResults.classList.remove('active');
      searchResults.style.display = 'none';
      return;
    }

    const results = searchIndex.filter(item => {
      const titleMatch = item.title && item.title.toLowerCase().includes(query);
      const descMatch = item.description && item.description.toLowerCase().includes(query);
      return titleMatch || descMatch;
    }).slice(0, 10); // Limit to 10 results

    if (results.length > 0) {
      searchResults.style.display = 'block';
      searchResults.classList.add('active');
      
      results.forEach((result, idx) => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.setAttribute('data-idx', idx);
        div.onclick = () => window.location.href = result.url;
        
        div.innerHTML = `
          <div class="search-result-title">${result.title}</div>
          <div class="search-result-desc">${result.description || ''}</div>
        `;
        
        searchResults.appendChild(div);
      });
    } else {
      searchResults.style.display = 'block';
      searchResults.classList.add('active');
      searchResults.innerHTML = `<div class="search-no-results">Няма намерени резултати за "${query}"</div>`;
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const items = searchResults.querySelectorAll('.search-result-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      searchResults.classList.remove('active');
      searchResults.style.display = 'none';
      searchInput.blur();
      selectedIndex = -1;
    }
  });

  function updateSelection(items) {
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.classList.add('selected');
        item.style.background = 'rgba(99,102,241,0.1)';
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
        item.style.background = '';
      }
    });
  }

  // Hide results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove('active');
      searchResults.style.display = 'none';
    }
  });
});