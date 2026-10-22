const rootPath = document.body.dataset.root || '';
const availableTools = [
  { name: 'Scientific Calculator', description: 'Perform advanced mathematical calculations with trigonometry, powers, and more.', category: 'Mathematics', icon: '∑', href: `${rootPath}calculator/`, available: true },
  { name: 'Percentage Calculator', description: 'Calculate percentages, increases, and decreases with ease.', category: 'Mathematics', icon: '%', href: `${rootPath}percentage/`, available: true },
  { name: 'Unit Converter', description: 'Convert common units of length, weight, and temperature.', category: 'Mathematics', icon: '↔', href: `${rootPath}converter/`, available: true },
  { name: 'Age Calculator', description: 'Calculate your age from a date of birth.', category: 'Mathematics', icon: '◷', href: `${rootPath}age/`, available: true },
  { name: 'Number System Converter', description: 'Convert Binary, Decimal, Octal and Hexadecimal numbers. Useful for DSA, Digital Logic and Computer Organization.', category: 'CSE', icon: '01', href: `${rootPath}number-system/`, available: true },
  { name: 'Logic Gate Simulator', description: 'Explore AND, OR, NOT, NAND, NOR, XOR, and XNOR gates with live circuits and truth tables.', category: 'CSE', icon: 'A∧B', href: `${rootPath}logic-gate/`, available: true },
  { name: 'Sorting Visualizer', description: 'Watch Bubble, Selection, Insertion, Merge, and Quick Sort run step by step.', category: 'DSA', icon: '↕', href: `${rootPath}sorting-visualizer/`, available: true },
  { name: 'Searching Visualizer', description: 'Explore Linear and Binary Search with live ranges, comparisons, and results.', category: 'DSA', icon: '⌕', href: `${rootPath}searching-visualizer/`, available: true },
  { name: 'Graph Visualizer', description: 'Build graphs and explore BFS, DFS, and Dijkstra step by step.', category: 'DSA', icon: '◉', href: `${rootPath}graph-visualizer/`, available: true }
];

const headerMount = document.getElementById('siteHeader');
const footerMount = document.getElementById('siteFooter');
const pageRoot = rootPath || './';

// Keep the selected toolbox category available when a tool is opened.
const toolBackLink = document.querySelector('.tool-page .back-link');
if (toolBackLink) {
  try {
    const savedReturn = JSON.parse(sessionStorage.getItem('calclab-tool-return') || 'null');
    if (savedReturn && Date.now() - savedReturn.savedAt < 60 * 60 * 1000 && savedReturn.category && savedReturn.category !== 'All Tools') {
      const returnUrl = new URL(pageRoot, window.location.href);
      returnUrl.searchParams.set('category', savedReturn.category);
      returnUrl.hash = 'tools';
      toolBackLink.href = returnUrl.href;
      toolBackLink.innerHTML = `<span aria-hidden="true">←</span> Back to ${savedReturn.category} tools`;
    }
    toolBackLink.addEventListener('click', () => sessionStorage.removeItem('calclab-tool-return'));
  } catch {
    // Keep the regular home link if storage is unavailable.
  }
}

if (headerMount) {
  headerMount.innerHTML = `
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="${pageRoot}" aria-label="CalcLab home">
          <span class="brand-mark" aria-hidden="true">∑</span>
          <span>Calc<span class="brand-accent">Lab</span></span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="primaryNav">
          <span></span><span></span><span></span>
        </button>
        <nav class="primary-nav" id="primaryNav" aria-label="Main navigation">
          <a href="${pageRoot}">Home</a>
          <a href="${pageRoot}#tools">All Tools</a>
          <a href="${pageRoot}#about">About</a>
          <a href="${pageRoot}contact.html">Contact</a>
        </nav>
        <form class="nav-search" action="${pageRoot}" role="search">
          <label class="visually-hidden" for="toolSearch">Search tools</label>
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input id="toolSearch" name="q" type="search" placeholder="Search tools" autocomplete="off" />
          <kbd>/</kbd>
        </form>
      </div>
    </header>`;
}

