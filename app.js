const baseProducts = [
  { title: 'Красный клоунский нос', category: 'Носы', price: 490, rating: 4.9, tag: 'clown,nose' },
  { title: 'Премиум парик Радуга', category: 'Парики', price: 2190, rating: 4.7, tag: 'clown,wig' },
  { title: 'Гигантские башмаки Jumbo', category: 'Обувь', price: 3890, rating: 4.8, tag: 'clown,shoes' },
  { title: 'Галстук-бабочка XL', category: 'Галстуки', price: 890, rating: 4.6, tag: 'bow,tie,colorful' },
  { title: 'Набор для жонглирования PRO', category: 'Жонглирование', price: 2690, rating: 4.9, tag: 'juggling,clubs' },
  { title: 'Цветок-брызгалка', category: 'Реквизит', price: 990, rating: 4.5, tag: 'clown,prop' },
  { title: 'Набор грима FunnyFace', category: 'Грим', price: 1490, rating: 4.8, tag: 'face,paint,festival' },
  { title: 'Подтяжки Circus Style', category: 'Одежда', price: 1290, rating: 4.4, tag: 'circus,costume' },
  { title: 'Мини-шляпка Весёлый купол', category: 'Головные уборы', price: 1590, rating: 4.6, tag: 'clown,hat' },
  { title: 'Набор накладных ресниц Stage', category: 'Грим', price: 690, rating: 4.3, tag: 'theater,makeup' },
  { title: 'Мега-помпоны для костюма', category: 'Одежда', price: 790, rating: 4.5, tag: 'colorful,pom,pom' },
  { title: 'Кейс реквизита артиста', category: 'Реквизит', price: 4590, rating: 4.9, tag: 'circus,backstage' }
];

function buildCatalog(minCount = 120) {
  const products = [];
  for (let i = 0; i < minCount; i += 1) {
    const base = baseProducts[i % baseProducts.length];
    const variant = Math.floor(i / baseProducts.length) + 1;
    const lock = 1000 + i;
    products.push({
      id: i + 1,
      title: `${base.title} #${variant}`,
      category: base.category,
      price: base.price + (variant * 35),
      rating: Number(Math.max(4.0, base.rating - ((variant - 1) * 0.05)).toFixed(1)),
      image: `https://loremflickr.com/800/600/${base.tag}?lock=${lock}`
    });
  }
  return products;
}

const products = buildCatalog(120);

const state = {
  cart: JSON.parse(localStorage.getItem('cart') || '{}'),
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  search: '',
  category: 'all',
  sort: 'popular'
};

const el = {
  catalog: document.getElementById('catalog'),
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  sortSelect: document.getElementById('sortSelect'),
  cartCount: document.getElementById('cartCount'),
  favoritesCount: document.getElementById('favoritesCount'),
  cartItems: document.getElementById('cartItems'),
  favoritesItems: document.getElementById('favoritesItems'),
  cartTotal: document.getElementById('cartTotal'),
  cartDrawer: document.getElementById('cartDrawer'),
  favoritesDrawer: document.getElementById('favoritesDrawer'),
  checkoutModal: document.getElementById('checkoutModal'),
  checkoutForm: document.getElementById('checkoutForm'),
  toast: document.getElementById('toast')
};

function save() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  localStorage.setItem('favorites', JSON.stringify(state.favorites));
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.remove('hidden');
  setTimeout(() => el.toast.classList.add('hidden'), 3200);
}

