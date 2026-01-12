// ============================================
// ADMIN.JS - Administration panel
// ============================================

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateStatistics();
    renderCategoriesList();
    renderVerbSettingsUI();
    setupEventListeners();
});

// Listen for language changes
window.addEventListener('languageChanged', function(e) {
    updateStatistics();
    renderCategoriesList();
    renderVerbSettingsUI();
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Category management
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryForm);
    }
    
    // Verb settings
    const savePronounsBtn = document.getElementById('savePronounsBtn');
    const saveTensesBtn = document.getElementById('saveTensesBtn');
    
    if (savePronounsBtn) {
        savePronounsBtn.addEventListener('click', savePronouns);
    }
    
    if (saveTensesBtn) {
        saveTensesBtn.addEventListener('click', saveTenses);
    }
    
    // Data management
    const backupBtn = document.getElementById('backupData');
    const importBtn = document.getElementById('importData');
    
    if (backupBtn) {
        backupBtn.addEventListener('click', backupData);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    // Role selection (development)
    const roleCheckboxes = document.querySelectorAll('.role-checkbox');
    roleCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateUserRolesFromCheckboxes);
    });
    
    updateRoleCheckboxes();
}

// ============================================
// STATISTICS
// ============================================

function updateStatistics() {
    const dictionaryData = getDictionaryData();
    
    const total = dictionaryData.length;
    const verified = dictionaryData.filter(w => w.status === 'verified').length;
    const pending = dictionaryData.filter(w => w.status === 'pending').length;
    
    const totalElement = document.getElementById('totalWords');
    const verifiedElement = document.getElementById('verifiedWords');
    const pendingElement = document.getElementById('pendingWords');
    
    if (totalElement) totalElement.textContent = total;
    if (verifiedElement) verifiedElement.textContent = verified;
    if (pendingElement) pendingElement.textContent = pending;
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    const categories = getCategories();
    const currentLang = window.currentLang || 'en';
    
    if (categories.length === 0) {
        container.innerHTML = `<p class="no-results">${currentLang === 'en' ? 'No categories yet' : 'Hakuna kategoria bado'}</p>`;
        return;
    }
    
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
    const currentLang = window.currentLang || 'en';
    
    const id = prompt(currentLang === 'en' 
        ? 'Category ID (lowercase, no spaces):' 
        : 'ID ya Kategoria (herufi ndogo, bila nafasi):');
    
    if (!id) return;
    
    const nameEn = prompt('Category name (English):');
    if (!nameEn) return;
    
    const nameSw = prompt('Category name (Kiswahili):');
    if (!nameSw) return;
    
    // Get current categories
    const categories = getCategories();
    
    // Check if ID already exists
    if (categories.find(c => c.id === id.toLowerCase().replace(/\s+/g, '_'))) {
        alert(currentLang === 'en' ? 'Category ID already exists!' : 'ID ya kategoria tayari ipo!');
        return;
    }
    
    // Add new category
    categories.push({
        id: id.toLowerCase().replace(/\s+/g, '_'),
        name: { en: nameEn, sw: nameSw }
    });
    
    // Save
    localStorage.setItem('lughahai_categories', JSON.stringify(categories));
    
    const message = currentLang === 'en' ? 'Category added!' : 'Kategoria imeongezwa!';
    alert(message);
    
    // Refresh display
    renderCategoriesList();
}

function editCategory(id) {
    const categories = getCategories();
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const nameEn = prompt('Category name (English):', category.name.en);
    if (!nameEn) return;
    
    const nameSw = prompt('Category name (Kiswahili):', category.name.sw);
    if (!nameSw) return;
    
    // Update category
    category.name = { en: nameEn, sw: nameSw };
    
    // Save
    localStorage.setItem('lughahai_categories', JSON.stringify(categories));
    
    const currentLang = window.currentLang || 'en';
    const message = currentLang === 'en' ? 'Category updated!' : 'Kategoria imesasishwa!';
    alert(message);
    
    // Refresh display
    renderCategoriesList();
}

function deleteCategory(id) {
    const currentLang = window.currentLang || 'en';
    const confirmText = currentLang === 'en' 
        ? 'Delete this category? Words using it will need to be recategorized.'
        : 'Futa kategoria hii? Maneno yanayoitumia yatahitaji kubadilishwa kategoria.';
    
    if (!confirm(confirmText)) return;
    
    let categories = getCategories();
    categories = categories.filter(c => c.id !== id);
    
    // Save
    localStorage.setItem('lughahai_categories', JSON.stringify(categories));
    
    // Refresh display
    renderCategoriesList();
}

