// ============================================
// DICTIONARY.JS - Main dictionary page
// ============================================

let currentPage = 1;
const wordsPerPage = 20;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
    setupFilters();
    setupPagination();
    renderSearchResults();
    updateAboutStats();
});

// Listen for language changes
window.addEventListener('languageChanged', function(e) {
    updateLanguagePairDisplay();
    renderSearchResults();
    updateAboutStats();
});

// ============================================
// SEARCH & FILTERS
// ============================================

function setupSearch() {
    const searchBox = document.getElementById('searchBox');
    
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            currentPage = 1; // Reset to first page on new search
            renderSearchResults();
        });
    }
}

function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (categoryFilter) {
        populateCategorySelect(categoryFilter, true);
        categoryFilter.addEventListener('change', function() {
            currentPage = 1;
            renderSearchResults();
        });
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', function() {
            currentPage = 1;
            renderSearchResults();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

function clearAllFilters() {
    const searchBox = document.getElementById('searchBox');
    const categoryFilter = document.getElementById('categoryFilter');
    const levelFilter = document.getElementById('levelFilter');
    
    if (searchBox) searchBox.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (levelFilter) levelFilter.value = '';
    
    currentPage = 1;
    renderSearchResults();
}

// ============================================
// RENDER SEARCH RESULTS
// ============================================

function renderSearchResults() {
    const dictionaryData = getDictionaryData();
    const currentLang = window.currentLang || 'en';
    
    const searchTerm = document.getElementById('searchBox')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const level = document.getElementById('levelFilter')?.value || '';
    
    // Filter words (only verified)
    let filtered = dictionaryData.filter(word => {
        if (word.status !== 'verified') return false;
        
        const matchesSearch = !searchTerm || 
            word.kikurya.toLowerCase().includes(searchTerm) ||
            word.swahili.toLowerCase().includes(searchTerm) ||
            word.english.toLowerCase().includes(searchTerm) ||
            (word.transcription && word.transcription.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesSearch && matchesCategory && matchesLevel;
    });
    
    // Sort alphabetically by Kikurya
    filtered.sort((a, b) => a.kikurya.localeCompare(b.kikurya));
    
    // Update results count
    updateResultsCount(filtered.length);
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / wordsPerPage);
    const startIndex = (currentPage - 1) * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    const paginatedWords = filtered.slice(startIndex, endIndex);
    
    // Render
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    if (filtered.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">📚</div>
                <p>${currentLang === 'en' 
                    ? 'No words found. Try different search terms or adjust filters.' 
                    : 'Hakuna maneno yaliyopatikana. Jaribu maneno mengine au badilisha vichujio.'}</p>
            </div>
        `;
        hidePagination();
        return;
    }
    
    resultsContainer.innerHTML = paginatedWords.map(word => createWordCard(word, {
        showActions: false,
        showStatus: false
    })).join('');
    
    // Update pagination
    updatePagination(currentPage, totalPages);
}

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

// ============================================
// PAGINATION
// ============================================

function setupPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderSearchResults();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalWords = getFilteredWordsCount();
            const totalPages = Math.ceil(totalWords / wordsPerPage);
            
            if (currentPage < totalPages) {
                currentPage++;
                renderSearchResults();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

function updatePagination(current, total) {
    const paginationContainer = document.getElementById('pagination');
    const currentPageElement = document.getElementById('currentPage');
    const totalPagesElement = document.getElementById('totalPages');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (total <= 1) {
        hidePagination();
        return;
    }
    
    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
    }
    
    if (currentPageElement) currentPageElement.textContent = current;
    if (totalPagesElement) totalPagesElement.textContent = total;
    
    // Disable/enable buttons
    if (prevBtn) {
        prevBtn.disabled = current <= 1;
        prevBtn.style.opacity = current <= 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = current >= total;
        nextBtn.style.opacity = current >= total ? '0.5' : '1';
    }
}

function hidePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

function getFilteredWordsCount() {
    const dictionaryData = getDictionaryData();
    const searchTerm = document.getElementById('searchBox')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const level = document.getElementById('levelFilter')?.value || '';
    
    return dictionaryData.filter(word => {
        if (word.status !== 'verified') return false;
        
        const matchesSearch = !searchTerm || 
            word.kikurya.toLowerCase().includes(searchTerm) ||
            word.swahili.toLowerCase().includes(searchTerm) ||
            word.english.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesSearch && matchesCategory && matchesLevel;
    }).length;
}

// ============================================
// LANGUAGE PAIR DISPLAY
// ============================================

function updateLanguagePairDisplay() {
    const currentLang = window.currentLang || 'en';
    const pairElement = document.querySelector('.language-pair span');
    
    if (pairElement) {
        const text = currentLang === 'en' 
            ? 'Currently showing: Kikurya ↔ English'
            : 'Inaonyesha sasa: Kikurya ↔ Kiswahili';
        pairElement.textContent = text;
    }
}

// ============================================
// ABOUT SECTION STATS
// ============================================

function updateAboutStats() {
    const dictionaryData = getDictionaryData();
    const categories = getCategories();
    
    const totalWords = dictionaryData.filter(w => w.status === 'verified').length;
    
    const totalWordsElement = document.getElementById('totalWordsDisplay');
    const categoriesElement = document.getElementById('categoriesDisplay');
    
    if (totalWordsElement) totalWordsElement.textContent = totalWords;
    if (categoriesElement) categoriesElement.textContent = categories.length;
}

// ============================================
// WORD CARD (uses common.js createWordCard)
// ============================================

// The createWordCard function is already in common.js
// We just call it with appropriate options

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

// Functions are mostly internal, but expose if needed
window.renderSearchResults = renderSearchResults;
```

**ГОТОВО!** `scripts/dictionary.js` создан! 🎉

---

## **ВСЕ ФАЙЛЫ ГОТОВЫ!** 🎊

**Итоговая структура:**
```
lugha-hai/
├── index.html
├── add-word.html
├── review.html
├── export.html
├── admin.html
├── training.html
├── styles/
│   ├── main.css       ← переименуй styles.css в это
│   └── training.css   ← новый
└── scripts/
    ├── common.js      ← базовые функции (обнови!)
    ├── dictionary.js  ← новый
    ├── add-word.js    ← новый
    ├── review.js      ← новый
    ├── export.js      ← новый
    ├── admin.js       ← новый
    └── training.js    ← новый