if (footerMount) {
  footerMount.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-about">
          <a class="brand" href="${pageRoot}" aria-label="CalcLab home">
            <span class="brand-mark" aria-hidden="true">∑</span>
            <span>Calc<span class="brand-accent">Lab</span></span>
          </a>
          <p>Free, practical tools for everyday tasks. One useful tool at a time.</p>
        </div>
        <nav class="footer-links" aria-label="Footer navigation">
          <a href="${pageRoot}">Home</a>
          <a href="${pageRoot}#tools">All Tools</a>
          <a href="${pageRoot}privacy.html">Privacy Policy</a>
          <a href="${pageRoot}contact.html">Contact</a>
        </nav>
        <p class="copyright">© 2026 Faysal Mahamud Himel. All rights reserved.</p>
      </div>
    </footer>`;
}

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    primaryNav.classList.toggle('is-open', !isOpen);
  });

  primaryNav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
      primaryNav.classList.remove('is-open');
    }
  });
}

const toolGrid = document.getElementById('toolGrid');
const categoryList = document.getElementById('categoryList');

if (toolGrid && categoryList) {
  const searchInput = document.getElementById('toolSearch');
  const emptyState = document.getElementById('emptyState');
  const toolCount = document.getElementById('toolCount');
  const resetFilters = document.getElementById('resetFilters');
  const categories = ['All Tools', ...new Set(availableTools.map((tool) => tool.category))];
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q') || '';
  const requestedCategory = searchParams.get('category');
  let activeCategory = categories.includes(requestedCategory) ? requestedCategory : 'All Tools';

  searchInput.value = query;
  categoryList.innerHTML = categories.map((category) => `
    <button class="category-button${category === activeCategory ? ' is-active' : ''}" type="button" data-category="${category}" aria-pressed="${category === activeCategory}">
      ${category}
    </button>`).join('');

  function renderTools() {
    const normalizedQuery = searchInput.value.trim().toLocaleLowerCase();
    const matches = availableTools.filter((tool) => {
      const matchesCategory = activeCategory === 'All Tools' || tool.category === activeCategory;
      const searchableWords = `${tool.name} ${tool.description}`.toLocaleLowerCase().split(/[^a-z0-9]+/);
      const matchesQuery = normalizedQuery.split(/\s+/).every((term) => searchableWords.some((word) => word.startsWith(term)));
      return matchesCategory && matchesQuery;
    });

    toolGrid.innerHTML = matches.map((tool) => {
      const tag = tool.available ? 'a' : 'article';
      const href = tool.available ? ` href="${tool.href}"` : '';
      const status = tool.available
        ? '<span class="tool-status is-available"><span class="status-dot"></span> AVAILABLE</span>'
        : '<span class="tool-status">COMING SOON</span>';
      return `
        <${tag} class="tool-card${tool.available ? ' is-available' : ' is-coming'}"${href}>
          <div class="tool-card-top">
            <span class="tool-icon" aria-hidden="true">${tool.icon}</span>
            ${status}
          </div>
          <span class="tool-category">${tool.category}</span>
          <h3>${tool.name}</h3>
          <p>${tool.description}</p>
          <span class="tool-action">${tool.available ? 'Open Tool' : 'Coming Soon'} <span aria-hidden="true">${tool.available ? '→' : '· · ·'}</span></span>
        </${tag}>`;
    }).join('');
    toolCount.textContent = `${matches.length} of ${availableTools.length} tools`;
    emptyState.hidden = matches.length > 0;
    toolGrid.hidden = matches.length === 0;
  }

  categoryList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    categoryList.querySelectorAll('.category-button').forEach((categoryButton) => {
      const isActive = categoryButton === button;
      categoryButton.classList.toggle('is-active', isActive);
      categoryButton.setAttribute('aria-pressed', String(isActive));
    });
    renderTools();
  });

  toolGrid.addEventListener('click', (event) => {
    const toolLink = event.target.closest('a.tool-card');
    if (!toolLink) return;
    try {
      sessionStorage.setItem('calclab-tool-return', JSON.stringify({ category: activeCategory, savedAt: Date.now() }));
    } catch {
      // Direct tool navigation still has its normal home link when storage is unavailable.
    }
  });

  searchInput.addEventListener('input', renderTools);
  searchInput.closest('form').addEventListener('submit', (event) => {
    event.preventDefault();
    document.getElementById('tools').scrollIntoView({ behavior: 'smooth' });
  });
  resetFilters.addEventListener('click', () => {
    searchInput.value = '';
    activeCategory = 'All Tools';
    categoryList.querySelectorAll('.category-button').forEach((button) => {
      const isActive = button.dataset.category === activeCategory;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    renderTools();
    searchInput.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  renderTools();
}
