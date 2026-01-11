// ============================================
// REVIEW.JS - Word moderation
// ============================================

let selectedWords = new Set();

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setupFilters();
    renderReviewWords();
    setupBulkActions();
});

// Listen for language changes
window.addEventListener('languageChanged', function(e) {
    renderReviewWords();
});

// ============================================
// FILTERS SETUP
// ============================================

function setupFilters() {
    const categoryFilter = document.getElementById('reviewCategoryFilter');
    const levelFilter = document.getElementById('reviewLevelFilter');
    const sortOrder = document.getElementById('sortOrder');
    
    if (categoryFilter) {
        populateCategorySelect(categoryFilter, true);
        categoryFilter.addEventListener('change', renderReviewWords);
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', renderReviewWords);
    }
    
    if (sortOrder) {
        sortOrder.addEventListener('change', renderReviewWords);
    }
}

// ============================================
// RENDER REVIEW WORDS
// ============================================

function renderReviewWords() {
    const dictionaryData = getDictionaryData();
    const currentLang = window.currentLang || 'en';
    
    // Get filter values
    const category = document.getElementById('reviewCategoryFilter')?.value || '';
    const level = document.getElementById('reviewLevelFilter')?.value || '';
    const sortOrder = document.getElementById('sortOrder')?.value || 'newest';
    
    // Filter pending words
    let pending = dictionaryData.filter(word => {
        if (word.status !== 'pending') return false;
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesCategory && matchesLevel;
    });
    
    // Sort
    if (sortOrder === 'newest') {
        pending.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else {
        pending.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
    }
    
    // Update counts
    updateReviewCounts(pending.length);
    
    // Render
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
    const currentLang = window.currentLang || 'en';
    const currentUserLang = window.currentUserLang || 'en';
    const verbSettings = getVerbSettings();
    
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
            <div class="word-header">
                <label class="word-select">
                    <input type="checkbox" class="word-checkbox" value="${word.id}" onchange="toggleWordSelection('${word.id}')">
                </label>
                <div class="word-status status-${word.status}">${word.status}</div>
            </div>
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
            <div class="word-info">
                <small>${currentLang === 'en' ? 'Added by:' : 'Imeongezwa na:'} ${word.author}</small>
                <small>${currentLang === 'en' ? 'Date:' : 'Tarehe:'} ${new Date(word.dateAdded).toLocaleDateString()}</small>
            </div>
            <div class="word-actions">
                <button class="btn btn-approve" onclick="handleApprove('${word.id}')">
                    ✓ ${currentLang === 'en' ? 'Approve' : 'Kubali'}
                </button>
                <button class="btn btn-reject" onclick="handleReject('${word.id}')">
                    ✗ ${currentLang === 'en' ? 'Reject' : 'Kataa'}
                </button>
                <button class="btn btn-edit" onclick="editWordFromReview('${word.id}')">
                    ${currentLang === 'en' ? 'Edit' : 'Hariri'}
                </button>
            </div>
        </div>
    `;
}

// ============================================
// UPDATE COUNTS
// ============================================

function updateReviewCounts(pendingCount) {
    const pendingElement = document.getElementById('pendingCount');
    if (pendingElement) {
        pendingElement.textContent = pendingCount;
    }
    
    // Count approvals/rejections today
    const dictionaryData = getDictionaryData();
    const today = new Date().toDateString();
    
    const approvedToday = dictionaryData.filter(w => 
        w.status === 'verified' && 
        new Date(w.lastModified).toDateString() === today
    ).length;
    
    const rejectedToday = dictionaryData.filter(w => 
        w.status === 'rejected' && 
        new Date(w.lastModified).toDateString() === today
    ).length;
    
    const approvedElement = document.getElementById('approvedToday');
    const rejectedElement = document.getElementById('rejectedToday');
    
    if (approvedElement) approvedElement.textContent = approvedToday;
    if (rejectedElement) rejectedElement.textContent = rejectedToday;
}

// ============================================
// APPROVE / REJECT
// ============================================

function handleApprove(id) {
    const currentLang = window.currentLang || 'en';
    
    approveWord(id);
    renderReviewWords();
    
    const message = currentLang === 'en' ? 'Word approved!' : 'Neno limekubaliwa!';
    showToast(message, 'success');
}

function handleReject(id) {
    const currentLang = window.currentLang || 'en';
    
    const confirmText = currentLang === 'en' 
        ? 'Are you sure you want to reject this word?'
        : 'Una uhakika unataka kukataa neno hili?';
    
    if (confirm(confirmText)) {
        rejectWord(id);
        renderReviewWords();
        
        const message = currentLang === 'en' ? 'Word rejected' : 'Neno limekataliwa';
        showToast(message, 'info');
    }
}

function editWordFromReview(id) {
    // Redirect to add-word page with edit mode
    window.location.href = `add-word.html?edit=${id}`;
}

// ============================================
// BULK ACTIONS
// ============================================

function setupBulkActions() {
    const bulkApprove = document.getElementById('bulkApprove');
    const bulkReject = document.getElementById('bulkReject');
    
    if (bulkApprove) {
        bulkApprove.addEventListener('click', handleBulkApprove);
    }
    
    if (bulkReject) {
        bulkReject.addEventListener('click', handleBulkReject);
    }
}

function toggleWordSelection(id) {
    const checkbox = document.querySelector(`.word-checkbox[value="${id}"]`);
    
    if (checkbox && checkbox.checked) {
        selectedWords.add(id);
    } else {
        selectedWords.delete(id);
    }
    
    updateBulkActionsDisplay();
}

function updateBulkActionsDisplay() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (bulkActions) {
        if (selectedWords.size > 0) {
            bulkActions.style.display = 'flex';
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    if (selectedCount) {
        selectedCount.textContent = selectedWords.size;
    }
}

function handleBulkApprove() {
    const currentLang = window.currentLang || 'en';
    
    if (selectedWords.size === 0) {
        alert(currentLang === 'en' ? 'No words selected' : 'Hakuna maneno yaliyochaguliwa');
        return;
    }
    
    const confirmText = currentLang === 'en'
        ? `Approve ${selectedWords.size} words?`
        : `Kubali maneno ${selectedWords.size}?`;
    
    if (confirm(confirmText)) {
        selectedWords.forEach(id => {
            approveWord(id);
        });
        
        selectedWords.clear();
        renderReviewWords();
        updateBulkActionsDisplay();
        
        const message = currentLang === 'en' ? 'Words approved!' : 'Maneno yamekubaliwa!';
        showToast(message, 'success');
    }
}

function handleBulkReject() {
    const currentLang = window.currentLang || 'en';
    
    if (selectedWords.size === 0) {
        alert(currentLang === 'en' ? 'No words selected' : 'Hakuna maneno yaliyochaguliwa');
        return;
    }
    
    const confirmText = currentLang === 'en'
        ? `Reject ${selectedWords.size} words?`
        : `Kataa maneno ${selectedWords.size}?`;
    
    if (confirm(confirmText)) {
        selectedWords.forEach(id => {
            rejectWord(id);
        });
        
        selectedWords.clear();
        renderReviewWords();
        updateBulkActionsDisplay();
        
        const message = currentLang === 'en' ? 'Words rejected' : 'Maneno yamekataliwa';
        showToast(message, 'info');
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4a7c2c' : '#8b4513'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.handleApprove = handleApprove;
window.handleReject = handleReject;
window.editWordFromReview = editWordFromReview;
window.toggleWordSelection = toggleWordSelection;
