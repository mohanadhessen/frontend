const search_Input = document.getElementById('searchInput');
const trending_tags = document.querySelector('.trending-tags');
const totalProducts = document.getElementById('totalProducts');
const storesCount = document.getElementById('storesCount');
const priceRange = document.getElementById('priceRange');
const productGrid = document.getElementById('productGrid');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const loadingSection = document.getElementById('loadingSection');
const storeFilter = document.getElementById('storeFilter');
const sortFilter = document.getElementById('sortFilter');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const resetFiltersBtn = document.getElementById('resetFilters');

let latestData = [];

function handleSearch(e) {
  e.preventDefault?.(); 
  loadingSection.classList.remove("hidden");
  resultsSection.classList.add('hidden');
  
  // Update the loading message to reflect daily updates
  const loadingTitle = loadingSection.querySelector('h3');
  loadingTitle.textContent = 'Searching fresh daily data from Egyptian stores...';
  
  const loadingSubtext = loadingSection.querySelector('p');
  loadingSubtext.textContent = 'Accessing our automatically updated database';
  
  const value = search_Input.value;

  fetch(`https://backend-3ryi.onrender.com/search/${encodeURIComponent(value)}`)
    .then(response => response.json())
    .then(data => {
      latestData = data;
      resultsSection.classList.remove("hidden");
      applyAllFilters();
      loadingSection.classList.add("hidden");
      
      // Update the search query display
      document.getElementById('searchQuery').textContent = `Results for "${value}"`;
    })
    .catch(error => {
      console.log(error);
      loadingSection.classList.add("hidden");
      
      // Show error message with daily update context
      showError('Failed to fetch fresh data. Our daily scraper may be updating. Please try again in a moment.');
    });
}

function showError(message) {
  const errorSection = document.getElementById('errorSection');
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorSection.classList.remove('hidden');
  
  // Hide error after 5 seconds
  setTimeout(() => {
    errorSection.classList.add('hidden');
  }, 5000);
}

function applyAllFilters() {
  const selectedStore = storeFilter.value;
  const selectedSort = sortFilter.value;
  const minPrice = parseFloat(minPriceInput.value);
  const maxPrice = parseFloat(maxPriceInput.value);

  let filteredData = [...latestData];

  if (selectedStore !== 'all') {
    filteredData = filteredData.filter(product => product.store === selectedStore);
  }

  if (!isNaN(minPrice)) {
    filteredData = filteredData.filter(product => product.price >= minPrice);
  }

  if (!isNaN(maxPrice)) {
    filteredData = filteredData.filter(product => product.price <= maxPrice);
  }

  if (selectedSort === 'title') {
    filteredData.sort((a, b) => a.title.localeCompare(b.title));
  } else if (selectedSort === 'price-asc') {
    filteredData.sort((a, b) => a.price - b.price);
  } else if (selectedSort === 'price-desc') {
    filteredData.sort((a, b) => b.price - a.price);
  }

  product_data_inserting(filteredData);
}

// Event listeners for filters
storeFilter.addEventListener('change', applyAllFilters);
sortFilter.addEventListener('change', applyAllFilters);
minPriceInput.addEventListener('input', applyAllFilters);
maxPriceInput.addEventListener('input', applyAllFilters);

resetFiltersBtn.addEventListener('click', () => {
  storeFilter.value = 'all';
  sortFilter.value = 'title';
  minPriceInput.value = '';
  maxPriceInput.value = '';
  product_data_inserting(latestData);
});

// Search event listeners
searchBtn.addEventListener('click', handleSearch);
search_Input.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    handleSearch(e);
  }
});

// Load trending searches on page load
fetch('https://backend-3ryi.onrender.com/trending')
  .then(response => response.json())
  .then(data => trending(data))
  .catch(error => {
    console.log('Failed to load trending searches:', error);
    // Show a fallback message or hide trending section
    const trendingSection = document.querySelector('.trending-section');
    if (trendingSection && data === undefined) {
      trendingSection.style.display = 'none';
    }
  });

