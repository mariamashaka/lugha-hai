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
            { id: 'p2', kikurya: 'Uwe', sw: 'wewe', en: 'you (sg)' },
            { id: 'p3', kikurya: 'Uura', sw: 'yeye', en: 'he/she' },
            { id: 'p4', kikurya: 'Bheito', sw: 'sisi', en: 'we' },
            { id: 'p5', kikurya: 'BheinyU', sw: 'ninyi', en: 'you (pl)' },
            { id: 'p6', kikurya: 'Bhabho', sw: 'wao', en: 'they' }
        ],
        tenses: [
            { id: 'present_simple', kikurya: 'present', sw: 'wakati uliopo', en: 'present simple' },
            { id: 'present_continuous', kikurya: 'present cont', sw: 'wakati uliopo unaoendelea', en: 'present continuous' },
            { id: 'past_simple', kikurya: 'past', sw: 'wakati uliopita', en: 'past simple' },
            { id: 'past_continuous', kikurya: 'past cont', sw: 'wakati uliopita unaoendelea', en: 'past continuous' },
            { id: 'present_perfect', kikurya: 'present perfect', sw: 'wakati uliopo kamili', en: 'present perfect' },
            { id: 'future_simple', kikurya: 'future', sw: 'wakati ujao', en: 'future simple' },
            { id: 'future_continuous', kikurya: 'future cont', sw: 'wakati ujao unaoendelea', en: 'future continuous' }
        ]
    };
}

// ============================================
// TRAINING SETTINGS
// ============================================

function populatePronounsList() {
    const verbSettings = getVerbSettings();
    const pronounsList = document.getElementById('pronounsList');
    
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
    
    // Exercise types (8 types, mixed)
    const exerciseTypes = [
        'fill_blank',           // Fill in: Uni ___ (kula, present)
        'multiple_choice',      // What does "X" mean?
        'translate_to_kikurya', // Translate: "I eat" → Kikurya
        'translate_from_kikurya', // Translate: "Uni ndarāghira" → English/Swahili
        'translate_sentence_to', // Translate sentence to Kikurya
        'translate_sentence_from', // Translate sentence from Kikurya
        'build_sentence',       // Build sentence from words
        'choose_form'           // Choose correct form in context
    ];
    
    for (let i = 0; i < exerciseCount; i++) {
        // Random verb
        const verbId = selectedVerbs[Math.floor(Math.random() * selectedVerbs.length)];
        const verb = dictionaryData.find(v => v.id === verbId);
        
        // Random tense
        const tenseId = selectedTenses[Math.floor(Math.random() * selectedTenses.length)];
        const tense = verbSettings.tenses.find(t => t.id === tenseId);
        
        // Random pronoun
        const pronounId = selectedPronouns[Math.floor(Math.random() * selectedPronouns.length)];
        const pronoun = verbSettings.pronouns.find(p => p.id === pronounId);
        
        // Random exercise type
        const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
        
        // Generate exercise
        const exercise = createExercise(exerciseType, verb, tense, pronoun, verbSettings);
        exercises.push(exercise);
    }
}

