// ============================================
// LUGHA HAI - Main JavaScript
// ============================================

// Global state
let currentLang = 'en'; // Interface language (en/sw)
let currentUserLang = 'en'; // Dictionary translation language (en/sw)
let userRoles = ['admin', 'editor']; // Current user roles (for development, will be dynamic later)
let dictionaryData = []; // All dictionary words

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage
    loadDictionaryData();
    
    // Setup event listeners
    setupLanguageSwitcher();
    setupNavigation();
    setupSearch();
    setupForms();
    setupReview();
    setupExport();
    setupAdmin();
    
    // Initialize UI
    updateInterfaceLanguage();
    updateUserRoleDisplay();
    showTabsByRole();
    renderSearchResults();
    updateStatistics();
});

// ============================================
// DATA MANAGEMENT
// ============================================

function loadDictionaryData() {
    const saved = localStorage.getItem('lughahai_kikurya');
    if (saved) {
        dictionaryData = JSON.parse(saved);
    } else {
        // Initialize with empty array
        dictionaryData = [];
        saveDictionaryData();
    }
}

function saveDictionaryData() {
    localStorage.setItem('lughahai_kikurya', JSON.stringify(dictionaryData));
}

function addWord(wordData) {
    const newWord = {
        id: Date.now().toString(),
        kikurya: wordData.kikurya,
        alternativeSpellings: wordData.alternativeSpellings || [],
        swahili: wordData.swahili,
        english: wordData.english,
        explanationSw: wordData.explanationSw || '',
        explanationEn: wordData.explanationEn || '',
        exampleSw: wordData.exampleSw || '',
        exampleEn: wordData.exampleEn || '',
        category: wordData.category,
        level: wordData.level,
        audioFile: wordData.audioFile || null,
        status: userRoles.includes('editor') || userRoles.includes('admin') ? 'verified' : 'pending',
        author: 'current_user', // Will be replaced with actual user ID
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
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    updateInterfaceLanguage();
    updateLanguagePairDisplay();
    renderSearchResults();
}

function updateInterfaceLanguage() {
    // Update all elements with data-en and data-sw attributes
    document.querySelectorAll('[data-en]').forEach(el => {
        if (currentLang === 'en' && el.dataset.en) {
            el.textContent = el.dataset.en;
        } else if (currentLang === 'sw' && el.dataset.sw) {
            el.textContent = el.dataset.sw;
        }
    });
    
    // Update placeholders
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
    // Update active nav button
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Refresh data when switching to certain tabs
        if (tabName === 'review') {
            renderReviewWords();
        } else if (tabName === 'admin') {
            updateStatistics();
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
        // Only show verified words in search
        if (word.status !== 'verified') return false;
        
        // Search term filter
        const matchesSearch = !searchTerm || 
            word.kikurya.toLowerCase().includes(searchTerm) ||
            word.swahili.toLowerCase().includes(searchTerm) ||
            word.english.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !category || word.category === category;
        
        // Level filter
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
    
    const categoryLabel = getCategoryLabel(word.category);
    
    return `
        <div class="word-card" data-id="${word.id}">
            <div class="word-status status-${word.status}">${word.status}</div>
            <div class="word-kikurya">${word.kikurya}</div>
            <div class="word-translation">${translation}</div>
            <div class="word-meta">
                <span class="meta-tag">${categoryLabel}</span>
                <span class="meta-tag">${word.level}</span>
            </div>
            ${explanation ? `<div class="word-explanation">${explanation}</div>` : ''}
            ${example ? `<div class="word-example">"${example}"</div>` : ''}
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

function getCategoryLabel(category) {
    const labels = {
        family: { en: 'Family', sw: 'Familia' },
        food: { en: 'Food', sw: 'Chakula' },
        nature: { en: 'Nature', sw: 'Asili' },
        medical: { en: 'Medical', sw: 'Matibabu' },
        verbs: { en: 'Verbs', sw: 'Vitenzi' },
        other: { en: 'Other', sw: 'Nyingine' }
    };
    
    return labels[category]?.[currentLang] || category;
}

// ============================================
// FORMS
// ============================================

function setupForms() {
    const wordForm = document.getElementById('wordForm');
    const clearBtn = document.getElementById('clearForm');
    
    wordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleWordSubmit();
    });
    
    clearBtn.addEventListener('click', function() {
        wordForm.reset();
    });
}

function handleWordSubmit() {
    const formData = {
        kikurya: document.getElementById('kikuryaWord').value.trim(),
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
        audioFile: null // TODO: Handle audio file upload
    };
    
    const newWord = addWord(formData);
    
    // Show success message
    const message = currentLang === 'en'
        ? `Word "${formData.kikurya}" added successfully! Status: ${newWord.status}`
        : `Neno "${formData.kikurya}" limeongezwa! Hali: ${newWord.status}`;
    alert(message);
    
    // Clear form
    document.getElementById('wordForm').reset();
    
    // Update displays
    renderSearchResults();
    updateStatistics();
}

function editWord(id) {
    const word = dictionaryData.find(w => w.id === id);
    if (!word) return;
    
    // Switch to add/edit tab
    switchTab('add');
    
    // Populate form
    document.getElementById('kikuryaWord').value = word.kikurya;
    document.getElementById('alternativeSpellings').value = word.alternativeSpellings.join(', ');
    document.getElementById('swahiliWord').value = word.swahili;
    document.getElementById('englishWord').value = word.english;
    document.getElementById('swahiliExplanation').value = word.explanationSw;
    document.getElementById('englishExplanation').value = word.explanationEn;
    document.getElementById('swahiliExample').value = word.exampleSw;
    document.getElementById('englishExample').value = word.exampleEn;
    document.getElementById('category').value = word.category;
    document.getElementById('level').value = word.level;
    
    // TODO: Store the word ID to update instead of creating new
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
    
    // Update count
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
    const categoryLabel = getCategoryLabel(word.category);
    
    return `
        <div class="word-card" data-id="${word.id}">
            <div class="word-status status-${word.status}">${word.status}</div>
            <div class="word-kikurya">${word.kikurya}</div>
            <div class="word-translation">${translation}</div>
            <div class="word-meta">
                <span class="meta-tag">${categoryLabel}</span>
                <span class="meta-tag">${word.level}</span>
            </div>
            ${explanation ? `<div class="word-explanation">${explanation}</div>` : ''}
            ${example ? `<div class="word-example">"${example}"</div>` : ''}
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
        text += `${word.kikurya} - ${translation}\n`;
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
    
    let csv = 'Kikurya,Swahili,English,Category,Level\n';
    
    data.forEach(word => {
        csv += `"${word.kikurya}","${word.swahili}","${word.english}","${word.category}","${word.level}"\n`;
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
        data: dictionaryData
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
                        saveDictionaryData();
                        renderSearchResults();
                        updateStatistics();
                        
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
        // TODO: Implement audio playback
        alert('Audio playback will be implemented');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Make functions available globally for onclick handlers
window.playAudio = playAudio;
window.editWord = editWord;
window.handleApprove = handleApprove;
window.handleReject = handleReject;
