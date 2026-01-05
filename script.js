// ============================================
// LUGHA HAI - Main JavaScript (Updated with Transcription)
// ============================================

// Global state
let currentLang = 'en'; // Interface language (en/sw)
let currentUserLang = 'en'; // Dictionary translation language (en/sw)
let userRoles = ['admin', 'editor']; // Current user roles (for development, will be dynamic later)
let dictionaryData = []; // All dictionary words
let categories = []; // Custom categories
let verbSettings = {}; // Pronouns and tenses for verbs

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage
    loadDictionaryData();
    loadCategories();
    loadVerbSettings();
    loadUserRoles();
    
    // Setup event listeners
    setupLanguageSwitcher();
    setupNavigation();
    setupSearch();
    setupForms();
    setupReview();
    setupExport();
    setupAdmin();
    setupCategoryManagement();
    setupVerbSettings();
    setupRoleSelection();
    
    // Initialize UI
    updateInterfaceLanguage();
    updateUserRoleDisplay();
    showTabsByRole();
    renderSearchResults();
    updateStatistics();
    populateCategorySelects();
});

// ============================================
// DATA MANAGEMENT
// ============================================

function loadDictionaryData() {
    const saved = localStorage.getItem('lughahai_kikurya');
    if (saved) {
        dictionaryData = JSON.parse(saved);
    } else {
        dictionaryData = [];
        saveDictionaryData();
    }
}

function saveDictionaryData() {
    localStorage.setItem('lughahai_kikurya', JSON.stringify(dictionaryData));
}

function loadCategories() {
    const saved = localStorage.getItem('lughahai_categories');
    if (saved) {
        categories = JSON.parse(saved);
    } else {
        // Default categories
        categories = [
            { id: 'family', name: { en: 'Family', sw: 'Familia' } },
            { id: 'food', name: { en: 'Food', sw: 'Chakula' } },
            { id: 'nature', name: { en: 'Nature', sw: 'Asili' } },
            { id: 'medical', name: { en: 'Medical', sw: 'Matibabu' } },
            { id: 'verbs', name: { en: 'Verbs', sw: 'Vitenzi' } },
            { id: 'other', name: { en: 'Other', sw: 'Nyingine' } }
        ];
        saveCategories();
    }
}

function saveCategories() {
    localStorage.setItem('lughahai_categories', JSON.stringify(categories));
}

function loadVerbSettings() {
    const saved = localStorage.getItem('lughahai_verb_settings');
    if (saved) {
        verbSettings = JSON.parse(saved);
    } else {
        // Default verb settings for Kikurya
        verbSettings = {
            pronouns: [
                { id: 'p1', kikurya: 'nye', sw: 'mimi', en: 'I' },
                { id: 'p2', kikurya: 'we', sw: 'wewe', en: 'you (sg)' },
                { id: 'p3', kikurya: 'ũmwe', sw: 'yeye', en: 'he/she' },
                { id: 'p4', kikurya: 'itwe', sw: 'sisi', en: 'we' },
                { id: 'p5', kikurya: 'imwe', sw: 'ninyi', en: 'you (pl)' },
                { id: 'p6', kikurya: 'bo', sw: 'wao', en: 'they' }
            ],
            tenses: [
                { id: 't1', kikurya: 'present', sw: 'wakati uliopo', en: 'present' },
                { id: 't2', kikurya: 'past', sw: 'wakati uliopita', en: 'past' },
                { id: 't3', kikurya: 'future', sw: 'wakati ujao', en: 'future' }
            ]
        };
        saveVerbSettings();
    }
}

function saveVerbSettings() {
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
}

function loadUserRoles() {
    const saved = localStorage.getItem('lughahai_dev_roles');
    if (saved) {
        userRoles = JSON.parse(saved);
    }
}

function saveUserRoles() {
    localStorage.setItem('lughahai_dev_roles', JSON.stringify(userRoles));
}

