// ============================================
// ADD-WORD.JS - Word adding and editing
// ============================================

let editingWordId = null;
let examplesCount = 0;

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
                showExamplesSection();
            } else {
                hideConjugationForm();
                hideExamplesSection();
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
// EXAMPLE SENTENCES MANAGEMENT
// ============================================

function showExamplesSection() {
    const section = document.getElementById('examplesSection');
    if (section) {
        section.style.display = 'block';
        // Add first infinitive example automatically if none exist
        if (examplesCount === 0) {
            addExampleSentence(true); // true = infinitive
        }
    }
}

function hideExamplesSection() {
    const section = document.getElementById('examplesSection');
    if (section) {
        section.style.display = 'none';
        // Clear examples
        document.getElementById('examplesList').innerHTML = '';
        examplesCount = 0;
    }
}

function addExampleSentence(isInfinitive = false) {
    const currentLang = window.currentLang || 'en';
    const exampleId = 'example_' + Date.now();
    examplesCount++;
    
    const typeLabel = isInfinitive 
        ? (currentLang === 'en' ? '1. INFINITIVE (Required)' : '1. INFINITIVE (Inahitajika)')
        : (currentLang === 'en' ? `${examplesCount}. Example` : `${examplesCount}. Mfano`);
    
    const html = `
        <div class="example-sentence-form" id="${exampleId}" data-is-infinitive="${isInfinitive}">
            <div class="example-header">
                <h4>${typeLabel}</h4>
                ${!isInfinitive ? `<button type="button" class="btn btn-reject btn-sm" onclick="removeExample('${exampleId}')">✗ ${currentLang === 'en' ? 'Remove' : 'Ondoa'}</button>` : ''}
            </div>
            
            <div class="form-group">
                <label data-en="Kikurya Sentence:" data-sw="Sentensi ya Kikurya:">Kikurya Sentence:</label>
                <input type="text" class="example-kikurya" placeholder="${isInfinitive ? 'Ndatúna kurāghera' : 'Uni ndarāghire inyama'}" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label data-en="Swahili Translation:" data-sw="Tafsiri ya Kiswahili:">Swahili Translation:</label>
                    <input type="text" class="example-swahili" placeholder="${isInfinitive ? 'Ninataka kula' : 'Mimi nilikula nyama'}" required>
                </div>
                <div class="form-group">
                    <label data-en="English Translation:" data-sw="Tafsiri ya Kiingereza:">English Translation:</label>
                    <input type="text" class="example-english" placeholder="${isInfinitive ? 'I want to eat' : 'I ate meat'}" required>
                </div>
            </div>
            
            <div class="word-by-word-section">
                <label data-en="Word-by-Word Translation:" data-sw="Tafsiri Neno kwa Neno:">Word-by-Word Translation:</label>
                <div class="words-list" id="${exampleId}_words">
                    <!-- Words will be added here -->
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="addWordTranslation('${exampleId}')">
                    + <span data-en="Add Word" data-sw="Ongeza Neno">Add Word</span>
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('examplesList').insertAdjacentHTML('beforeend', html);
    
    // Add first word translation automatically
    addWordTranslation(exampleId);
}

function removeExample(exampleId) {
    const currentLang = window.currentLang || 'en';
    const confirmText = currentLang === 'en' 
        ? 'Remove this example?'
        : 'Ondoa mfano huu?';
    
    if (confirm(confirmText)) {
        const element = document.getElementById(exampleId);
        if (element) {
            element.remove();
            examplesCount--;
        }
    }
}

function addWordTranslation(exampleId) {
    const wordId = exampleId + '_word_' + Date.now();
    
    const html = `
        <div class="word-translation-item" id="${wordId}">
            <input type="text" placeholder="Kikurya" class="word-kikurya">
            <span>→</span>
            <input type="text" placeholder="Swahili" class="word-swahili">
            <span>→</span>
            <input type="text" placeholder="English" class="word-english">
            <button type="button" class="btn btn-reject btn-sm" onclick="removeWord('${wordId}')">✗</button>
        </div>
    `;
    
    document.getElementById(exampleId + '_words').insertAdjacentHTML('beforeend', html);
}

function removeWord(wordId) {
    const element = document.getElementById(wordId);
    if (element) {
        element.remove();
    }
}

function collectExamples() {
    const examples = [];
    const exampleForms = document.querySelectorAll('.example-sentence-form');
    
    exampleForms.forEach((form, index) => {
        const exampleId = form.id;
        const isInfinitive = form.dataset.isInfinitive === 'true';
        
        const kikurya = form.querySelector('.example-kikurya').value.trim();
        const swahili = form.querySelector('.example-swahili').value.trim();
        const english = form.querySelector('.example-english').value.trim();
        
        // Collect word-by-word translations
        const words = [];
        const wordItems = form.querySelectorAll('.word-translation-item');
        wordItems.forEach(item => {
            const kikuryaWord = item.querySelector('.word-kikurya').value.trim();
            const swahiliWord = item.querySelector('.word-swahili').value.trim();
            const englishWord = item.querySelector('.word-english').value.trim();
            
            if (kikuryaWord && swahiliWord && englishWord) {
                words.push({
                    kikurya: kikuryaWord,
                    swahili: swahiliWord,
                    english: englishWord
                });
            }
        });
        
        if (kikurya && swahili && english && words.length > 0) {
            examples.push({
                kikurya: kikurya,
                swahili: swahili,
                english: english,
                type: isInfinitive ? 'infinitive' : 'conjugated',
                words: words
            });
        }
    });
    
    return examples;
}

function validateExamples(examples) {
    const currentLang = window.currentLang || 'en';
    
    // Must have at least 3 examples
    if (examples.length < 3) {
        alert(currentLang === 'en' 
            ? 'Verbs require at least 3 example sentences!'
            : 'Vitenzi vinahitaji angalau mifano 3 ya sentensi!');
        return false;
    }
    
    // First must be infinitive
    if (examples[0].type !== 'infinitive') {
        alert(currentLang === 'en'
            ? 'First example must be infinitive form!'
            : 'Mfano wa kwanza lazima uwe infinitive!');
        return false;
    }
    
    // All examples must have word-by-word translations
    for (let i = 0; i < examples.length; i++) {
        if (examples[i].words.length === 0) {
            alert(currentLang === 'en'
                ? `Example ${i + 1} is missing word-by-word translations!`
                : `Mfano ${i + 1} hauna tafsiri neno kwa neno!`);
            return false;
        }
    }
    
    return true;
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
        category: document.getElementById('category').value,
        level: document.getElementById('level').value,
        audioFile: null // TODO: Handle file upload later
    };
    
    // Get examples if verb
    if (formData.category === 'verbs') {
        const examples = collectExamples();
        
        // Validate examples
        if (!validateExamples(examples)) {
            return; // Stop submission
        }
        
        formData.examples = examples;
        
        // Get conjugations
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
    hideExamplesSection();
    editingWordId = null;
    examplesCount = 0;
    
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
    document.getElementById('category').value = word.category;
    document.getElementById('level').value = word.level;
    
    // Fill examples if verb
    if (word.category === 'verbs' && word.examples && word.examples.length > 0) {
        showExamplesSection();
        
        // Clear existing examples
        document.getElementById('examplesList').innerHTML = '';
        examplesCount = 0;
        
        // Add examples from word
        word.examples.forEach((example, index) => {
            const isInfinitive = example.type === 'infinitive';
            addExampleSentence(isInfinitive);
            
            const exampleForm = document.querySelectorAll('.example-sentence-form')[index];
            if (exampleForm) {
                exampleForm.querySelector('.example-kikurya').value = example.kikurya;
                exampleForm.querySelector('.example-swahili').value = example.swahili;
                exampleForm.querySelector('.example-english').value = example.english;
                
                // Clear auto-added word translation
                const wordsContainer = exampleForm.querySelector('.words-list');
                wordsContainer.innerHTML = '';
                
                // Add word translations
                example.words.forEach(word => {
                    const exampleId = exampleForm.id;
                    addWordTranslation(exampleId);
                    
                    const wordItems = wordsContainer.querySelectorAll('.word-translation-item');
                    const lastItem = wordItems[wordItems.length - 1];
                    lastItem.querySelector('.word-kikurya').value = word.kikurya;
                    lastItem.querySelector('.word-swahili').value = word.swahili;
                    lastItem.querySelector('.word-english').value = word.english;
                });
            }
        });
    }
    
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
window.addExampleSentence = addExampleSentence;
window.removeExample = removeExample;
window.addWordTranslation = addWordTranslation;
window.removeWord = removeWord;
