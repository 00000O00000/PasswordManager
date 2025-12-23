let entries = [];
let categories = [];
let currentFilter = 'all';
let currentCategoryFilter = null;
let selectedEntry = null;

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    await loadCategories();
    await loadEntries();

    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('addEntryBtn').addEventListener('click', () => openEntryModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeEntryModal);
    document.getElementById('cancelBtn').addEventListener('click', closeEntryModal);
    document.getElementById('entryForm').addEventListener('submit', saveEntry);

    document.getElementById('toggleEntryPassword').addEventListener('click', togglePasswordVisibility);
    document.getElementById('generatePasswordBtn').addEventListener('click', openPasswordGenerator);

    document.getElementById('closeGeneratorBtn').addEventListener('click', closePasswordGenerator);
    document.getElementById('regenerateBtn').addEventListener('click', generatePassword);
    document.getElementById('usePasswordBtn').addEventListener('click', useGeneratedPassword);
    document.getElementById('copyGeneratedBtn').addEventListener('click', copyGeneratedPassword);

    document.getElementById('lengthSlider').addEventListener('input', function () {
        document.getElementById('lengthValue').textContent = this.value;
        generatePassword();
    });

    ['useUppercase', 'useLowercase', 'useDigits', 'useSymbols'].forEach(id => {
        document.getElementById(id).addEventListener('change', generatePassword);
    });

    document.getElementById('searchInput').addEventListener('input', handleSearch);

    document.getElementById('lockBtn').addEventListener('click', lockVault);

    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailPanel);

    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('closeCategoryModalBtn').addEventListener('click', closeCategoryModal);
    document.getElementById('cancelCategoryBtn').addEventListener('click', closeCategoryModal);
    document.getElementById('categoryForm').addEventListener('submit', saveCategory);

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    const categoryColor = document.getElementById('categoryColor');
    const categoryColorText = document.getElementById('categoryColorText');
    categoryColor.addEventListener('input', function () {
        categoryColorText.value = this.value;
    });
    categoryColorText.addEventListener('input', function () {
        if (/^#[0-9A-F]{6}$/i.test(this.value)) {
            categoryColor.value = this.value;
        }
    });

    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('categoryIcon').value = this.dataset.icon;
        });
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            currentCategoryFilter = null;
            renderEntries();
        });
    });

    const entryPassword = document.getElementById('entryPassword');
    entryPassword.addEventListener('input', function () {
        updatePasswordStrength(this.value);
    });

    window.addEventListener('click', function (e) {
        const entryModal = document.getElementById('entryModal');
        const generatorModal = document.getElementById('generatorModal');
        const categoryModal = document.getElementById('categoryModal');
        if (e.target === entryModal) {
            closeEntryModal();
        }
        if (e.target === generatorModal) {
            closePasswordGenerator();
        }
        if (e.target === categoryModal) {
            closeCategoryModal();
        }
    });

    // 移动端菜单控制
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn && sidebar) {
        // 点击汉堡菜单按钮切换侧边栏
        mobileMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // 点击页面其他地方关闭侧边栏
        document.addEventListener('click', function (e) {
            if (sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // 点击侧边栏内的导航项后自动关闭侧边栏（移动端）
        sidebar.querySelectorAll('.nav-item, .category-item').forEach(item => {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    loadTheme();
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        renderCategories();
    } catch (error) {
        showToast('加载分类失败', 'error');
    }
}

async function loadEntries() {
    try {
        const response = await fetch('/api/entries');
        entries = await response.json();
        renderEntries();
        updateCounts();
    } catch (error) {
        showToast('加载密码条目失败', 'error');
    }
}

function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const categorySelect = document.getElementById('entryCategory');

    categoriesList.innerHTML = '';
    categorySelect.innerHTML = '<option value="">无分类</option>';

    categories.forEach(cat => {
        const catItem = document.createElement('a');
        catItem.href = '#';
        catItem.className = 'category-item';
        catItem.dataset.categoryId = cat.id;
        catItem.innerHTML = `
            <div class="category-icon" style="background-color: ${cat.color}">
                ${getCategoryIcon(cat.icon)}
            </div>
            <span>${cat.name}</span>
            <span class="count">${cat.count}</span>
            <div class="category-item-actions">
                <button class="btn-icon edit-category-btn" title="编辑分类">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon delete-category-btn" title="删除分类">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
        catItem.addEventListener('click', function (e) {
            if (!e.target.closest('.category-item-actions')) {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                currentFilter = 'category';
                currentCategoryFilter = parseInt(this.dataset.categoryId);
                renderEntries();
            }
        });

        const editBtn = catItem.querySelector('.edit-category-btn');
        editBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            editCategory(parseInt(catItem.dataset.categoryId));
        });

        const deleteBtn = catItem.querySelector('.delete-category-btn');
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteCategory(parseInt(catItem.dataset.categoryId));
        });

        categoriesList.appendChild(catItem);

        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}

function renderEntries() {
    const grid = document.getElementById('entriesGrid');

    let filteredEntries = entries;

    if (currentFilter === 'favorites') {
        filteredEntries = entries.filter(e => e.is_favorite);
    } else if (currentFilter === 'category' && currentCategoryFilter) {
        filteredEntries = entries.filter(e => e.category_id === currentCategoryFilter);
    }

    if (filteredEntries.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1;" class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <p>暂无密码条目</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredEntries.map(entry => createEntryCard(entry)).join('');

    document.querySelectorAll('.entry-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (!e.target.closest('.entry-actions')) {
                const entryId = parseInt(this.dataset.entryId);
                selectEntry(entryId);
            }
        });
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const entryId = parseInt(this.closest('.entry-card').dataset.entryId);
            const entry = entries.find(e => e.id === entryId);
            copyToClipboard(entry.password);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const entryId = parseInt(this.closest('.entry-card').dataset.entryId);
            editEntry(entryId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const entryId = parseInt(this.closest('.entry-card').dataset.entryId);
            deleteEntry(entryId);
        });
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const entryId = parseInt(this.closest('.entry-card').dataset.entryId);
            toggleFavorite(entryId);
        });
    });
}

function createEntryCard(entry) {
    const category = categories.find(c => c.id === entry.category_id);
    const initial = entry.title.charAt(0).toUpperCase();

    return `
        <div class="entry-card ${selectedEntry?.id === entry.id ? 'selected' : ''}" data-entry-id="${entry.id}">
            <div class="entry-header">
                <div class="entry-icon">${initial}</div>
                <div class="entry-actions">
                    <button class="btn-icon copy-btn" title="复制密码">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="btn-icon edit-btn" title="编辑">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon delete-btn" title="删除">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="entry-body">
                <h3>${escapeHtml(entry.title)}</h3>
                ${entry.username ? `<p>${escapeHtml(entry.username)}</p>` : ''}
                ${entry.url ? `<p style="opacity: 0.7">${escapeHtml(truncate(entry.url, 30))}</p>` : ''}
            </div>
            <div class="entry-footer">
                ${category ? `
                    <span class="entry-category" style="background-color: ${category.color}20; color: ${category.color}">
                        ${category.name}
                    </span>
                ` : '<span></span>'}
                <button class="btn-icon favorite-btn ${entry.is_favorite ? 'active' : ''}" title="${entry.is_favorite ? '取消收藏' : '添加到收藏夹'}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${entry.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function selectEntry(entryId) {
    selectedEntry = entries.find(e => e.id === entryId);
    renderEntries();
    showDetailPanel();
}

function showDetailPanel() {
    const detailPanel = document.getElementById('detailPanel');
    const detailContent = document.getElementById('detailContent');

    if (!selectedEntry) {
        detailContent.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
                </svg>
                <p>选择一个密码条目查看详情</p>
            </div>
        `;
        return;
    }

    const category = categories.find(c => c.id === selectedEntry.category_id);

    detailContent.innerHTML = `
        <div class="detail-field">
            <div class="detail-label">标题</div>
            <div class="detail-value">${escapeHtml(selectedEntry.title)}</div>
        </div>
        
        ${selectedEntry.username ? `
            <div class="detail-field">
                <div class="detail-label">用户名</div>
                <div class="password-field">
                    <div class="password-value">${escapeHtml(selectedEntry.username)}</div>
                    <button class="btn-icon" onclick="copyToClipboard('${escapeHtml(selectedEntry.username)}')" title="复制">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
            </div>
        ` : ''}
        
        <div class="detail-field">
            <div class="detail-label">密码</div>
            <div class="password-field">
                <div class="password-value" id="detailPassword">••••••••••••</div>
                <button class="btn-icon" onclick="toggleDetailPassword()" title="显示">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
                <button class="btn-icon" onclick="copyToClipboard('${escapeHtml(selectedEntry.password)}')" title="复制">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </button>
            </div>
        </div>
        
        ${selectedEntry.url ? `
            <div class="detail-field">
                <div class="detail-label">网址</div>
                <div class="detail-value">
                    <a href="${escapeHtml(selectedEntry.url)}" target="_blank" style="color: var(--color-primary); text-decoration: none;">
                        ${escapeHtml(selectedEntry.url)}
                    </a>
                </div>
            </div>
        ` : ''}
        
        ${category ? `
            <div class="detail-field">
                <div class="detail-label">分类</div>
                <div class="detail-value">
                    <span class="entry-category" style="background-color: ${category.color}20; color: ${category.color}">
                        ${category.name}
                    </span>
                </div>
            </div>
        ` : ''}
        
        ${selectedEntry.notes ? `
            <div class="detail-field">
                <div class="detail-label">备注</div>
                <div class="detail-value" style="white-space: pre-wrap;">${escapeHtml(selectedEntry.notes)}</div>
            </div>
        ` : ''}
        
        <div class="detail-field">
            <div class="detail-label">创建时间</div>
            <div class="detail-value">${formatDate(selectedEntry.created_at)}</div>
        </div>
        
        <div class="detail-field">
            <div class="detail-label">更新时间</div>
            <div class="detail-value">${formatDate(selectedEntry.updated_at)}</div>
        </div>
        
        <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
            <button class="btn btn-primary" onclick="editEntry(${selectedEntry.id})" style="flex: 1;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>编辑</span>
            </button>
            <button class="btn btn-danger" onclick="deleteEntry(${selectedEntry.id})">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `;
}

function closeDetailPanel() {
    selectedEntry = null;
    renderEntries();
    showDetailPanel();
}

let detailPasswordVisible = false;
function toggleDetailPassword() {
    const passwordEl = document.getElementById('detailPassword');
    detailPasswordVisible = !detailPasswordVisible;
    passwordEl.textContent = detailPasswordVisible ? selectedEntry.password : '••••••••••••';
}

function openEntryModal(entry = null) {
    const modal = document.getElementById('entryModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('entryForm');

    if (entry) {
        modalTitle.textContent = '编辑密码';
        document.getElementById('entryId').value = entry.id;
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryUsername').value = entry.username || '';
        document.getElementById('entryPassword').value = entry.password;
        document.getElementById('entryUrl').value = entry.url || '';
        document.getElementById('entryCategory').value = entry.category_id || '';
        document.getElementById('entryNotes').value = entry.notes || '';
        updatePasswordStrength(entry.password);
    } else {
        modalTitle.textContent = '添加密码';
        form.reset();
        document.getElementById('entryId').value = '';
    }

    modal.classList.add('active');
}

function closeEntryModal() {
    const modal = document.getElementById('entryModal');
    modal.classList.remove('active');
}

function editEntry(entryId) {
    const entry = entries.find(e => e.id === entryId);
    openEntryModal(entry);
}

async function saveEntry(e) {
    e.preventDefault();

    const entryId = document.getElementById('entryId').value;
    const data = {
        title: document.getElementById('entryTitle').value,
        username: document.getElementById('entryUsername').value,
        password: document.getElementById('entryPassword').value,
        url: document.getElementById('entryUrl').value,
        category_id: document.getElementById('entryCategory').value || null,
        notes: document.getElementById('entryNotes').value,
        is_favorite: false
    };

    try {
        const url = entryId ? `/api/entries/${entryId}` : '/api/entries';
        const method = entryId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadEntries();
            await loadCategories();
            closeEntryModal();
            showToast(entryId ? '密码已更新' : '密码已添加', 'success');
        } else {
            showToast('保存失败', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function deleteEntry(entryId) {
    if (!confirm('确定要删除这个密码条目吗？')) {
        return;
    }

    try {
        const response = await fetch(`/api/entries/${entryId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            if (selectedEntry?.id === entryId) {
                selectedEntry = null;
            }
            await loadEntries();
            await loadCategories();
            showDetailPanel();
            showToast('密码已删除', 'success');
        } else {
            showToast('删除失败', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function toggleFavorite(entryId) {
    const entry = entries.find(e => e.id === entryId);

    try {
        const response = await fetch(`/api/entries/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                is_favorite: !entry.is_favorite
            })
        });

        if (response.ok) {
            await loadEntries();
            if (selectedEntry?.id === entryId) {
                selectedEntry = entries.find(e => e.id === entryId);
                showDetailPanel();
            }
        }
    } catch (error) {
        showToast('操作失败', 'error');
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('entryPassword');
    const btn = document.getElementById('toggleEntryPassword');

    if (input.type === 'password') {
        input.type = 'text';
        btn.classList.add('active');
    } else {
        input.type = 'password';
        btn.classList.remove('active');
    }
}

function openPasswordGenerator() {
    const modal = document.getElementById('generatorModal');
    modal.classList.add('active');
    generatePassword();
}

function closePasswordGenerator() {
    const modal = document.getElementById('generatorModal');
    modal.classList.remove('active');
}

async function generatePassword() {
    const length = parseInt(document.getElementById('lengthSlider').value);
    const useUppercase = document.getElementById('useUppercase').checked;
    const useLowercase = document.getElementById('useLowercase').checked;
    const useDigits = document.getElementById('useDigits').checked;
    const useSymbols = document.getElementById('useSymbols').checked;

    try {
        const response = await fetch('/api/generate-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                length,
                use_uppercase: useUppercase,
                use_lowercase: useLowercase,
                use_digits: useDigits,
                use_symbols: useSymbols
            })
        });

        const data = await response.json();
        document.getElementById('generatedPassword').value = data.password;
    } catch (error) {
        showToast('生成密码失败', 'error');
    }
}

function useGeneratedPassword() {
    const password = document.getElementById('generatedPassword').value;
    document.getElementById('entryPassword').value = password;
    updatePasswordStrength(password);
    closePasswordGenerator();
}

function copyGeneratedPassword() {
    const password = document.getElementById('generatedPassword').value;
    copyToClipboard(password);
}

function updatePasswordStrength(password) {
    const strengthBars = document.querySelectorAll('#entryForm .strength-bar');
    const strength = calculatePasswordStrength(password);

    strengthBars.forEach((bar, index) => {
        bar.classList.remove('active', 'weak', 'medium', 'strong');
        if (index < strength) {
            bar.classList.add('active');
            if (strength <= 2) bar.classList.add('weak');
            else if (strength <= 3) bar.classList.add('medium');
            else bar.classList.add('strong');
        }
    });
}

function calculatePasswordStrength(password) {
    if (!password) return 0;

    let score = 0;
    const length = password.length;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    return Math.min(Math.floor(score / 1.4), 5);
}

async function handleSearch(e) {
    const query = e.target.value.trim();

    if (query.length === 0) {
        await loadEntries();
        return;
    }

    if (query.length < 2) {
        return;
    }

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        entries = await response.json();
        currentFilter = 'all';
        currentCategoryFilter = null;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        renderEntries();
    } catch (error) {
        showToast('搜索失败', 'error');
    }
}

async function lockVault() {
    try {
        const response = await fetch('/api/lock', {
            method: 'POST'
        });

        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        showToast('锁定失败', 'error');
    }
}

function updateCounts() {
    const allCount = entries.length;
    const favCount = entries.filter(e => e.is_favorite).length;

    document.getElementById('allCount').textContent = allCount;
    document.getElementById('favCount').textContent = favCount;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            ${type === 'success' ?
            '<polyline points="20 6 9 17 4 12"/>' :
            '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
        }
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function getCategoryIcon(icon) {
    const icons = {
        social: '👥',
        bank: '🏦',
        email: '✉️',
        work: '💼',
        other: '📁',
        folder: '📂'
    };
    return icons[icon] || icons.folder;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function openCategoryModal(category = null) {
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');

    if (category) {
        modalTitle.textContent = '编辑分类';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryColor').value = category.color;
        document.getElementById('categoryColorText').value = category.color;
        document.getElementById('categoryIcon').value = category.icon;
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === category.icon);
        });
    } else {
        modalTitle.textContent = '添加分类';
        form.reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryColor').value = '#6366f1';
        document.getElementById('categoryColorText').value = '#6366f1';
        document.getElementById('categoryIcon').value = 'folder';
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === 'folder');
        });
    }

    modal.classList.add('active');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.classList.remove('active');
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    openCategoryModal(category);
}

async function saveCategory(e) {
    e.preventDefault();

    const categoryId = document.getElementById('categoryId').value;
    const data = {
        name: document.getElementById('categoryName').value,
        color: document.getElementById('categoryColor').value,
        icon: document.getElementById('categoryIcon').value
    };

    try {
        const url = categoryId ? `/api/categories/${categoryId}` : '/api/categories';
        const method = categoryId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            await loadCategories();
            await loadEntries();
            closeCategoryModal();
            showToast(categoryId ? '分类已更新' : '分类已添加', 'success');
        } else {
            showToast('保存失败', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('确定要删除这个分类吗？该分类下的密码条目不会被删除。')) {
        return;
    }

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            if (currentCategoryFilter === categoryId) {
                currentFilter = 'all';
                currentCategoryFilter = null;
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelector('.nav-item[data-filter="all"]').classList.add('active');
            }
            await loadCategories();
            await loadEntries();
            showToast('分类已删除', 'success');
        } else {
            showToast('删除失败', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.contains('light-theme');

    if (isLight) {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

getCategoryIcon = function (icon) {
    const icons = {
        social: '👥',
        bank: '🏦',
        email: '✉️',
        work: '💼',
        shopping: '🛒',
        entertainment: '🎮',
        other: '📁',
        folder: '📂'
    };
    return icons[icon] || icons.folder;
};