function addWord(wordData) {
    const newWord = {
        id: Date.now().toString(),
        kikurya: wordData.kikurya,
        transcription: wordData.transcription || '',
        alternativeSpellings: wordData.alternativeSpellings || [],
        swahili: wordData.swahili,
        english: wordData.english,
        explanationSw: wordData.explanationSw || '',
        explanationEn: wordData.explanationEn || '',
        exampleSw: wordData.exampleSw || '',
        exampleEn: wordData.exampleEn || '',
        category: wordData.category,
        level: wordData.level,
        conjugations: wordData.conjugations || null,
        audioFile: wordData.audioFile || null,
        status: userRoles.includes('editor') || userRoles.includes('admin') ? 'verified' : 'pending',
        author: 'current_user',
        dateAdded: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        modifiedBy: 'current_user'
    };
    
    dictionaryData.push(newWord);
    saveDictionaryData();
    return newWord;
}

function updateWord(id, wordData) {
    const index = dictionaryData.findIndex(w => w.id === id);
    if (index !== -1) {
        dictionaryData[index] = {
            ...dictionaryData[index],
            ...wordData,
            lastModified: new Date().toISOString(),
            modifiedBy: 'current_user'
        };
        saveDictionaryData();
        return dictionaryData[index];
    }
    return null;
}

function deleteWord(id) {
    dictionaryData = dictionaryData.filter(w => w.id !== id);
    saveDictionaryData();
}

function approveWord(id) {
    updateWord(id, { status: 'verified' });
}

function rejectWord(id) {
    updateWord(id, { status: 'rejected' });
}

// ============================================
// LANGUAGE SWITCHER
// ============================================

function setupLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            switchInterfaceLanguage(lang);
        });
    });
}

function switchInterfaceLanguage(lang) {
    currentLang = lang;
    currentUserLang = lang;
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    updateInterfaceLanguage();
    updateLanguagePairDisplay();
    renderSearchResults();
    populateCategorySelects();
}

function updateInterfaceLanguage() {
    document.querySelectorAll('[data-en]').forEach(el => {
        if (currentLang === 'en' && el.dataset.en) {
            el.textContent = el.dataset.en;
        } else if (currentLang === 'sw' && el.dataset.sw) {
            el.textContent = el.dataset.sw;
        }
    });
    
    document.querySelectorAll('[data-placeholder-en]').forEach(el => {
        if (currentLang === 'en' && el.dataset.placeholderEn) {
            el.placeholder = el.dataset.placeholderEn;
        } else if (currentLang === 'sw' && el.dataset.placeholderSw) {
            el.placeholder = el.dataset.placeholderSw;
        }
    });
}

function updateLanguagePairDisplay() {
    const pairElement = document.querySelector('.language-pair span');
    if (pairElement) {
        const text = currentLang === 'en' 
            ? 'Currently showing: Kikurya ↔ English'
            : 'Inaonyesha sasa: Kikurya ↔ Kiswahili';
        pairElement.textContent = text;
    }
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
        
        if (tabName === 'review') {
            renderReviewWords();
        } else if (tabName === 'admin') {
            updateStatistics();
            renderCategoriesList();
            renderVerbSettingsUI();
        }
    }
}

function showTabsByRole() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        const requiredRoles = tab.dataset.roles;
        if (requiredRoles) {
            const rolesArray = requiredRoles.split(',');
            const hasRole = rolesArray.some(role => userRoles.includes(role));
            tab.style.display = hasRole ? 'block' : 'none';
        }
    });
}

