// ============================================
// COMMON.JS - Shared functions for all pages
// ============================================

// Global state
let currentLang = 'en'; // Interface language (en/sw)
let currentUserLang = 'en'; // Dictionary translation language (en/sw)
let userRoles = ['viewer']; // Current user roles
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
    
    // Setup common UI elements
    setupLanguageSwitcher();
    updateInterfaceLanguage();
    updateUserRoleDisplay();
    showNavByRole();
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

function getDictionaryData() {
    return dictionaryData;
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

function getCategories() {
    return categories;
}

function loadVerbSettings() {
    const saved = localStorage.getItem('lughahai_verb_settings');
    if (saved) {
        verbSettings = JSON.parse(saved);
    } else {
        // Default verb settings for Kikurya
        verbSettings = {
            pronouns: [
                { id: 'p1', kikurya: 'Uni', sw: 'mimi', en: 'I' },
                { id: 'p2', kikurya: 'Uwe', sw: 'wewe', en: 'you (sg)' },
                { id: 'p3', kikurya: 'Uura', sw: 'yeye', en: 'he/she' },
                { id: 'p4', kikurya: 'Bheito', sw: 'sisi', en: 'we' },
                { id: 'p5', kikurya: 'BheinyU', sw: 'ninyi', en: 'you (pl)' },
                { id: 'p6', kikurya: 'Bhabho', sw: 'wao', en: 'they' }
            ],
            tenses: [
                { id: 'present_simple', kikurya: 'present', sw: 'wakati uliopo rahisi', en: 'present simple' },
                { id: 'present_continuous', kikurya: 'present cont', sw: 'wakati uliopo unaoendelea', en: 'present continuous' },
                { id: 'past_simple', kikurya: 'past', sw: 'wakati uliopita rahisi', en: 'past simple' },
                { id: 'past_continuous', kikurya: 'past cont', sw: 'wakati uliopita unaoendelea', en: 'past continuous' },
                { id: 'present_perfect', kikurya: 'present perfect', sw: 'wakati uliopo kamili', en: 'present perfect' },
                { id: 'future_simple', kikurya: 'future', sw: 'wakati ujao rahisi', en: 'future simple' },
                { id: 'future_continuous', kikurya: 'future cont', sw: 'wakati ujao unaoendelea', en: 'future continuous' }
            ]
        };
        saveVerbSettings();
    }
}

function saveVerbSettings() {
    localStorage.setItem('lughahai_verb_settings', JSON.stringify(verbSettings));
}

function getVerbSettings() {
    return verbSettings;
}

function loadUserRoles() {
    const saved = localStorage.getItem('lughahai_dev_roles');
    if (saved) {
        userRoles = JSON.parse(saved);
    } else {
        userRoles = ['viewer'];
    }
    // Viewer always enabled
    if (!userRoles.includes('viewer')) {
        userRoles.push('viewer');
    }
}

function saveUserRoles() {
    localStorage.setItem('lughahai_dev_roles', JSON.stringify(userRoles));
}

function getUserRoles() {
    return userRoles;
}

// ============================================
// WORD OPERATIONS (CRUD)
// ============================================

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

function getWordById(id) {
    return dictionaryData.find(w => w.id === id);
}

function approveWord(id) {
    return updateWord(id, { status: 'verified' });
}

function rejectWord(id) {
    return updateWord(id, { status: 'rejected' });
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
    
    // Trigger custom event for page-specific updates
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
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

function getCurrentLang() {
    return currentLang;
}

function getCurrentUserLang() {
    return currentUserLang;
}

// ============================================
// ROLE MANAGEMENT
// ============================================

function updateUserRoleDisplay() {
    const roleElement = document.getElementById('currentRole');
    if (roleElement) {
        roleElement.textContent = userRoles.map(role => 
            role.charAt(0).toUpperCase() + role.slice(1)
        ).join(', ');
    }
}

function showNavByRole() {
    const navLinks = document.querySelectorAll('.nav-link[data-roles]');
    navLinks.forEach(link => {
        const requiredRoles = link.dataset.roles.split(',');
        const hasRole = requiredRoles.some(role => userRoles.includes(role));
        link.style.display = hasRole ? '' : 'none';
    });
}

function hasRole(role) {
    return userRoles.includes(role);
}

// ============================================
// CATEGORY HELPERS
// ============================================

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name[currentLang] : categoryId;
}

function populateCategorySelect(selectElement, includeAllOption = false) {
    if (!selectElement) return;
    
    let html = '';
    
    if (includeAllOption) {
        html = `<option value="">${currentLang === 'en' ? 'All Categories' : 'Kategoria Zote'}</option>`;
    } else {
        html = `<option value="">${currentLang === 'en' ? 'Select category' : 'Chagua kategoria'}</option>`;
    }
    
    categories.forEach(cat => {
        html += `<option value="${cat.id}">${cat.name[currentLang]}</option>`;
    });
    
    selectElement.innerHTML = html;
}

// ============================================
// WORD CARD RENDERING
// ============================================

function createWordCard(word, options = {}) {
    const translation = currentUserLang === 'en' ? word.english : word.swahili;
    const explanation = currentUserLang === 'en' ? word.explanationEn : word.explanationSw;
    const example = currentUserLang === 'en' ? word.exampleEn : word.exampleSw;
    
    const categoryLabel = getCategoryName(word.category);
    
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
    
    const showActions = options.showActions !== false && (userRoles.includes('editor') || userRoles.includes('admin'));
    const showStatus = options.showStatus !== false;
    
    return `
        <div class="word-card" data-id="${word.id}">
            ${showStatus ? `<div class="word-status status-${word.status}">${word.status}</div>` : ''}
            <div class="word-kikurya">${word.kikurya}</div>
            ${word.transcription ? `<div class="word-transcription">[${word.transcription}]</div>` : ''}
            ${word.alternativeSpellings && word.alternativeSpellings.length > 0 ? 
                `<div class="word-alt-spellings"><small>${currentLang === 'en' ? 'Also:' : 'Pia:'} ${word.alternativeSpellings.join(', ')}</small></div>` : ''}
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
            ${showActions ? `
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
// AUDIO PLAYBACK
// ============================================

function playAudio(wordId) {
    const word = dictionaryData.find(w => w.id === wordId);
    if (word && word.audioFile) {
        alert('Audio playback will be implemented');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
// EXPOSE GLOBAL FUNCTIONS
// ============================================

window.currentLang = currentLang;
window.playAudio = playAudio;
window.getCategoryName = getCategoryName;
window.createWordCard = createWordCard;
window.getDictionaryData = getDictionaryData;
window.getCategories = getCategories;
window.getVerbSettings = getVerbSettings;
window.getUserRoles = getUserRoles;
window.hasRole = hasRole;
window.addWord = addWord;
window.updateWord = updateWord;
window.deleteWord = deleteWord;
window.getWordById = getWordById;
window.approveWord = approveWord;
window.rejectWord = rejectWord;
window.downloadFile = downloadFile;
window.populateCategorySelect = populateCategorySelect;