function money(value) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function filteredProducts() {
  let list = [...products];
  if (state.search) list = list.filter((p) => p.title.toLowerCase().includes(state.search.toLowerCase()));
  if (state.category !== 'all') list = list.filter((p) => p.category === state.category);

  if (state.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  if (state.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  if (state.sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  if (state.sort === 'popular') list.sort((a, b) => b.rating - a.rating);
  return list;
}

function renderCatalog() {
  const list = filteredProducts();
  el.catalog.innerHTML = list.map((item) => `
    <article class="card">
      <img src="${item.image}" alt="${item.title}" loading="lazy" />
      <div class="card-body">
        <small>${item.category}</small>
        <strong>${item.title}</strong>
        <span>⭐ ${item.rating}</span>
        <span class="price">${money(item.price)}</span>
        <div class="card-actions">
          <button onclick="addToCart(${item.id})" class="primary">В корзину</button>
          <button onclick="toggleFavorite(${item.id})">${state.favorites.includes(item.id) ? '★' : '☆'}</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderCart() {
  const ids = Object.keys(state.cart).map(Number);
  const list = products.filter((p) => ids.includes(p.id));
  if (!list.length) {
    el.cartItems.innerHTML = '<p>Корзина пуста.</p>';
    el.cartTotal.textContent = money(0);
    return;
  }

  let total = 0;
  el.cartItems.innerHTML = list.map((item) => {
    const qty = state.cart[item.id];
    total += qty * item.price;
    return `
      <div class="drawer-item">
        <img src="${item.image}" alt="${item.title}" />
        <div>
          <strong>${item.title}</strong>
          <div>${money(item.price)}</div>
          <div class="qty">
            <button onclick="changeQty(${item.id}, -1)">-</button>
            <span>${qty}</span>
            <button onclick="changeQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button onclick="removeFromCart(${item.id})">Удалить</button>
      </div>
    `;
  }).join('');
  el.cartTotal.textContent = money(total);
}

function renderFavorites() {
  const list = products.filter((p) => state.favorites.includes(p.id));
  if (!list.length) {
    el.favoritesItems.innerHTML = '<p>Пока ничего не добавлено.</p>';
    return;
  }

  el.favoritesItems.innerHTML = list.map((item) => `
    <div class="drawer-item">
      <img src="${item.image}" alt="${item.title}" />
      <div>
        <strong>${item.title}</strong>
        <div>${money(item.price)}</div>
      </div>
      <button onclick="toggleFavorite(${item.id})">Удалить</button>
    </div>
  `).join('');
}

function updateCounters() {
  const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
  el.cartCount.textContent = totalQty;
  el.favoritesCount.textContent = state.favorites.length;
}

window.addToCart = function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  save();
  updateCounters();
  renderCart();
  toast('Товар добавлен в корзину');
};

window.changeQty = function changeQty(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = next;
  save();
  updateCounters();
  renderCart();
};

window.removeFromCart = function removeFromCart(id) {
  delete state.cart[id];
  save();
  updateCounters();
  renderCart();
};

window.toggleFavorite = function toggleFavorite(id) {
  if (state.favorites.includes(id)) state.favorites = state.favorites.filter((x) => x !== id);
  else state.favorites.push(id);
  save();
  updateCounters();
  renderCatalog();
  renderFavorites();
};

function initFilters() {
  const categories = ['all', ...new Set(products.map((p) => p.category))];
  el.categoryFilter.innerHTML = categories.map((c) => `<option value="${c}">${c === 'all' ? 'Все категории' : c}</option>`).join('');

  el.searchInput.addEventListener('input', (e) => { state.search = e.target.value; renderCatalog(); });
  el.categoryFilter.addEventListener('change', (e) => { state.category = e.target.value; renderCatalog(); });
  el.sortSelect.addEventListener('change', (e) => { state.sort = e.target.value; renderCatalog(); });
}

document.getElementById('cartBtn').addEventListener('click', () => el.cartDrawer.classList.remove('hidden'));
document.getElementById('favoritesBtn').addEventListener('click', () => el.favoritesDrawer.classList.remove('hidden'));
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => {
  document.getElementById(btn.dataset.close).classList.add('hidden');
}));

document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!Object.keys(state.cart).length) {
    toast('Добавьте товары в корзину перед оформлением.');
    return;
  }
  el.checkoutModal.showModal();
});

document.getElementById('cancelCheckout').addEventListener('click', () => el.checkoutModal.close());

el.checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(el.checkoutForm);
  const required = ['name', 'email', 'phone', 'city', 'address', 'card', 'exp', 'cvv'];
  const missing = required.some((k) => !String(fd.get(k) || '').trim());
  if (missing) {
    toast('Заполните все обязательные поля.');
    return;
  }

  el.checkoutModal.close();
  toast('Сейчас на сайте проводятся технические работы. Попробуйте оформить заказ позднее.');
});

initFilters();
updateCounters();
renderCatalog();
renderCart();
renderFavorites();
