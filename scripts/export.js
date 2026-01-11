// ============================================
// EXPORT.JS - Data export functionality
// ============================================

let exportHistory = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setupFilters();
    setupExportButtons();
    loadExportHistory();
    updateExportPreview();
});

// Listen for language changes
window.addEventListener('languageChanged', function(e) {
    updateExportPreview();
    loadExportHistory();
});

// ============================================
// FILTERS SETUP
// ============================================

function setupFilters() {
    const categoryFilter = document.getElementById('exportCategoryFilter');
    const levelFilter = document.getElementById('exportLevelFilter');
    const statusFilter = document.getElementById('exportStatusFilter');
    
    if (categoryFilter) {
        populateCategorySelect(categoryFilter, true);
        categoryFilter.addEventListener('change', updateExportPreview);
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', updateExportPreview);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', updateExportPreview);
    }
}

// ============================================
// EXPORT BUTTONS SETUP
// ============================================

function setupExportButtons() {
    const simpleListBtn = document.getElementById('exportSimpleList');
    const jsonBtn = document.getElementById('exportJSON');
    const csvBtn = document.getElementById('exportCSV');
    const ankiBtn = document.getElementById('exportAnki');
    const pdfBtn = document.getElementById('exportPDF');
    
    if (simpleListBtn) simpleListBtn.addEventListener('click', exportSimpleList);
    if (jsonBtn) jsonBtn.addEventListener('click', exportJSON);
    if (csvBtn) csvBtn.addEventListener('click', exportCSV);
    if (ankiBtn) ankiBtn.addEventListener('click', exportAnki);
    if (pdfBtn) pdfBtn.addEventListener('click', exportPDF);
}

// ============================================
// UPDATE PREVIEW
// ============================================

function updateExportPreview() {
    const data = getFilteredExportData();
    const countElement = document.getElementById('exportCount');
    
    if (countElement) {
        countElement.textContent = data.length;
    }
}

// ============================================
// GET FILTERED DATA
// ============================================

function getFilteredExportData() {
    const dictionaryData = getDictionaryData();
    
    const category = document.getElementById('exportCategoryFilter')?.value || '';
    const level = document.getElementById('exportLevelFilter')?.value || '';
    const status = document.getElementById('exportStatusFilter')?.value || 'verified';
    
    return dictionaryData.filter(word => {
        let matchesStatus = false;
        if (status === 'all') {
            matchesStatus = true;
        } else if (status === 'verified') {
            matchesStatus = word.status === 'verified';
        } else if (status === 'pending') {
            matchesStatus = word.status === 'pending';
        }
        
        const matchesCategory = !category || word.category === category;
        const matchesLevel = !level || word.level === level;
        
        return matchesStatus && matchesCategory && matchesLevel;
    });
}

// ============================================
// EXPORT FORMATS
// ============================================