function updateUserRoleDisplay() {
    const roleElement = document.getElementById('currentRole');
    if (roleElement) {
        roleElement.textContent = userRoles.map(role => 
            role.charAt(0).toUpperCase() + role.slice(1)
        ).join(', ');
    }
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

function setupCategoryManagement() {
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryForm);
    }
}

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    const html = categories.map(cat => `
        <div class="category-item" data-id="${cat.id}">
            <div class="category-info">
                <strong>${cat.name[currentLang]}</strong>
                <span class="category-id">(ID: ${cat.id})</span>
            </div>
            <div class="category-actions">
                <button class="btn btn-edit" onclick="editCategory('${cat.id}')">
                    ${currentLang === 'en' ? 'Edit' : 'Hariri'}
                </button>
                <button class="btn btn-reject" onclick="deleteCategory('${cat.id}')">
                    ${currentLang === 'en' ? 'Delete' : 'Futa'}
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function showAddCategoryForm() {
    const id = prompt(currentLang === 'en' ? 'Category ID (lowercase, no spaces):' : 'ID ya Kategoria (herufi ndogo, bila nafasi):');
    if (!id) return;
    
    const nameEn = prompt('Category name (English):');
    if (!nameEn) return;
    
    const nameSw = prompt('Category name (Kiswahili):');
    if (!nameSw) return;
    
    categories.push({
        id: id.toLowerCase().replace(/\s+/g, '_'),
        name: { en: nameEn, sw: nameSw }
    });
    
    saveCategories();
    renderCategoriesList();
    populateCategorySelects();
    
    const message = currentLang === 'en' ? 'Category added!' : 'Kategoria imeongezwa!';
    alert(message);
}

function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const nameEn = prompt('Category name (English):', category.name.en);
    if (!nameEn) return;
    
    const nameSw = prompt('Category name (Kiswahili):', category.name.sw);
    if (!nameSw) return;
    
    category.name = { en: nameEn, sw: nameSw };
    saveCategories();
    renderCategoriesList();
    populateCategorySelects();
    
    const message = currentLang === 'en' ? 'Category updated!' : 'Kategoria imesasishwa!';
    alert(message);
}

function deleteCategory(id) {
    const confirmText = currentLang === 'en' 
        ? 'Delete this category? Words using it will need to be recategorized.'
        : 'Futa kategoria hii? Maneno yanayoitumia yatahitaji kubadilishwa kategoria.';
    
    if (!confirm(confirmText)) return;
    
    categories = categories.filter(c => c.id !== id);
    saveCategories();
    renderCategoriesList();
    populateCategorySelects();
}

function populateCategorySelects() {
    const selects = [
        'categoryFilter',
        'category',
        'reviewCategoryFilter',
        'exportCategoryFilter'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        const isFilter = selectId.includes('Filter');
        
        let html = isFilter ? `<option value="">${currentLang === 'en' ? 'All Categories' : 'Kategoria Zote'}</option>` : 
                              `<option value="">${currentLang === 'en' ? 'Select category' : 'Chagua kategoria'}</option>`;
        
        categories.forEach(cat => {
            html += `<option value="${cat.id}">${cat.name[currentLang]}</option>`;
        });
        
        select.innerHTML = html;
        select.value = currentValue;
    });
}

// ============================================
// VERB SETTINGS
// ============================================

function setupVerbSettings() {
    const savePronounsBtn = document.getElementById('savePronounsBtn');
    const saveTensesBtn = document.getElementById('saveTensesBtn');
    
    if (savePronounsBtn) savePronounsBtn.addEventListener('click', savePronouns);
    if (saveTensesBtn) saveTensesBtn.addEventListener('click', saveTenses);
}

function renderVerbSettingsUI() {
    renderPronounsList();
    renderTensesList();
}

function renderPronounsList() {
    const container = document.getElementById('pronounsList');
    if (!container) return;
    
    const html = verbSettings.pronouns.map((p, idx) => `
        <div class="verb-setting-item">
            <input type="text" value="${p.kikurya}" id="pronoun_kikurya_${idx}" placeholder="Kikurya">
            <input type="text" value="${p.sw}" id="pronoun_sw_${idx}" placeholder="Kiswahili">
            <input type="text" value="${p.en}" id="pronoun_en_${idx}" placeholder="English">
            <button class="btn btn-reject" onclick="deletePronoun(${idx})">✗</button>
        </div>
    `).join('');
    
    container.innerHTML = html + `
        <button class="btn btn-secondary" onclick="addPronoun()">
            + ${currentLang === 'en' ? 'Add Pronoun' : 'Ongeza Kiwakilishi'}
        </button>
    `;
}

function renderTensesList() {
    const container = document.getElementById('tensesList');
    if (!container) return;
    
    const html = verbSettings.tenses.map((t, idx) => `
        <div class="verb-setting-item">
            <input type="text" value="${t.kikurya}" id="tense_kikurya_${idx}" placeholder="Kikurya">
            <input type="text" value="${t.sw}" id="tense_sw_${idx}" placeholder="Kiswahili">
            <input type="text" value="${t.en}" id="tense_en_${idx}" placeholder="English">
            <button class="btn btn-reject" onclick="deleteTense(${idx})">✗</button>
        </div>
    `).join('');
    
    container.innerHTML = html + `
        <button class="btn btn-secondary" onclick="addTense()">
            + ${currentLang === 'en' ? 'Add Tense' : 'Ongeza Wakati'}
        </button>
    `;
}

function addPronoun() {
    verbSettings.pronouns.push({
        id: 'p' + Date.now(),
        kikurya: '',
        sw: '',
        en: ''
    });
    renderPronounsList();
}

function deletePronoun(idx) {
    verbSettings.pronouns.splice(idx, 1);
    renderPronounsList();
}

function savePronouns() {
    verbSettings.pronouns.forEach((p, idx) => {
        p.kikurya = document.getElementById(`pronoun_kikurya_${idx}`).value;
        p.sw = document.getElementById(`pronoun_sw_${idx}`).value;
        p.en = document.getElementById(`pronoun_en_${idx}`).value;
    });
    
    saveVerbSettings();
    alert(currentLang === 'en' ? 'Pronouns saved!' : 'Viwakilishi vimehifadhiwa!');
}

function addTense() {
    verbSettings.tenses.push({
        id: 't' + Date.now(),
        kikurya: '',
        sw: '',
        en: ''
    });
    renderTensesList();
}

function deleteTense(idx) {
    verbSettings.tenses.splice(idx, 1);
    renderTensesList();
}

function saveTenses() {
    verbSettings.tenses.forEach((t, idx) => {
        t.kikurya = document.getElementById(`tense_kikurya_${idx}`).value;
        t.sw = document.getElementById(`tense_sw_${idx}`).value;
        t.en = document.getElementById(`tense_en_${idx}`).value;
    });
    
    saveVerbSettings();
    alert(currentLang === 'en' ? 'Tenses saved!' : 'Nyakati zimehifadhiwa!');
}

// ============================================
// ROLE SELECTION (Development)
// ============================================

function setupRoleSelection() {
    const checkboxes = document.querySelectorAll('.role-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateUserRolesFromCheckboxes);
    });
    
    updateRoleCheckboxes();
}

function updateRoleCheckboxes() {
    userRoles.forEach(role => {
        const checkbox = document.getElementById(`role_${role}`);
        if (checkbox) checkbox.checked = true;
    });
}

function updateUserRolesFromCheckboxes() {
    const allRoles = ['viewer', 'contributor', 'editor', 'moderator', 'admin'];
    userRoles = allRoles.filter(role => {
        const checkbox = document.getElementById(`role_${role}`);
        return checkbox && checkbox.checked;
    });
    
    if (!userRoles.includes('viewer')) {
        userRoles.push('viewer');
    }
    
    saveUserRoles();
    updateUserRoleDisplay();
    showTabsByRole();
    
    const message = currentLang === 'en' ? 'Roles updated!' : 'Majukumu yamebadilishwa!';
    console.log(message, userRoles);
}

// ============================================
// SEARCH & FILTER
// ============================================

function setupSearch() {
    const searchBox = document.getElementById('searchBox');
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    
    searchBox.addEventListener('input', renderSearchResults);
    categoryFilter.addEventListener('change', renderSearchResults);
    levelFilter.addEventListener('change', renderSearchResults);
}

function renderSearchResults() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const level = document.getElementById('levelFilter').value;
    
    let filtered = dictionaryData.filter(word => {
        if (word.status !== 'verified') return false;
        
        const matchesSearch = !searchTerm || 
            word.kikurya.toLowerCase().includes(searchTerm) ||
            word.swahili.toLowerCase().includes(searchTerm) ||
            word.english.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesSearch && matchesCategory && matchesLevel;
    });
    
    const resultsContainer = document.getElementById('searchResults');
    
    if (filtered.length === 0) {
        const noResultsText = currentLang === 'en' 
            ? 'No words found. Try different search terms or filters.'
            : 'Hakuna maneno yaliyopatikana. Jaribu maneno mengine au vichujio.';
        resultsContainer.innerHTML = `<p class="no-results">${noResultsText}</p>`;
        return;
    }
    
    resultsContainer.innerHTML = filtered.map(word => createWordCard(word)).join('');
}

function createWordCard(word) {
    const translation = currentUserLang === 'en' ? word.english : word.swahili;
    const explanation = currentUserLang === 'en' ? word.explanationEn : word.explanationSw;
    const example = currentUserLang === 'en' ? word.exampleEn : word.exampleSw;
    
    const categoryObj = categories.find(c => c.id === word.category);
    const categoryLabel = categoryObj ? categoryObj.name[currentLang] : word.category;
    
    let conjugationsHTML = '';
    if (word.category === 'verbs' && word.conjugations) {
        conjugationsHTML = '<div class="word-conjugations"><strong>' + 
            (currentLang === 'en' ? 'Conjugations:' : 'Matumizi:') + '</strong>';
        
        verbSettings.tenses.forEach(tense => {
            if (word.conjugations[tense.id]) {
                conjugationsHTML += `<div class="tense-group"><em>${tense[currentLang]}:</em> `;
                const forms = [];
                verbSettings.pronouns.forEach(pronoun => {
                    if (word.conjugations[tense.id][pronoun.id]) {
                        forms.push(word.conjugations[tense.id][pronoun.id]);
                    }
                });
                conjugationsHTML += forms.join(', ') + '</div>';
            }
        });
        conjugationsHTML += '</div>';
    }
    
    return `
        <div class="word-card" data-id="${word.id}">
            <div class="word-status status-${word.status}">${word.status}</div>
            <div class="word-kikurya">${word.kikurya}</div>
            ${word.transcription ? `<div class="word-transcription">[${word.transcription}]</div>` : ''}
            ${word.alternativeSpellings && word.alternativeSpellings.length > 0 ? `<div class="word-alt-spellings"><small>${currentLang === 'en' ? 'Also:' : 'Pia:'} ${word.alternativeSpellings.join(', ')}</small></div>` : ''}
            <div class="word-translation">${translation}</div>
            <div class="word-meta">
                <span class="meta-tag">${categoryLabel}</span>
                <span class="meta-tag">${word.level}</span>
            </div>
            ${explanation ? `<div class="word-explanation">${explanation}</div>` : ''}
            ${example ? `<div class="word-example">"${example}"</div>` : ''}
            ${conjugationsHTML}
            ${word.audioFile ? `
                <div class="word-audio">
                    <button class="audio-btn" onclick="playAudio('${word.id}')">
                        🔊 ${currentLang === 'en' ? 'Play' : 'Sikiliza'}
                    </button>
                </div>
            ` : ''}
            ${userRoles.includes('editor') || userRoles.includes('admin') ? `
                <div class="word-actions">
                    <button class="btn btn-edit" onclick="editWord('${word.id}')">
                        ${currentLang === 'en' ? 'Edit' : 'Hariri'}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// FORMS
// ============================================

function setupForms() {
    const wordForm = document.getElementById('wordForm');
    const clearBtn = document.getElementById('clearForm');
    const categorySelect = document.getElementById('category');
    
    wordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleWordSubmit();
    });
    
    clearBtn.addEventListener('click', function() {
        wordForm.reset();
        hideConjugationForm();
    });
    
    categorySelect.addEventListener('change', function() {
        if (this.value === 'verbs') {
            showConjugationForm();
        } else {
            hideConjugationForm();
        }
    });
}

function showConjugationForm() {
    let container = document.getElementById('conjugationForm');
    if (!container) {
        container = document.createElement('div');
        container.id = 'conjugationForm';
        container.className = 'conjugation-form';
        document.getElementById('wordForm').insertBefore(
            container,
            document.querySelector('.form-actions')
        );
    }
    
    let html = '<h3>' + (currentLang === 'en' ? 'Verb Conjugations' : 'Matumizi ya Kitenzi') + '</h3>';
    
    verbSettings.tenses.forEach(tense => {
        html += `<div class="tense-section">
            <h4>${tense[currentLang]}</h4>
            <div class="conjugation-grid">`;
        
        verbSettings.pronouns.forEach(pronoun => {
            html += `
                <div class="conjugation-item">
                    <label>${pronoun.kikurya} (${pronoun[currentLang]})</label>
                    <input type="text" id="conj_${tense.id}_${pronoun.id}" placeholder="${pronoun.kikurya}...">
                </div>
            `;
        });
        
        html += '</div></div>';
    });
    
    container.innerHTML = html;
    container.style.display = 'block';
}

function hideConjugationForm() {
    const container = document.getElementById('conjugationForm');
    if (container) {
        container.style.display = 'none';
    }
}

function handleWordSubmit() {
    const formData = {
        kikurya: document.getElementById('kikuryaWord').value.trim(),
        transcription: document.getElementById('transcription').value.trim(),
        alternativeSpellings: document.getElementById('alternativeSpellings').value
            .split(',').map(s => s.trim()).filter(s => s),
        swahili: document.getElementById('swahiliWord').value.trim(),
        english: document.getElementById('englishWord').value.trim(),
        explanationSw: document.getElementById('swahiliExplanation').value.trim(),
        explanationEn: document.getElementById('englishExplanation').value.trim(),
        exampleSw: document.getElementById('swahiliExample').value.trim(),
        exampleEn: document.getElementById('englishExample').value.trim(),
        category: document.getElementById('category').value,
        level: document.getElementById('level').value,
        audioFile: null
    };
    
    if (formData.category === 'verbs') {
        const conjugations = {};
        verbSettings.tenses.forEach(tense => {
            conjugations[tense.id] = {};
            verbSettings.pronouns.forEach(pronoun => {
                const input = document.getElementById(`conj_${tense.id}_${pronoun.id}`);
                if (input && input.value.trim()) {
                    conjugations[tense.id][pronoun.id] = input.value.trim();
                }
            });
        });
        formData.conjugations = conjugations;
    }
    
    const newWord = addWord(formData);
    
    const message = currentLang === 'en'
        ? `Word "${formData.kikurya}" added successfully! Status: ${newWord.status}`
        : `Neno "${formData.kikurya}" limeongezwa! Hali: ${newWord.status}`;
    alert(message);
    
    document.getElementById('wordForm').reset();
    hideConjugationForm();
    
    renderSearchResults();
    updateStatistics();
}

function editWord(id) {
    const word = dictionaryData.find(w => w.id === id);
    if (!word) return;
    
    switchTab('add');
    
    document.getElementById('kikuryaWord').value = word.kikurya;
    document.getElementById('transcription').value = word.transcription || '';
    document.getElementById('alternativeSpellings').value = (word.alternativeSpellings || []).join(', ');
    document.getElementById('swahiliWord').value = word.swahili;
    document.getElementById('englishWord').value = word.english;
    document.getElementById('swahiliExplanation').value = word.explanationSw;
    document.getElementById('englishExplanation').value = word.explanationEn;
    document.getElementById('swahiliExample').value = word.exampleSw;
    document.getElementById('englishExample').value = word.exampleEn;
    document.getElementById('category').value = word.category;
    document.getElementById('level').value = word.level;
    
    if (word.category === 'verbs' && word.conjugations) {
        showConjugationForm();
        
        verbSettings.tenses.forEach(tense => {
            verbSettings.pronouns.forEach(pronoun => {
                const input = document.getElementById(`conj_${tense.id}_${pronoun.id}`);
                if (input && word.conjugations[tense.id] && word.conjugations[tense.id][pronoun.id]) {
                    input.value = word.conjugations[tense.id][pronoun.id];
                }
            });
        });
    }
}

// ============================================
// REVIEW (Moderator)
// ============================================

function setupReview() {
    const categoryFilter = document.getElementById('reviewCategoryFilter');
    const levelFilter = document.getElementById('reviewLevelFilter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', renderReviewWords);
    if (levelFilter) levelFilter.addEventListener('change', renderReviewWords);
}

function renderReviewWords() {
    const category = document.getElementById('reviewCategoryFilter')?.value || '';
    const level = document.getElementById('reviewLevelFilter')?.value || '';
    
    let pending = dictionaryData.filter(word => {
        if (word.status !== 'pending') return false;
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesCategory && matchesLevel;
    });
    
    const countElement = document.getElementById('pendingCount');
    if (countElement) {
        countElement.textContent = pending.length;
    }
    
    const resultsContainer = document.getElementById('reviewResults');
    if (!resultsContainer) return;
    
    if (pending.length === 0) {
        const noResultsText = currentLang === 'en'
            ? 'No pending words to review'
            : 'Hakuna maneno ya kukagua';
        resultsContainer.innerHTML = `<p class="no-results">${noResultsText}</p>`;
        return;
    }
    
    resultsContainer.innerHTML = pending.map(word => createReviewCard(word)).join('');
}

function createReviewCard(word) {
    const translation = currentUserLang === 'en' ? word.english : word.swahili;
    const explanation = currentUserLang === 'en' ? word.explanationEn : word.explanationSw;
    const example = currentUserLang === 'en' ? word.exampleEn : word.exampleSw;
    
    const categoryObj = categories.find(c => c.id === word.category);
    const categoryLabel = categoryObj ? categoryObj.name[currentLang] : word.category;
    
    let conjugationsHTML = '';
    if (word.category === 'verbs' && word.conjugations) {
        conjugationsHTML = '<div class="word-conjugations"><strong>' + 
            (currentLang === 'en' ? 'Conjugations:' : 'Matumizi:') + '</strong>';
        
        verbSettings.tenses.forEach(tense => {
            if (word.conjugations[tense.id]) {
                conjugationsHTML += `<div class="tense-group"><em>${tense[currentLang]}:</em> `;
                const forms = [];
                verbSettings.pronouns.forEach(pronoun => {
                    if (word.conjugations[tense.id][pronoun.id]) {
                        forms.push(`${pronoun.kikurya}: ${word.conjugations[tense.id][pronoun.id]}`);
                    }
                });
                conjugationsHTML += forms.join(', ') + '</div>';
            }
        });
        conjugationsHTML += '</div>';
    }
    
    return `
        <div class="word-card" data-id="${word.id}">
            <div class="word-status status-${word.status}">${word.status}</div>
            <div class="word-kikurya">${word.kikurya}</div>
            ${word.transcription ? `<div class="word-transcription">[${word.transcription}]</div>` : ''}
            ${word.alternativeSpellings && word.alternativeSpellings.length > 0 ? `<div class="word-alt-spellings"><small>${currentLang === 'en' ? 'Also:' : 'Pia:'} ${word.alternativeSpellings.join(', ')}</small></div>` : ''}
            <div class="word-translation">${translation}</div>
            <div class="word-meta">
                <span class="meta-tag">${categoryLabel}</span>
                <span class="meta-tag">${word.level}</span>
            </div>
            ${explanation ? `<div class="word-explanation">${explanation}</div>` : ''}
            ${example ? `<div class="word-example">"${example}"</div>` : ''}
            ${conjugationsHTML}
            <div class="word-actions">
                <button class="btn btn-approve" onclick="handleApprove('${word.id}')">
                    ✓ ${currentLang === 'en' ? 'Approve' : 'Kubali'}
                </button>
                <button class="btn btn-reject" onclick="handleReject('${word.id}')">
                    ✗ ${currentLang === 'en' ? 'Reject' : 'Kataa'}
                </button>
                <button class="btn btn-edit" onclick="editWord('${word.id}')">
                    ${currentLang === 'en' ? 'Edit' : 'Hariri'}
                </button>
            </div>
        </div>
    `;
}

function handleApprove(id) {
    approveWord(id);
    renderReviewWords();
    renderSearchResults();
    updateStatistics();
    
    const message = currentLang === 'en' ? 'Word approved!' : 'Neno limekubaliwa!';
    alert(message);
}

function handleReject(id) {
    const confirmText = currentLang === 'en' 
        ? 'Are you sure you want to reject this word?'
        : 'Una uhakika unataka kukataa neno hili?';
    
    if (confirm(confirmText)) {
        rejectWord(id);
        renderReviewWords();
        updateStatistics();
        
        const message = currentLang === 'en' ? 'Word rejected' : 'Neno limekataliwa';
        alert(message);
    }
}

// ============================================
// EXPORT
// ============================================

function setupExport() {
    document.getElementById('exportSimpleList')?.addEventListener('click', exportSimpleList);
    document.getElementById('exportJSON')?.addEventListener('click', exportJSON);
    document.getElementById('exportCSV')?.addEventListener('click', exportCSV);
}

function getFilteredExportData() {
    const category = document.getElementById('exportCategoryFilter')?.value || '';
    const level = document.getElementById('exportLevelFilter')?.value || '';
    
    return dictionaryData.filter(word => {
        if (word.status !== 'verified') return false;
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesCategory && matchesLevel;
    });
}

function exportSimpleList() {
    const data = getFilteredExportData();
    
    let text = currentLang === 'en'
        ? 'KIKURYA - ENGLISH DICTIONARY\n\n'
        : 'KAMUSI YA KIKURYA - KISWAHILI\n\n';
    
    data.forEach(word => {
        const translation = currentUserLang === 'en' ? word.english : word.swahili;
        text += `${word.kikurya}`;
        if (word.transcription) text += ` [${word.transcription}]`;
        text += ` - ${translation}\n`;
        
        if (word.category === 'verbs' && word.conjugations) {
            verbSettings.tenses.forEach(tense => {
                if (word.conjugations[tense.id]) {
                    text += `  ${tense[currentLang]}: `;
                    const forms = [];
                    verbSettings.pronouns.forEach(pronoun => {
                        if (word.conjugations[tense.id][pronoun.id]) {
                            forms.push(word.conjugations[tense.id][pronoun.id]);
                        }
                    });
                    text += forms.join(', ') + '\n';
                }
            });
        }
        text += '\n';
    });
    
    downloadFile('kikurya-dictionary.txt', text);
}

function exportJSON() {
    const data = getFilteredExportData();
    const json = JSON.stringify(data, null, 2);
    downloadFile('kikurya-dictionary.json', json);
}

function exportCSV() {
    const data = getFilteredExportData();
    
    let csv = 'Kikurya,Transcription,Swahili,English,Category,Level\n';
    
    data.forEach(word => {
        csv += `"${word.kikurya}","${word.transcription || ''}","${word.swahili}","${word.english}","${word.category}","${word.level}"\n`;
    });
    
    downloadFile('kikurya-dictionary.csv', csv);
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// ADMIN
// ============================================

function setupAdmin() {
    document.getElementById('backupData')?.addEventListener('click', backupData);
    document.getElementById('importData')?.addEventListener('click', importData);
}

function updateStatistics() {
    const total = dictionaryData.length;
    const verified = dictionaryData.filter(w => w.status === 'verified').length;
    const pending = dictionaryData.filter(w => w.status === 'pending').length;
    
    const totalElement = document.getElementById('totalWords');
    const verifiedElement = document.getElementById('verifiedWords');
    const pendingElement = document.getElementById('pendingWords');
    const pendingCountElement = document.getElementById('pendingCount');
    
    if (totalElement) totalElement.textContent = total;
    if (verifiedElement) verifiedElement.textContent = verified;
    if (pendingElement) pendingElement.textContent = pending;
    if (pendingCountElement) pendingCountElement.textContent = pending;
}

function backupData() {
    const backup = {
        version: '1.0',
        language: 'kikurya',
        exportDate: new Date().toISOString(),
        data: dictionaryData,
        categories: categories,
        verbSettings: verbSettings
    };
    
    const json = JSON.stringify(backup, null, 2);
    const filename = `lughahai-kikurya-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(filename, json);
    
    const message = currentLang === 'en' ? 'Backup created!' : 'Nakala ya hifadhi imetengenezwa!';
    alert(message);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                
                if (imported.data && Array.isArray(imported.data)) {
                    const confirmText = currentLang === 'en'
                        ? `Import ${imported.data.length} words? This will add to existing data.`
                        : `Ingiza maneno ${imported.data.length}? Hii itaongeza kwenye data iliyopo.`;
                    
                    if (confirm(confirmText)) {
                        dictionaryData = [...dictionaryData, ...imported.data];
                        if (imported.categories) categories = imported.categories;
                        if (imported.verbSettings) verbSettings = imported.verbSettings;
                        
                        saveDictionaryData();
                        saveCategories();
                        saveVerbSettings();
                        
                        renderSearchResults();
                        updateStatistics();
                        populateCategorySelects();
                        renderCategoriesList();
                        renderVerbSettingsUI();
                        
                        const message = currentLang === 'en' ? 'Import successful!' : 'Kuingiza kumefanikiwa!';
                        alert(message);
                    }
                }
            } catch (error) {
                const message = currentLang === 'en' ? 'Error importing file' : 'Hitilafu katika kuingiza faili';
                alert(message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// AUDIO PLAYBACK
// ============================================

function playAudio(wordId) {
    const word = dictionaryData.find(w => w.id === wordId);
    if (word && word.audioFile) {
        alert('Audio playback will be implemented');
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.playAudio = playAudio;
window.editWord = editWord;
window.handleApprove = handleApprove;
window.handleReject = handleReject;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.addPronoun = addPronoun;
window.deletePronoun = deletePronoun;
window.addTense = addTense;
window.deleteTense = deleteTense;
