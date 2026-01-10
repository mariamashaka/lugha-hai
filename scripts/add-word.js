// ============================================
// ADD-WORD.JS - Word adding and editing
// ============================================

let editingWordId = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setupWordForm();
    setupCategoryListener();
    setupFilters();
    loadRecentWords();
    populateAllCategorySelects();
});

// Listen for language changes
window.addEventListener('languageChanged', function(e) {
    populateAllCategorySelects();
    loadRecentWords();
});

// ============================================
// FORM SETUP
// ============================================

function setupWordForm() {
    const wordForm = document.getElementById('wordForm');
    const clearBtn = document.getElementById('clearForm');
    
    if (wordForm) {
        wordForm.addEventListener('submit', handleWordSubmit);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
}

function setupCategoryListener() {
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            if (this.value === 'verbs') {
                showConjugationForm();
            } else {
                hideConjugationForm();
            }
        });
    }
}

function setupFilters() {
    const filterCategory = document.getElementById('filterCategory');
    const filterLevel = document.getElementById('filterLevel');
    const searchWords = document.getElementById('searchWords');
    
    if (filterCategory) {
        filterCategory.addEventListener('change', loadRecentWords);
    }
    
    if (filterLevel) {
        filterLevel.addEventListener('change', loadRecentWords);
    }
    
    if (searchWords) {
        searchWords.addEventListener('input', loadRecentWords);
    }
}

// ============================================
// POPULATE CATEGORY SELECTS
// ============================================

function populateAllCategorySelects() {
    const categorySelect = document.getElementById('category');
    const filterCategorySelect = document.getElementById('filterCategory');
    
    if (categorySelect) {
        populateCategorySelect(categorySelect, false);
    }
    
    if (filterCategorySelect) {
        populateCategorySelect(filterCategorySelect, true);
    }
}

// ============================================
// CONJUGATION FORM
// ============================================

function showConjugationForm() {
    let container = document.getElementById('conjugationForm');
    
    // Create container if doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'conjugationForm';
        container.className = 'conjugation-form';
        
        const formActions = document.querySelector('.form-actions');
        formActions.parentNode.insertBefore(container, formActions);
    }
    
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
    let html = '<h3>' + (currentLang === 'en' ? 'Verb Conjugations' : 'Matumizi ya Kitenzi') + '</h3>';
    html += '<p class="help-text">' + (currentLang === 'en' 
        ? 'Fill in conjugations for all tenses and pronouns' 
        : 'Jaza matumizi kwa nyakati zote na viwakilishi vyote') + '</p>';
    
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

// ============================================
// FORM SUBMISSION
// ============================================

