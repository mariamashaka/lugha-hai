// ============================================
// TRAINING.JS - Verb Conjugation Trainer
// ============================================

// Global state
let currentLang = 'en';
let selectedVerbs = [];
let selectedTenses = [];
let selectedPronouns = [];
let exerciseCount = 20;
let exercises = [];
let currentExerciseIndex = 0;
let correctAnswers = 0;
let userAnswers = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadCommonData();
    initializeTraining();
});

function loadCommonData() {
    // Load from common.js
    currentLang = window.currentLang || 'en';
}

function initializeTraining() {
    // Populate verb counts
    updateVerbCounts();
    
    // Setup event listeners for verb selection
    document.querySelectorAll('input[name="verbOption"]').forEach(radio => {
        radio.addEventListener('change', handleVerbOptionChange);
    });
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function startVerbTrainer() {
    document.getElementById('trainingModules').style.display = 'none';
    document.getElementById('verbTrainer').style.display = 'block';
    document.getElementById('verbSelection').classList.add('active');
    
    // Load available verbs
    loadAvailableVerbs();
}

function backToModules() {
    document.getElementById('trainingModules').style.display = 'block';
    document.getElementById('verbTrainer').style.display = 'none';
    
    // Reset all steps
    document.querySelectorAll('.trainer-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Reset state
    resetTrainingState();
}

function backToVerbSelection() {
    document.getElementById('trainingSettings').classList.remove('active');
    document.getElementById('verbSelection').classList.add('active');
}

function goToSettings() {
    // Validate verb selection
    const verbOption = document.querySelector('input[name="verbOption"]:checked').value;
    
    if (verbOption === 'specific') {
        const checkedVerbs = document.querySelectorAll('.verb-checkbox:checked');
        if (checkedVerbs.length === 0) {
            alert(currentLang === 'en' ? 'Please select at least one verb' : 'Tafadhali chagua kitenzi kimoja angalau');
            return;
        }
        selectedVerbs = Array.from(checkedVerbs).map(cb => cb.value);
    } else {
        // Get all verbs of selected level
        const level = verbOption === 'all_a1' ? 'A1' : 'A2';
        selectedVerbs = getVerbsByLevel(level);
    }
    
    document.getElementById('verbSelection').classList.remove('active');
    document.getElementById('trainingSettings').classList.add('active');
    
    // Populate pronouns list
    populatePronounsList();
}

function startExercises() {
    // Validate settings
    const checkedTenses = document.querySelectorAll('.tense-checkbox:checked:not(#allTenses)');
    if (checkedTenses.length === 0) {
        alert(currentLang === 'en' ? 'Please select at least one tense' : 'Tafadhali chagua wakati mmoja angalau');
        return;
    }
    
    selectedTenses = Array.from(checkedTenses).map(cb => cb.value);
    
    // Get selected pronouns
    const pronounCheckboxes = document.querySelectorAll('.pronoun-checkbox:checked');
    selectedPronouns = Array.from(pronounCheckboxes).map(cb => cb.value);
    
    if (selectedPronouns.length === 0) {
        alert(currentLang === 'en' ? 'Please select at least one pronoun' : 'Tafadhali chagua kiwakilishi kimoja angalau');
        return;
    }
    
    exerciseCount = parseInt(document.getElementById('exerciseCount').value);
    
    // Generate exercises
    generateExercises();
    
    // Start exercises
    document.getElementById('trainingSettings').classList.remove('active');
    document.getElementById('exercises').classList.add('active');
    
    currentExerciseIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
    
    loadExercise(0);
}

function restartTraining() {
    document.getElementById('results').classList.remove('active');
    document.getElementById('verbSelection').classList.add('active');
    resetTrainingState();
}

function resetTrainingState() {
    selectedVerbs = [];
    selectedTenses = [];
    selectedPronouns = [];
    exercises = [];
    currentExerciseIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
}

// ============================================
// VERB SELECTION
// ============================================

function handleVerbOptionChange(e) {
    const specificList = document.getElementById('specificVerbsList');
    if (e.target.value === 'specific') {
        specificList.style.display = 'block';
    } else {
        specificList.style.display = 'none';
    }
}

function loadAvailableVerbs() {
    // Get verbs from dictionary data
    const verbs = getDictionaryData().filter(word => word.category === 'verbs' && word.conjugations);
    
    const verbsChecklist = document.querySelector('.verbs-checklist');
    verbsChecklist.innerHTML = verbs.map(verb => `
        <label class="checkbox-option">
            <input type="checkbox" class="verb-checkbox" value="${verb.id}">
            <span>${verb.kikurya} (${currentLang === 'en' ? verb.english : verb.swahili})</span>
        </label>
    `).join('');
}

function updateVerbCounts() {
    const verbs = getDictionaryData().filter(word => word.category === 'verbs' && word.conjugations);
    const a1Verbs = verbs.filter(v => v.level === 'A1');
    const a2Verbs = verbs.filter(v => v.level === 'A2');
    
    document.getElementById('a1Count').textContent = a1Verbs.length;
    document.getElementById('a2Count').textContent = a2Verbs.length;
}

function getVerbsByLevel(level) {
    const verbs = getDictionaryData().filter(word => 
        word.category === 'verbs' && 
        word.conjugations && 
        word.level === level
    );
    return verbs.map(v => v.id);
}

function getDictionaryData() {
    // Get from localStorage (same as in common.js)
    const saved = localStorage.getItem('lughahai_kikurya');
    return saved ? JSON.parse(saved) : [];
}

function getVerbSettings() {
    const saved = localStorage.getItem('lughahai_verb_settings');
    if (saved) {
        return JSON.parse(saved);
    }
    // Default settings
    return {
        pronouns: [
            { id: 'p1', kikurya: 'Uni', sw: 'mimi', en: 'I' },
            { id: 'p2', kikurya: 'Uwé', sw: 'wewe', en: 'you (sg)' },
            { id: 'p3', kikurya: 'Uurá', sw: 'yeye', en: 'he/she' },
            { id: 'p4', kikurya: 'Bheitó', sw: 'sisi', en: 'we' },
            { id: 'p5', kikurya: 'Bheinyú', sw: 'ninyi', en: 'you (pl)' },
            { id: 'p6', kikurya: 'Bhabhó', sw: 'wao', en: 'they' }
        ],
        tenses: [
            { id: 'past_simple', kikurya: 'Past simple', sw: 'Wakati uliopita rahisi', en: 'Past simple' },
            { id: 'past_continuous', kikurya: 'Past cont', sw: 'Wakati uliopita unaoendelea', en: 'Past continuous' },
            { id: 'present_simple', kikurya: 'Present sim', sw: 'Wakati uliopo rahisi', en: 'Present simple' },
            { id: 'present_continuous', kikurya: 'Present cont', sw: 'Wakati uliopo unaoendelea', en: 'Present continuous' },
            { id: 'present_perfect', kikurya: 'Present perfect', sw: 'Wakati uliopo kamili', en: 'Present perfect' },
            { id: 'future_simple', kikurya: 'Future simple', sw: 'Wakati ujao rahisi', en: 'Future simple' },
            { id: 'future_continuous', kikurya: 'Future continuous', sw: 'Wakati ujao unaoendelea', en: 'Future continuous' }
        ]
    };
}