function exportSimpleList() {
    const data = getFilteredExportData();
    const currentLang = window.currentLang || 'en';
    const currentUserLang = window.currentUserLang || 'en';
    const verbSettings = getVerbSettings();
    
    if (data.length === 0) {
        alert(currentLang === 'en' ? 'No words to export' : 'Hakuna maneno ya kupakua');
        return;
    }
    
    let text = currentLang === 'en'
        ? 'KIKURYA - ENGLISH DICTIONARY\n\n'
        : 'KAMUSI YA KIKURYA - KISWAHILI\n\n';
    
    text += `Exported: ${new Date().toLocaleDateString()}\n`;
    text += `Total words: ${data.length}\n\n`;
    text += '='.repeat(50) + '\n\n';
    
    data.forEach((word, index) => {
        const translation = currentUserLang === 'en' ? word.english : word.swahili;
        
        text += `${index + 1}. ${word.kikurya}`;
        if (word.transcription) text += ` [${word.transcription}]`;
        text += ` - ${translation}\n`;
        
        if (word.category === 'verbs' && word.conjugations) {
            verbSettings.tenses.forEach(tense => {
                if (word.conjugations[tense.id]) {
                    text += `   ${tense[currentLang]}: `;
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
    
    const filename = `kikurya-dictionary-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(filename, text);
    
    addToExportHistory('Simple List (TXT)', data.length);
}

function exportJSON() {
    const data = getFilteredExportData();
    const currentLang = window.currentLang || 'en';
    
    if (data.length === 0) {
        alert(currentLang === 'en' ? 'No words to export' : 'Hakuna maneno ya kupakua');
        return;
    }
    
    const exportData = {
        version: '1.0',
        language: 'kikurya',
        exportDate: new Date().toISOString(),
        totalWords: data.length,
        data: data
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const filename = `kikurya-dictionary-${new Date().toISOString().split('T')[0]}.json`;
    
    downloadFile(filename, json);
    
    addToExportHistory('Complete Data (JSON)', data.length);
}

function exportCSV() {
    const data = getFilteredExportData();
    const currentLang = window.currentLang || 'en';
    
    if (data.length === 0) {
        alert(currentLang === 'en' ? 'No words to export' : 'Hakuna maneno ya kupakua');
        return;
    }
    
    let csv = 'Kikurya,Transcription,Alternative Spellings,Swahili,English,Category,Level,Status\n';
    
    data.forEach(word => {
        const altSpellings = (word.alternativeSpellings || []).join('; ');
        csv += `"${word.kikurya}","${word.transcription || ''}","${altSpellings}","${word.swahili}","${word.english}","${word.category}","${word.level}","${word.status}"\n`;
    });
    
    const filename = `kikurya-dictionary-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(filename, csv);
    
    addToExportHistory('Spreadsheet (CSV)', data.length);
}

function exportAnki() {
    const data = getFilteredExportData();
    const currentLang = window.currentLang || 'en';
    const currentUserLang = window.currentUserLang || 'en';
    
    if (data.length === 0) {
        alert(currentLang === 'en' ? 'No words to export' : 'Hakuna maneno ya kupakua');
        return;
    }
    
    // Anki format: Front; Back; Tags
    let anki = '';
    
    data.forEach(word => {
        const translation = currentUserLang === 'en' ? word.english : word.swahili;
        const front = word.kikurya + (word.transcription ? ` [${word.transcription}]` : '');
        const back = translation;
        const tags = `kikurya ${word.category} ${word.level}`;
        
        anki += `${front};${back};${tags}\n`;
    });
    
    const filename = `kikurya-anki-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(filename, anki);
    
    addToExportHistory('Anki Flashcards', data.length);
}

function exportPDF() {
    const currentLang = window.currentLang || 'en';
    alert(currentLang === 'en' 
        ? 'PDF export will be implemented soon'
        : 'Upakuaji wa PDF utatekelezwa hivi karibuni');
    
    // TODO: Implement PDF export using jsPDF or similar library
}

// ============================================
// EXPORT HISTORY
// ============================================

function addToExportHistory(format, wordCount) {
    const currentLang = window.currentLang || 'en';
    
    const entry = {
        format: format,
        wordCount: wordCount,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    exportHistory.unshift(entry);
    
    // Keep only last 10 exports
    if (exportHistory.length > 10) {
        exportHistory = exportHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('lughahai_export_history', JSON.stringify(exportHistory));
    
    loadExportHistory();
    
    const message = currentLang === 'en' 
        ? `Successfully exported ${wordCount} words!`
        : `Imefanikiwa kupakua maneno ${wordCount}!`;
    
    showExportToast(message);
}

function loadExportHistory() {
    const currentLang = window.currentLang || 'en';
    
    // Load from localStorage
    const saved = localStorage.getItem('lughahai_export_history');
    if (saved) {
        exportHistory = JSON.parse(saved);
    }
    
    const container = document.getElementById('exportHistory');
    if (!container) return;
    
    if (exportHistory.length === 0) {
        container.innerHTML = `<p class="no-results">${currentLang === 'en' ? 'No exports yet' : 'Hakuna upakuaji bado'}</p>`;
        return;
    }
    
    const html = exportHistory.map(entry => {
        const date = new Date(entry.date);
        return `
            <div class="history-item">
                <div class="history-info">
                    <strong>${entry.format}</strong>
                    <span>${entry.wordCount} ${currentLang === 'en' ? 'words' : 'maneno'}</span>
                </div>
                <div class="history-date">
                    ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showExportToast(message) {
    const toast = document.createElement('div');
    toast.className = 'export-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4a7c2c;
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--cream);
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border: 1px solid var(--border);
    }
    
    .history-info {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    
    .history-info strong {
        color: var(--leaf-green);
    }
    
    .history-info span {
        font-size: 0.9rem;
        color: var(--text-light);
    }
    
    .history-date {
        font-size: 0.85rem;
        color: var(--text-light);
    }
`;
document.head.appendChild(style);