function handleWordSubmit(e) {
    e.preventDefault();
    
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
    
    // Get conjugations if verb
    if (formData.category === 'verbs') {
        const conjugations = {};
        const verbSettings = getVerbSettings();
        
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
    
    const currentLang = window.currentLang || 'en';
    
    if (editingWordId) {
        // Update existing word
        updateWord(editingWordId, formData);
        const message = currentLang === 'en'
            ? `Word "${formData.kikurya}" updated successfully!`
            : `Neno "${formData.kikurya}" limesasishwa!`;
        alert(message);
        editingWordId = null;
    } else {
        // Add new word
        const newWord = addWord(formData);
        const message = currentLang === 'en'
            ? `Word "${formData.kikurya}" added successfully! Status: ${newWord.status}`
            : `Neno "${formData.kikurya}" limeongezwa! Hali: ${newWord.status}`;
        alert(message);
    }
    
    clearForm();
    loadRecentWords();
}

function clearForm() {
    document.getElementById('wordForm').reset();
    hideConjugationForm();
    editingWordId = null;
    
    // Update button text
    const submitBtn = document.querySelector('#wordForm button[type="submit"]');
    const currentLang = window.currentLang || 'en';
    if (submitBtn) {
        submitBtn.textContent = currentLang === 'en' ? 'Add Word' : 'Ongeza Neno';
    }
}

// ============================================
// LOAD RECENT WORDS
// ============================================

function loadRecentWords() {
    const dictionaryData = getDictionaryData();
    const currentLang = window.currentLang || 'en';
    
    // Get filter values
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const levelFilter = document.getElementById('filterLevel')?.value || '';
    const searchTerm = document.getElementById('searchWords')?.value.toLowerCase() || '';
    
    // Filter words
    let filtered = dictionaryData.filter(word => {
        const matchesCategory = !categoryFilter || word.category === categoryFilter;
        const matchesLevel = !levelFilter || word.level === levelFilter;
        const matchesSearch = !searchTerm || 
            word.kikurya.toLowerCase().includes(searchTerm) ||
            word.swahili.toLowerCase().includes(searchTerm) ||
            word.english.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesLevel && matchesSearch;
    });
    
    // Sort by most recent
    filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    
    // Limit to 20 most recent
    filtered = filtered.slice(0, 20);
    
    const container = document.getElementById('wordsList');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="no-results">${currentLang === 'en' ? 'No words found' : 'Hakuna maneno'}</p>`;
        return;
    }
    
    container.innerHTML = filtered.map(word => createWordCardForEdit(word)).join('');
}

function createWordCardForEdit(word) {
    const currentLang = window.currentLang || 'en';
    const currentUserLang = window.currentUserLang || 'en';
    
    const translation = currentUserLang === 'en' ? word.english : word.swahili;
    const categoryLabel = getCategoryName(word.category);
    
    return `
        <div class="word-card" data-id="${word.id}">
            <div class="word-status status-${word.status}">${word.status}</div>
            <div class="word-kikurya">${word.kikurya}</div>
            ${word.transcription ? `<div class="word-transcription">[${word.transcription}]</div>` : ''}
            <div class="word-translation">${translation}</div>
            <div class="word-meta">
                <span class="meta-tag">${categoryLabel}</span>
                <span class="meta-tag">${word.level}</span>
            </div>
            <div class="word-actions">
                <button class="btn btn-edit" onclick="editWordFromList('${word.id}')">
                    ${currentLang === 'en' ? 'Edit' : 'Hariri'}
                </button>
                <button class="btn btn-reject" onclick="deleteWordFromList('${word.id}')">
                    ${currentLang === 'en' ? 'Delete' : 'Futa'}
                </button>
            </div>
        </div>
    `;
}

// ============================================
// EDIT WORD
// ============================================

function editWordFromList(id) {
    const word = getWordById(id);
    if (!word) return;
    
    const currentLang = window.currentLang || 'en';
    editingWordId = id;
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Fill form
    document.getElementById('kikuryaWord').value = word.kikurya;
    document.getElementById('transcription').value = word.transcription || '';
    document.getElementById('alternativeSpellings').value = (word.alternativeSpellings || []).join(', ');
    document.getElementById('swahiliWord').value = word.swahili;
    document.getElementById('englishWord').value = word.english;
    document.getElementById('swahiliExplanation').value = word.explanationSw || '';
    document.getElementById('englishExplanation').value = word.explanationEn || '';
    document.getElementById('swahiliExample').value = word.exampleSw || '';
    document.getElementById('englishExample').value = word.exampleEn || '';
    document.getElementById('category').value = word.category;
    document.getElementById('level').value = word.level;
    
    // Fill conjugations if verb
    if (word.category === 'verbs' && word.conjugations) {
        showConjugationForm();
        
        const verbSettings = getVerbSettings();
        verbSettings.tenses.forEach(tense => {
            verbSettings.pronouns.forEach(pronoun => {
                const input = document.getElementById(`conj_${tense.id}_${pronoun.id}`);
                if (input && word.conjugations[tense.id] && word.conjugations[tense.id][pronoun.id]) {
                    input.value = word.conjugations[tense.id][pronoun.id];
                }
            });
        });
    }
    
    // Update submit button text
    const submitBtn = document.querySelector('#wordForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = currentLang === 'en' ? 'Update Word' : 'Sasisha Neno';
    }
}

function deleteWordFromList(id) {
    const currentLang = window.currentLang || 'en';
    const confirmText = currentLang === 'en' 
        ? 'Are you sure you want to delete this word?'
        : 'Una uhakika unataka kufuta neno hili?';
    
    if (confirm(confirmText)) {
        deleteWord(id);
        loadRecentWords();
        
        const message = currentLang === 'en' ? 'Word deleted' : 'Neno limefutwa';
        alert(message);
    }
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.editWordFromList = editWordFromList;
window.deleteWordFromList = deleteWordFromList;