function createExercise(type, verb, tense, pronoun, verbSettings) {
    const correctForm = verb.conjugations[tense.id]?.[pronoun.id] || '';
    
    switch(type) {
        case 'fill_blank':
            return {
                type: 'fill_blank',
                question: currentLang === 'en' 
                    ? `Fill in the correct form:`
                    : `Jaza fomu sahihi:`,
                context: `${pronoun.kikurya} _______ (${verb.kikurya}, ${tense[currentLang]})`,
                correctAnswer: correctForm,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'multiple_choice':
            const translation = currentLang === 'en' ? verb.english : verb.swahili;
            const options = generateMCOptions(verb, tense, pronoun, verbSettings);
            return {
                type: 'multiple_choice',
                question: currentLang === 'en'
                    ? `What does "${pronoun.kikurya} ${correctForm}" mean?`
                    : `"${pronoun.kikurya} ${correctForm}" inamaanisha nini?`,
                options: options,
                correctAnswer: `${pronoun[currentLang]} ${translation} (${tense[currentLang]})`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'translate_to_kikurya':
            const swahiliTranslation = currentLang === 'en' ? verb.english : verb.swahili;
            return {
                type: 'translate_to_kikurya',
                question: currentLang === 'en'
                    ? `Translate to Kikurya:`
                    : `Tafsiri kwa Kikurya:`,
                context: `"${pronoun[currentLang]} ${swahiliTranslation}" (${tense[currentLang]})`,
                correctAnswer: `${pronoun.kikurya} ${correctForm}`,
                acceptableAnswers: [correctForm, `${pronoun.kikurya} ${correctForm}`],
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'translate_from_kikurya':
            return {
                type: 'translate_from_kikurya',
                question: currentLang === 'en'
                    ? `Translate to ${currentLang === 'en' ? 'English' : 'Kiswahili'}:`
                    : `Tafsiri kwa ${currentLang === 'en' ? 'Kiingereza' : 'Kiswahili'}:`,
                context: `"${pronoun.kikurya} ${correctForm}"`,
                correctAnswer: `${pronoun[currentLang]} ${currentLang === 'en' ? verb.english : verb.swahili}`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'translate_sentence_to':
            // Simple sentence with object
            const objectWord = 'food'; // Will be expanded later
            const objectKikurya = 'risokho';
            return {
                type: 'translate_sentence_to',
                question: currentLang === 'en'
                    ? `Translate to Kikurya:`
                    : `Tafsiri kwa Kikurya:`,
                context: currentLang === 'en'
                    ? `"${pronoun.en} ${verb.english} ${objectWord}" (${tense.en})`
                    : `"${pronoun.sw} ${verb.swahili} chakula" (${tense.sw})`,
                correctAnswer: `${pronoun.kikurya} ${correctForm} ${objectKikurya}`,
                hint: currentLang === 'en' 
                    ? `Hint: ${objectWord} = ${objectKikurya}`
                    : `Kidokezo: chakula = ${objectKikurya}`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'translate_sentence_from':
            const objWord = 'risokho';
            return {
                type: 'translate_sentence_from',
                question: currentLang === 'en'
                    ? `Translate to ${currentLang === 'en' ? 'English' : 'Kiswahili'}:`
                    : `Tafsiri kwa ${currentLang === 'en' ? 'Kiingereza' : 'Kiswahili'}:`,
                context: `"${pronoun.kikurya} ${correctForm} ${objWord}"`,
                correctAnswer: currentLang === 'en'
                    ? `${pronoun.en} ${verb.english} food`
                    : `${pronoun.sw} ${verb.swahili} chakula`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'build_sentence':
            return {
                type: 'build_sentence',
                question: currentLang === 'en'
                    ? `Build the correct sentence:`
                    : `Jenga sentensi sahihi:`,
                context: currentLang === 'en'
                    ? `${pronoun.en} ${verb.english} food`
                    : `${pronoun.sw} ${verb.swahili} chakula`,
                words: shuffle([pronoun.kikurya, correctForm, 'risokho']),
                correctAnswer: `${pronoun.kikurya} ${correctForm} risokho`,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
            
        case 'choose_form':
            const contextWord = tense.id.includes('past') ? 'Yesterday' : 
                               tense.id.includes('future') ? 'Tomorrow' : 'Now';
            const wrongForms = getWrongForms(verb, tense, pronoun, verbSettings);
            return {
                type: 'choose_form',
                question: currentLang === 'en'
                    ? `Choose the correct form:`
                    : `Chagua fomu sahihi:`,
                context: `"${contextWord}, ${pronoun[currentLang]} _____ food"`,
                options: shuffle([correctForm, ...wrongForms]),
                correctAnswer: correctForm,
                verb: verb,
                tense: tense,
                pronoun: pronoun
            };
    }
}

function generateMCOptions(verb, tense, pronoun, verbSettings) {
    const correctTranslation = currentLang === 'en' ? verb.english : verb.swahili;
    const correctOption = `${pronoun[currentLang]} ${correctTranslation} (${tense[currentLang]})`;
    
    // Generate wrong options (different tenses with same pronoun)
    const otherTenses = verbSettings.tenses.filter(t => t.id !== tense.id).slice(0, 2);
    const wrongOptions = otherTenses.map(t => 
        `${pronoun[currentLang]} ${correctTranslation} (${t[currentLang]})`
    );
    
    // Add one more wrong option with different pronoun
    const otherPronoun = verbSettings.pronouns.find(p => p.id !== pronoun.id);
    wrongOptions.push(`${otherPronoun[currentLang]} ${correctTranslation}`);
    
    return shuffle([correctOption, ...wrongOptions]);
}

function getWrongForms(verb, tense, pronoun, verbSettings) {
    const wrongForms = [];
    
    // Get forms from other tenses
    const otherTenses = verbSettings.tenses.filter(t => t.id !== tense.id).slice(0, 2);
    otherTenses.forEach(t => {
        const form = verb.conjugations[t.id]?.[pronoun.id];
        if (form) wrongForms.push(form);
    });
    
    return wrongForms;
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
    submitBtn.textContent = currentLang === 'en' ? 'Submit' : 'Wasilisha';
    submitBtn.onclick = checkAnswer;
}

function renderExercise(exercise) {
    let html = `<div class="exercise-question">${exercise.question}</div>`;
    
    if (exercise.context) {
        html += `<div class="exercise-context">${exercise.context}</div>`;
    }
    
    switch(exercise.type) {
        case 'fill_blank':
        case 'translate_to_kikurya':
        case 'translate_from_kikurya':
        case 'translate_sentence_to':
        case 'translate_sentence_from':
            html += `<input type="text" class="exercise-input" id="userInput" placeholder="${currentLang === 'en' ? 'Type your answer...' : 'Andika jibu lako...'}">`;
            if (exercise.hint) {
                html += `<div class="exercise-hint">${exercise.hint}</div>`;
            }
            break;
            
        case 'multiple_choice':
        case 'choose_form':
            html += '<div class="exercise-choices">';
            exercise.options.forEach((option, i) => {
                html += `<div class="choice-option" onclick="selectChoice(${i})" data-value="${option}">${option}</div>`;
            });
            html += '</div>';
            break;
            
        case 'build_sentence':
            html += '<div class="word-bank">';
            exercise.words.forEach((word, i) => {
                html += `<div class="word-tile" onclick="addToSentence('${word}', ${i})" id="tile-${i}">${word}</div>`;
            });
            html += '</div>';
            html += '<div class="sentence-builder" id="sentenceBuilder"></div>';
            break;
    }
    
    html += '<div id="feedback"></div>';
    
    return html;
}

function updateProgress() {
    const progress = ((currentExerciseIndex) / exercises.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentExercise').textContent = currentExerciseIndex + 1;
    document.getElementById('totalExercises').textContent = exercises.length;
}

// ============================================
// EXERCISE INTERACTION
// ============================================

let selectedChoiceIndex = null;
let builtSentence = [];

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

function addToSentence(word, tileIndex) {
    const tile = document.getElementById(`tile-${tileIndex}`);
    if (tile.classList.contains('used')) return;
    
    tile.classList.add('used');
    builtSentence.push(word);
    
    const builder = document.getElementById('sentenceBuilder');
    const wordTile = document.createElement('div');
    wordTile.className = 'word-tile';
    wordTile.textContent = word;
    wordTile.onclick = () => removeFromSentence(word, tileIndex, wordTile);
    builder.appendChild(wordTile);
}

function removeFromSentence(word, tileIndex, element) {
    const tile = document.getElementById(`tile-${tileIndex}`);
    tile.classList.remove('used');
    
    builtSentence = builtSentence.filter(w => w !== word);
    element.remove();
}

// ============================================
// ANSWER CHECKING
// ============================================

function checkAnswer() {
    const exercise = exercises[currentExerciseIndex];
    let userAnswer = '';
    let isCorrect = false;
    
    // Get user answer based on exercise type
    switch(exercise.type) {
        case 'fill_blank':
        case 'translate_to_kikurya':
        case 'translate_from_kikurya':
        case 'translate_sentence_to':
        case 'translate_sentence_from':
            userAnswer = document.getElementById('userInput').value.trim();
            isCorrect = checkTextAnswer(userAnswer, exercise);
            break;
            
        case 'multiple_choice':
        case 'choose_form':
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
            
        case 'build_sentence':
            userAnswer = builtSentence.join(' ');
            isCorrect = userAnswer === exercise.correctAnswer;
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
    
    // Reset choice selection
    selectedChoiceIndex = null;
    builtSentence = [];
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
    document.getElementById('exercises').classList.remove('active');
    document.getElementById('results').classList.add('active');
    
    // Calculate score
    const percentage = Math.round((correctAnswers / exercises.length) * 100);
    
    document.getElementById('scorePercentage').textContent = percentage + '%';
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('totalCount').textContent = exercises.length;
}

function showConjugationTable() {
    const container = document.getElementById('conjugationTableContainer');
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
    
    // Generate tables for all practiced verbs
    const verbIds = [...new Set(exercises.map(ex => ex.verb.id))];
    const dictionaryData = getDictionaryData();
    const verbSettings = getVerbSettings();
    
    const tablesHTML = verbIds.map(verbId => {
        const verb = dictionaryData.find(v => v.id === verbId);
        return generateConjugationTable(verb, verbSettings);
    }).join('');
    
    document.getElementById('conjugationTables').innerHTML = tablesHTML;
}

function generateConjugationTable(verb, verbSettings) {
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
    alert(currentLang === 'en' 
        ? 'PDF download will be implemented'
        : 'Upakuaji wa PDF utatekelezwa');
}

function saveToNotes() {
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
window.addToSentence = addToSentence;
window.removeFromSentence = removeFromSentence;
window.checkAnswer = checkAnswer;
window.skipExercise = skipExercise;
window.showConjugationTable = showConjugationTable;
window.reviewMistakes = reviewMistakes;
window.downloadPDF = downloadPDF;
window.saveToNotes = saveToNotes;
