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
  resultsSection.classList.add('hidden')
  const value = search_Input.value;

  fetch(`https://backend-3ryi.onrender.com/search/${encodeURIComponent(value)}`)
    .then(response => response.json())
    .then(data => {
      latestData = data;
      resultsSection.classList.remove("hidden");
      applyAllFilters();
      loadingSection.classList.add("hidden");
    })
    .catch(error => {
      console.log(error);
      loadingSection.classList.add("hidden"); 
    });
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

searchBtn.addEventListener('click', handleSearch);
search_Input.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    handleSearch(e);
  }
});

fetch('https://backend-production-818d.up.railway.app/trending')
  .then(response => response.json())
  .then(data => trending(data))
  .catch(error => console.log(error));

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
  totalProducts.textContent = `${product_data.length}`;
  const uniqueStores = new Set();
  for (const product of product_data) {
    uniqueStores.add(product.store);
  }
  storesCount.textContent = `${uniqueStores.size}`;

  if (product_data.length > 0) {
    let price_range = [...product_data].sort((a, b) => a.price - b.price);
    priceRange.textContent = `${price_range[0]['price']} - ${price_range[price_range.length - 1]['price']}`;
  } else {
    priceRange.textContent = `-`;
  }

  insertProducts(product_data);
}

function insertProducts(product_data) {
  const productsHTML = product_data.map(product => `
    <div class="product-card" data-id="${product.id}">
      <div class="product-header">
        <h3 class="product-title">${product.title}</h3>
        <span class="store-badge">${product.store}</span>
      </div>
      <div class="product-price">${product.price.toLocaleString()} EGP</div>
      <div class="product-actions">
        <a href="${product.link}" target="_blank" class="btn btn-primary">View Product</a>
        <button class="btn btn-outline" onclick="navigator.clipboard.writeText('${product.link}')">Copy Link</button>
      </div>
    </div>
  `).join('');

  productGrid.innerHTML = productsHTML;
}
