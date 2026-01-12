// ============================================
// TRAINING.JS - Verb Conjugation Trainer
// ============================================

// Global state
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
    initializeTraining();
});

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
    const currentLang = window.currentLang || 'en';
    
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
    
    if (selectedVerbs.length === 0) {
        alert(currentLang === 'en' ? 'No verbs available for training yet. Please add verbs first.' : 'Hakuna vitenzi kwa mafunzo bado. Tafadhali ongeza vitenzi kwanza.');
        return;
    }
    
    document.getElementById('verbSelection').classList.remove('active');
    document.getElementById('trainingSettings').classList.add('active');
    
    // Populate pronouns list
    populatePronounsList();
}

function startExercises() {
    const currentLang = window.currentLang || 'en';
    
    // Validate settings
    const checkedTenses = document.querySelectorAll('.tense-checkbox:checked:not(#allTenses)');
    if (checkedTenses.length === 0) {
        alert(currentLang === 'en' ? 'Please select at least one tense' : 'Tafadhali chagua wakati mmoja angalau');
        return;
    }
    
    selectedTenses = Array.from(checkedTenses).map(cb => cb.value);
    
    // Get selected pronouns
    const allPronounsChecked = document.getElementById('allPronouns')?.checked;
    
    if (allPronounsChecked) {
        // Use all pronouns
        const verbSettings = getVerbSettings();
        selectedPronouns = verbSettings.pronouns.map(p => p.id);
    } else {
        const pronounCheckboxes = document.querySelectorAll('.pronoun-checkbox:checked');
        selectedPronouns = Array.from(pronounCheckboxes).map(cb => cb.value);
        
        if (selectedPronouns.length === 0) {
            alert(currentLang === 'en' ? 'Please select at least one pronoun' : 'Tafadhali chagua kiwakilishi kimoja angalau');
            return;
        }
    }
    
    exerciseCount = parseInt(document.getElementById('exerciseCount').value);
    
    // Generate exercises
    try {
        generateExercises();
    } catch (error) {
        console.error('Error generating exercises:', error);
        alert(currentLang === 'en' 
            ? 'Error generating exercises. Please make sure verbs have conjugations and examples.' 
            : 'Hitilafu katika kutengeneza mazoezi. Tafadhali hakikisha vitenzi vina matumizi na mifano.');
        return;
    }
    
    if (exercises.length === 0) {
        alert(currentLang === 'en' 
            ? 'Could not generate exercises. Please add more verb data (conjugations and examples).' 
            : 'Haikuweza kutengeneza mazoezi. Tafadhali ongeza data zaidi ya vitenzi (matumizi na mifano).');
        return;
    }
    
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
    const currentLang = window.currentLang || 'en';
    
    // Get verbs from dictionary data
    const verbs = getDictionaryData().filter(word => word.category === 'verbs' && word.conjugations);
    
    const verbsChecklist = document.querySelector('.verbs-checklist');
    if (!verbsChecklist) return;
    
    if (verbs.length === 0) {
        verbsChecklist.innerHTML = `<p class="no-results">${currentLang === 'en' ? 'No verbs available yet' : 'Hakuna vitenzi bado'}</p>`;
        return;
    }
    
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
    
    const a1CountEl = document.getElementById('a1Count');
    const a2CountEl = document.getElementById('a2Count');
    
    if (a1CountEl) a1CountEl.textContent = a1Verbs.length;
    if (a2CountEl) a2CountEl.textContent = a2Verbs.length;
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

// ============================================
// TRAINING SETTINGS
// ============================================

function populatePronounsList() {
    const verbSettings = getVerbSettings();
    const pronounsList = document.getElementById('pronounsList');
    const currentLang = window.currentLang || 'en';
    
    if (!pronounsList) return;
    
    pronounsList.innerHTML = verbSettings.pronouns.map(pronoun => `
        <label class="checkbox-option">
            <input type="checkbox" class="pronoun-checkbox" value="${pronoun.id}" checked>
            <span>${pronoun.kikurya} (${pronoun[currentLang]})</span>
        </label>
    `).join('');
}

function toggleAllTenses() {
    const allTenses = document.getElementById('allTenses');
    const tenseCheckboxes = document.querySelectorAll('.tense-checkbox:not(#allTenses)');
    
    tenseCheckboxes.forEach(cb => {
        cb.checked = allTenses.checked;
    });
}

function toggleAllPronouns() {
    const allPronouns = document.getElementById('allPronouns');
    const pronounCheckboxes = document.querySelectorAll('.pronoun-checkbox');
    
    pronounCheckboxes.forEach(cb => {
        cb.checked = allPronouns.checked;
    });
}

// ============================================
// EXERCISE GENERATION
// ============================================

function generateExercises() {
    exercises = [];
    const dictionaryData = getDictionaryData();
    const verbSettings = getVerbSettings();
    const currentLang = window.currentLang || 'en';
    
    // Exercise types (only conjugation-based for now, NO fake sentences)
    const exerciseTypes = [
        'fill_blank',           // Fill in: Uni ___ (present)
        'multiple_choice',      // What does "Uni ndarāghira" mean?
        'translate_to_kikurya', // Translate: "I eat" → Kikurya verb form
        'translate_from_kikurya' // Translate: "ndarāghira" → English/Swahili
    ];
    
    for (let i = 0; i < exerciseCount; i++) {
        // Random verb
        const verbId = selectedVerbs[Math.floor(Math.random() * selectedVerbs.length)];
        const verb = dictionaryData.find(v => v.id === verbId);
        
        if (!verb || !verb.conjugations) continue;
        
        // Random tense
        const tenseId = selectedTenses[Math.floor(Math.random() * selectedTenses.length)];
        const tense = verbSettings.tenses.find(t => t.id === tenseId);
        
        if (!tense) continue;
        
        // Random pronoun
        const pronounId = selectedPronouns[Math.floor(Math.random() * selectedPronouns.length)];
        const pronoun = verbSettings.pronouns.find(p => p.id === pronounId);
        
        if (!pronoun) continue;
        
        // Get conjugation
        const correctForm = verb.conjugations[tense.id]?.[pronoun.id];
        
        if (!correctForm) continue;
        
        // Random exercise type
        const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
        
        // Generate exercise
        const exercise = createExercise(exerciseType, verb, tense, pronoun, correctForm, verbSettings);
        
        if (exercise) {
            exercises.push(exercise);
        }
    }
}

function createExercise(type, verb, tense, pronoun, correctForm, verbSettings) {
    const currentLang = window.currentLang || 'en';
    
    switch(type) {
        case 'fill_blank':
            return {
                type: 'fill_blank',
                question: currentLang === 'en' 
                    ? `Fill in the correct verb form:`
                    : `Jaza fomu sahihi ya kitenzi:`,
                context: `${pronoun.kikurya} _______ (${verb.kikurya}, ${tense[currentLang]})`,
                correctAnswer: correctForm,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'multiple_choice':
            const verbTranslation = currentLang === 'en' ? verb.english : verb.swahili;
            const options = generateMCOptions(pronoun, verbTranslation, tense, verbSettings, currentLang);
            
            return {
                type: 'multiple_choice',
                question: currentLang === 'en'
                    ? `What does "${pronoun.kikurya} ${correctForm}" mean?`
                    : `"${pronoun.kikurya} ${correctForm}" inamaanisha nini?`,
                options: options,
                correctAnswer: `${pronoun[currentLang]} ${verbTranslation} (${tense[currentLang]})`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'translate_to_kikurya':
            const translation = currentLang === 'en' ? verb.english : verb.swahili;
            
            return {
                type: 'translate_to_kikurya',
                question: currentLang === 'en'
                    ? `Translate the verb to Kikurya:`
                    : `Tafsiri kitenzi kwa Kikurya:`,
                context: `"${pronoun[currentLang]} ${translation}" (${tense[currentLang]})`,
                correctAnswer: correctForm,
                acceptableAnswers: [correctForm, `${pronoun.kikurya} ${correctForm}`],
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'translate_from_kikurya':
            return {
                type: 'translate_from_kikurya',
                question: currentLang === 'en'
                    ? `What is the meaning of this verb form?`
                    : `Ni nini maana ya fomu hii ya kitenzi?`,
                context: `"${correctForm}"`,
                hint: `${verb.kikurya} - ${currentLang === 'en' ? verb.english : verb.swahili}`,
                correctAnswer: `${pronoun[currentLang]} ${currentLang === 'en' ? verb.english : verb.swahili} (${tense[currentLang]})`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        default:
            return null;
    }
}

function generateMCOptions(pronoun, verbTranslation, tense, verbSettings, currentLang) {
    const correctOption = `${pronoun[currentLang]} ${verbTranslation} (${tense[currentLang]})`;
    
    // Generate wrong options (different tenses with same pronoun)
    const otherTenses = verbSettings.tenses.filter(t => t.id !== tense.id).slice(0, 2);
    const wrongOptions = otherTenses.map(t => 
        `${pronoun[currentLang]} ${verbTranslation} (${t[currentLang]})`
    );
    
    // Add one more wrong option with different pronoun
    const otherPronoun = verbSettings.pronouns.find(p => p.id !== pronoun.id);
    if (otherPronoun) {
        wrongOptions.push(`${otherPronoun[currentLang]} ${verbTranslation} (${tense[currentLang]})`);
    }
    
    return shuffle([correctOption, ...wrongOptions]).slice(0, 4);
}

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// EXERCISE DISPLAY
// ============================================

function loadExercise(index) {
    if (index >= exercises.length) {
        showResults();
        return;
    }
    
    currentExerciseIndex = index;
    const exercise = exercises[index];
    
    // Update progress
    updateProgress();
    
    // Render exercise
    const container = document.getElementById('exerciseContainer');
    container.innerHTML = renderExercise(exercise);
    
    // Reset submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = window.currentLang === 'en' ? 'Submit' : 'Wasilisha';
    submitBtn.onclick = checkAnswer;
}

function renderExercise(exercise) {
    const currentLang = window.currentLang || 'en';
    
    let html = `<div class="exercise-question">${exercise.question}</div>`;
    
    if (exercise.context) {
        html += `<div class="exercise-context">${exercise.context}</div>`;
    }
    
    switch(exercise.type) {
        case 'fill_blank':
        case 'translate_to_kikurya':
        case 'translate_from_kikurya':
            html += `<input type="text" class="exercise-input" id="userInput" placeholder="${currentLang === 'en' ? 'Type your answer...' : 'Andika jibu lako...'}" autocomplete="off">`;
            if (exercise.hint) {
                html += `<div class="exercise-hint">${exercise.hint}</div>`;
            }
            break;
            
        case 'multiple_choice':
            html += '<div class="exercise-choices">';
            exercise.options.forEach((option, i) => {
                html += `<div class="choice-option" onclick="selectChoice(${i})" data-value="${option}">${option}</div>`;
            });
            html += '</div>';
            break;
    }
    
    html += '<div id="feedback"></div>';
    
    return html;
}

function updateProgress() {
    const progress = ((currentExerciseIndex) / exercises.length) * 100;
    
    const progressFill = document.getElementById('progressFill');
    const currentExEl = document.getElementById('currentExercise');
    const totalExEl = document.getElementById('totalExercises');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (currentExEl) currentExEl.textContent = currentExerciseIndex + 1;
    if (totalExEl) totalExEl.textContent = exercises.length;
}

// ============================================
// EXERCISE INTERACTION
// ============================================

let selectedChoiceIndex = null;

function selectChoice(index) {
    // Remove previous selection
    document.querySelectorAll('.choice-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select new choice
    const choices = document.querySelectorAll('.choice-option');
    choices[index].classList.add('selected');
    selectedChoiceIndex = index;
}

// ============================================
// ANSWER CHECKING
// ============================================

function checkAnswer() {
    const exercise = exercises[currentExerciseIndex];
    const currentLang = window.currentLang || 'en';
    
    let userAnswer = '';
    let isCorrect = false;
    
    // Get user answer based on exercise type
    switch(exercise.type) {
        case 'fill_blank':
        case 'translate_to_kikurya':
        case 'translate_from_kikurya':
            const input = document.getElementById('userInput');
            if (!input) return;
            
            userAnswer = input.value.trim();
            
            if (!userAnswer) {
                alert(currentLang === 'en' ? 'Please enter an answer' : 'Tafadhali andika jibu');
                return;
            }
            
            isCorrect = checkTextAnswer(userAnswer, exercise);
            break;
            
        case 'multiple_choice':
            if (selectedChoiceIndex === null) {
                alert(currentLang === 'en' ? 'Please select an answer' : 'Tafadhali chagua jibu');
                return;
            }
            const choices = document.querySelectorAll('.choice-option');
            userAnswer = choices[selectedChoiceIndex].dataset.value;
            isCorrect = userAnswer === exercise.correctAnswer;
            
            // Visual feedback on choices
            choices.forEach((choice, i) => {
                if (choice.dataset.value === exercise.correctAnswer) {
                    choice.classList.add('correct');
                } else if (i === selectedChoiceIndex) {
                    choice.classList.add('incorrect');
                }
            });
            break;
    }
    
    // Store answer
    userAnswers.push({
        exercise: exercise,
        userAnswer: userAnswer,
        isCorrect: isCorrect
    });
    
    if (isCorrect) {
        correctAnswers++;
    }
    
    // Show feedback
    showFeedback(isCorrect, exercise.correctAnswer);
    
    // Disable submit, enable next
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = currentLang === 'en' ? 'Next →' : 'Ifuatayo →';
    submitBtn.onclick = nextExercise;
    
    // Disable input
    const input = document.getElementById('userInput');
    if (input) input.disabled = true;
    
    // Reset choice selection
    selectedChoiceIndex = null;
}

function checkTextAnswer(userAnswer, exercise) {
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = exercise.correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (normalizedUser === normalizedCorrect) return true;
    
    // Check acceptable answers if available
    if (exercise.acceptableAnswers) {
        return exercise.acceptableAnswers.some(ans => 
            normalizedUser === ans.toLowerCase().trim()
        );
    }
    
    return false;
}

function showFeedback(isCorrect, correctAnswer) {
    const currentLang = window.currentLang || 'en';
    const feedback = document.getElementById('feedback');
    
    if (isCorrect) {
        feedback.className = 'exercise-feedback correct';
        feedback.innerHTML = currentLang === 'en' ? '✅ Correct!' : '✅ Sahihi!';
    } else {
        feedback.className = 'exercise-feedback incorrect';
        feedback.innerHTML = `
            ${currentLang === 'en' ? '❌ Incorrect' : '❌ Si sahihi'}
            <span class="correct-answer">
                ${currentLang === 'en' ? 'Correct answer:' : 'Jibu sahihi:'} <strong>${correctAnswer}</strong>
            </span>
        `;
    }
}

function nextExercise() {
    loadExercise(currentExerciseIndex + 1);
}

function skipExercise() {
    // Mark as incorrect
    const exercise = exercises[currentExerciseIndex];
    userAnswers.push({
        exercise: exercise,
        userAnswer: '',
        isCorrect: false
    });
    
    loadExercise(currentExerciseIndex + 1);
}

// ============================================
// RESULTS
// ============================================

function showResults() {
    const currentLang = window.currentLang || 'en';
    
    document.getElementById('exercises').classList.remove('active');
    document.getElementById('results').classList.add('active');
    
    // Calculate score
    const percentage = Math.round((correctAnswers / exercises.length) * 100);
    
    const scorePercentageEl = document.getElementById('scorePercentage');
    const correctCountEl = document.getElementById('correctCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (scorePercentageEl) scorePercentageEl.textContent = percentage + '%';
    if (correctCountEl) correctCountEl.textContent = correctAnswers;
    if (totalCountEl) totalCountEl.textContent = exercises.length;
}

function showConjugationTable() {
    const container = document.getElementById('conjugationTableContainer');
    if (!container) return;
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
    
    // Generate tables for all practiced verbs
    const verbIds = [...new Set(exercises.map(ex => ex.verb.id))];
    const dictionaryData = getDictionaryData();
    const verbSettings = getVerbSettings();
    
    const tablesHTML = verbIds.map(verbId => {
        const verb = dictionaryData.find(v => v.id === verbId);
        if (!verb) return '';
        return generateConjugationTable(verb, verbSettings);
    }).join('');
    
    document.getElementById('conjugationTables').innerHTML = tablesHTML;
}

function generateConjugationTable(verb, verbSettings) {
    const currentLang = window.currentLang || 'en';
    
    let html = `<div class="conjugation-table">`;
    html += `<h4>${verb.kikurya} - ${currentLang === 'en' ? verb.english : verb.swahili}</h4>`;
    
    verbSettings.tenses.forEach(tense => {
        if (!verb.conjugations[tense.id]) return;
        
        html += `<div class="tense-section">`;
        html += `<h5>${tense[currentLang]}</h5>`;
        html += `<div class="conjugation-grid">`;
        
        verbSettings.pronouns.forEach(pronoun => {
            const form = verb.conjugations[tense.id][pronoun.id];
            if (form) {
                html += `
                    <div class="conjugation-item">
                        <div class="pronoun">${pronoun.kikurya} (${pronoun[currentLang]})</div>
                        <div class="form">${form}</div>
                    </div>
                `;
            }
        });
        
        html += `</div></div>`;
    });
    
    html += `</div>`;
    return html;
}

function reviewMistakes() {
    const currentLang = window.currentLang || 'en';
    const mistakes = userAnswers.filter(ans => !ans.isCorrect);
    
    if (mistakes.length === 0) {
        alert(currentLang === 'en' ? 'Perfect! No mistakes to review!' : 'Kamili! Hakuna makosa ya kupitia!');
        return;
    }
    
    // Create new exercises from mistakes
    exercises = mistakes.map(m => m.exercise);
    currentExerciseIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
    
    document.getElementById('results').classList.remove('active');
    document.getElementById('exercises').classList.add('active');
    
    loadExercise(0);
}

function downloadPDF() {
    const currentLang = window.currentLang || 'en';
    alert(currentLang === 'en' 
        ? 'PDF download will be implemented'
        : 'Upakuaji wa PDF utatekelezwa');
}

function saveToNotes() {
    const currentLang = window.currentLang || 'en';
    alert(currentLang === 'en'
        ? 'Save to notes will be implemented'
        : 'Kuhifadhi kwenye maelezo kutatekelezwa');
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.startVerbTrainer = startVerbTrainer;
window.backToModules = backToModules;
window.backToVerbSelection = backToVerbSelection;
window.goToSettings = goToSettings;
window.startExercises = startExercises;
window.restartTraining = restartTraining;
window.toggleAllTenses = toggleAllTenses;
window.toggleAllPronouns = toggleAllPronouns;
window.selectChoice = selectChoice;
window.checkAnswer = checkAnswer;
window.skipExercise = skipExercise;
window.showConjugationTable = showConjugationTable;
window.reviewMistakes = reviewMistakes;
window.downloadPDF = downloadPDF;
window.saveToNotes = saveToNotes;