// ============================================
// VERB SETTINGS - PRONOUNS & TENSES
// ============================================

function renderVerbSettingsUI() {
    renderPronounsList();
    renderTensesList();
}

function renderPronounsList() {
    const container = document.getElementById('pronounsList');
    if (!container) return;
    
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
    const html = verbSettings.pronouns.map((p, idx) => `
        <div class="verb-setting-item">
            <input type="text" value="${p.kikurya}" id="pronoun_kikurya_${idx}" placeholder="Kikurya">
            <input type="text" value="${p.sw}" id="pronoun_sw_${idx}" placeholder="Kiswahili">
            <input type="text" value="${p.en}" id="pronoun_en_${idx}" placeholder="English">
            <button class="btn btn-reject" onclick="deletePronoun(${idx})">✗</button>
        </div>
    `).join('');
    
    container.innerHTML = html + `
        <button class="btn btn-secondary" onclick="addPronoun()" style="margin-top: 1rem;">
            + ${currentLang === 'en' ? 'Add Pronoun' : 'Ongeza Kiwakilishi'}
        </button>
    `;
}

function renderTensesList() {
    const container = document.getElementById('tensesList');
    if (!container) return;
    
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
    const html = verbSettings.tenses.map((t, idx) => `
        <div class="verb-setting-item">
            <input type="text" value="${t.kikurya}" id="tense_kikurya_${idx}" placeholder="Kikurya">
            <input type="text" value="${t.sw}" id="tense_sw_${idx}" placeholder="Kiswahili">
            <input type="text" value="${t.en}" id="tense_en_${idx}" placeholder="English">
            <button class="btn btn-reject" onclick="deleteTense(${idx})">✗</button>
        </div>
    `).join('');
    
    container.innerHTML = html + `
        <button class="btn btn-secondary" onclick="addTense()" style="margin-top: 1rem;">
            + ${currentLang === 'en' ? 'Add Tense' : 'Ongeza Wakati'}
        </button>
    `;
}

function addPronoun() {
    const verbSettings = getVerbSettings();
    
    verbSettings.pronouns.push({
        id: 'p' + Date.now(),
        kikurya: '',
        sw: '',
        en: ''
    });
    
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
    renderPronounsList();
}

function deletePronoun(idx) {
    const currentLang = window.currentLang || 'en';
    const confirmText = currentLang === 'en' 
        ? 'Delete this pronoun?'
        : 'Futa kiwakilishi hiki?';
    
    if (!confirm(confirmText)) return;
    
    const verbSettings = getVerbSettings();
    verbSettings.pronouns.splice(idx, 1);
    
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
    renderPronounsList();
}

function savePronouns() {
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
    verbSettings.pronouns.forEach((p, idx) => {
        const kikuryaInput = document.getElementById(`pronoun_kikurya_${idx}`);
        const swInput = document.getElementById(`pronoun_sw_${idx}`);
        const enInput = document.getElementById(`pronoun_en_${idx}`);
        
        if (kikuryaInput) p.kikurya = kikuryaInput.value;
        if (swInput) p.sw = swInput.value;
        if (enInput) p.en = enInput.value;
    });
    
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
    
    alert(currentLang === 'en' ? 'Pronouns saved!' : 'Viwakilishi vimehifadhiwa!');
}

function addTense() {
    const currentLang = window.currentLang || 'en';
    
    // Prompt for tense ID (must be in snake_case format)
    const tenseId = prompt(currentLang === 'en' 
        ? 'Tense ID (lowercase, underscores, e.g. "past_simple"):' 
        : 'ID ya Wakati (herufi ndogo, underscores, mfano "past_simple"):');
    
    if (!tenseId) return;
    
    // Validate ID format
    const idPattern = /^[a-z_]+$/;
    if (!idPattern.test(tenseId)) {
        alert(currentLang === 'en' 
            ? 'Invalid ID format. Use lowercase letters and underscores only (e.g. past_simple)'
            : 'Muundo wa ID si sahihi. Tumia herufi ndogo na underscores tu (mfano past_simple)');
        return;
    }
    
    const verbSettings = getVerbSettings();
    
    // Check if ID already exists
    if (verbSettings.tenses.find(t => t.id === tenseId)) {
        alert(currentLang === 'en' ? 'Tense ID already exists!' : 'ID ya wakati tayari ipo!');
        return;
    }
    
    verbSettings.tenses.push({
        id: tenseId,
        kikurya: '',
        sw: '',
        en: ''
    });
    
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
    renderTensesList();
}