function trending(trendingData) {
  const maxItems = Math.min(10, trendingData.length); 
  
  for (let i = 0; i < maxItems; i++) {
    const trending_tag = document.createElement('span');
    trending_tag.className = 'trending-tag';
    trending_tag.textContent = trendingData[i].product_name;
    trending_tag.setAttribute('data-search', trendingData[i].product_name);
    trending_tags.append(trending_tag);

    trending_tag.addEventListener('click', () => {
      search_Input.value = trendingData[i].product_name;
      handleSearch(new Event('submit'));
    });
  }
}

function product_data_inserting(product_data) {
  // Update statistics
  totalProducts.textContent = `${product_data.length}`;
  
  const uniqueStores = new Set();
  for (const product of product_data) {
    uniqueStores.add(product.store);
  }
  storesCount.textContent = `${uniqueStores.size}`;

  if (product_data.length > 0) {
    let price_range = [...product_data].sort((a, b) => a.price - b.price);
    const minPrice = price_range[0]['price'];
    const maxPrice = price_range[price_range.length - 1]['price'];
    priceRange.textContent = `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`;
  } else {
    priceRange.textContent = `-`;
  }

  insertProducts(product_data);
}

function insertProducts(product_data) {
  if (product_data.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search terms or filters</p>
        <p><small>Our database is updated daily with fresh pricing data</small></p>
      </div>
    `;
    return;
  }

  const productsHTML = product_data.map(product => `
    <div class="product-card" data-id="${product.id}">
      <div class="product-header">
        <h3 class="product-title">${escapeHtml(product.title)}</h3>
        <span class="store-badge">${escapeHtml(product.store)}</span>
      </div>
      <div class="product-price">${product.price.toLocaleString()} EGP</div>
      <div class="product-actions">
        <a href="${escapeHtml(product.link)}" target="_blank" class="btn btn-primary" rel="noopener noreferrer">
          <i class="fas fa-external-link-alt"></i>
          View Product
        </a>
        <button class="btn btn-outline" onclick="copyProductLink('${escapeHtml(product.link)}')">
          <i class="fas fa-copy"></i>
          Copy Link
        </button>
      </div>
    </div>
  `).join('');

  productGrid.innerHTML = productsHTML;
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Function to copy product link to clipboard
async function copyProductLink(link) {
  try {
    await navigator.clipboard.writeText(link);
    showNotification('Link copied to clipboard!', 'success');
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
      showNotification('Failed to copy link', 'error');
    }
    document.body.removeChild(textArea);
  }
}

// Function to show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Add notification styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '500',
    zIndex: '1000',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
    backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
  });
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add some loading status animations for better UX
function animateLoadingStatus() {
  const statusItems = document.querySelectorAll('.status-item');
  let currentIndex = 0;
  
  const interval = setInterval(() => {
    // Reset all items
    statusItems.forEach(item => {
      item.classList.remove('active', 'completed');
    });
    
    // Mark current as active
    if (statusItems[currentIndex]) {
      statusItems[currentIndex].classList.add('active');
    }
    
    // Mark previous as completed
    for (let i = 0; i < currentIndex; i++) {
      if (statusItems[i]) {
        statusItems[i].classList.add('completed');
      }
    }
    
    currentIndex++;
    
    // Stop when all are processed or loading is hidden
    if (currentIndex > statusItems.length || loadingSection.classList.contains('hidden')) {
      clearInterval(interval);
      // Mark all as completed
      statusItems.forEach(item => {
        item.classList.remove('active');
        item.classList.add('completed');
      });
    }
  }, 800);
  
  return interval;
}

// Start loading animation when search begins
let loadingInterval;
searchBtn.addEventListener('click', () => {
  if (loadingInterval) clearInterval(loadingInterval);
  setTimeout(() => {
    if (!loadingSection.classList.contains('hidden')) {
      loadingInterval = animateLoadingStatus();
    }
  }, 500);
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Focus on search input when page loads
  search_Input.focus();
  
  // Add some initial interaction hints
  const searchInput = document.getElementById('searchInput');
  const originalPlaceholder = searchInput.placeholder;
  
  setTimeout(() => {
    if (!searchInput.value) {
      searchInput.placeholder = 'Try searching for "RTX 4070" or "iPhone 15"...';
      setTimeout(() => {
        searchInput.placeholder = originalPlaceholder;
      }, 3000);
    }
  }, 2000);
});