function deleteTense(idx) {
    const currentLang = window.currentLang || 'en';
    const confirmText = currentLang === 'en' 
        ? 'Delete this tense?'
        : 'Futa wakati huu?';
    
    if (!confirm(confirmText)) return;
    
    const verbSettings = getVerbSettings();
    verbSettings.tenses.splice(idx, 1);
    
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
    renderTensesList();
}

function saveTenses() {
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
    verbSettings.tenses.forEach((t, idx) => {
        const kikuryaInput = document.getElementById(`tense_kikurya_${idx}`);
        const swInput = document.getElementById(`tense_sw_${idx}`);
        const enInput = document.getElementById(`tense_en_${idx}`);
        
        if (kikuryaInput) t.kikurya = kikuryaInput.value;
        if (swInput) t.sw = swInput.value;
        if (enInput) t.en = enInput.value;
    });
    
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
    
    alert(currentLang === 'en' ? 'Tenses saved!' : 'Nyakati zimehifadhiwa!');
}

// ============================================
// ROLE SELECTION (DEVELOPMENT MODE)
// ============================================

function updateRoleCheckboxes() {
    const userRoles = getUserRoles();
    
    userRoles.forEach(role => {
        const checkbox = document.getElementById(`role_${role}`);
        if (checkbox) checkbox.checked = true;
    });
}

function updateUserRolesFromCheckboxes() {
    const allRoles = ['viewer', 'contributor', 'editor', 'moderator', 'admin'];
    let selectedRoles = allRoles.filter(role => {
        const checkbox = document.getElementById(`role_${role}`);
        return checkbox && checkbox.checked;
    });
    
    // Viewer always enabled
    if (!selectedRoles.includes('viewer')) {
        selectedRoles.push('viewer');
    }
    
    localStorage.setItem('lughahai_dev_roles', JSON.stringify(selectedRoles));
    
    const currentLang = window.currentLang || 'en';
    const message = currentLang === 'en' ? 'Roles updated!' : 'Majukumu yamebadilishwa!';
    
    alert(message);
    
    // Reload page to apply role changes
    location.reload();
}

// ============================================
// DATA MANAGEMENT - BACKUP & IMPORT
// ============================================

function backupData() {
    const dictionaryData = getDictionaryData();
    const categories = getCategories();
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
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
    const currentLang = window.currentLang || 'en';
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                
                if (imported.data && Array.isArray(imported.data)) {
                    const confirmText = currentLang === 'en'
                        ? `Import ${imported.data.length} words? This will add to existing data.`
                        : `Ingiza maneno ${imported.data.length}? Hii itaongeza kwenye data iliyopo.`;
                    
                    if (confirm(confirmText)) {
                        // Import dictionary data
                        const currentData = getDictionaryData();
                        const mergedData = [...currentData, ...imported.data];
                        localStorage.setItem('lughahai_kikurya', JSON.stringify(mergedData));
                        
                        // Import categories if available
                        if (imported.categories) {
                            localStorage.setItem('lughahai_categories', JSON.stringify(imported.categories));
                        }
                        
                        // Import verb settings if available
                        if (imported.verbSettings) {
                            localStorage.setItem('lughahai_verb_settings', JSON.stringify(imported.verbSettings));
                        }
                        
                        const message = currentLang === 'en' ? 'Import successful!' : 'Kuingiza kumefanikiwa!';
                        alert(message);
                        
                        // Reload page to show new data
                        location.reload();
                    }
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                const message = currentLang === 'en' 
                    ? 'Error importing file. Please check the file format.'
                    : 'Hitilafu katika kuingiza faili. Tafadhali angalia muundo wa faili.';
                alert(message);
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.addPronoun = addPronoun;
window.deletePronoun = deletePronoun;
window.savePronouns = savePronouns;
window.addTense = addTense;
window.deleteTense = deleteTense;
window.saveTenses = saveTenses;
