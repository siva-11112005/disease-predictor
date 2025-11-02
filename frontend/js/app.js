// Configuration
const CONFIG = {
 API_BASE_URL: 'https://disease-predictor-541h.onrender.com/api',
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    MAX_SYMPTOMS: 20
};

// State Management
class AppState {
    constructor() {
        this.allSymptoms = [];
        this.selectedSymptoms = new Set();
        this.currentTab = 'heart-attack';
        this.currentLanguage = 'en';
        this.currentCategory = 'all';
        this.isLoading = false;
    }

    reset() {
        this.selectedSymptoms.clear();
    }
}

const appState = new AppState();

// Utility Functions
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const sanitizeHTML = (str) => {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

const validateFormData = (data) => {
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined || value === '' || isNaN(value)) {
            throw new Error(`Invalid value for ${key}`);
        }
    }
    return true;
};

// API Functions
class API {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async checkHealth() {
        return this.request('/health');
    }

    static async loadSymptoms(lang = 'en') {
        return this.request(`/symptoms?lang=${lang}`);
    }

    static async predict(endpoint, formData) {
        return this.request(`/predict/${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        UIManager.showLoading(true, 'Initializing system...');
        
        const health = await API.checkHealth();
        UIManager.updateSystemStatus(health);
        
        await loadSymptoms();
        
        setupEventListeners();
        
        UIManager.showToast('System ready', 'success');
    } catch (error) {
        console.error('Init error:', error);
        UIManager.showToast('Failed to initialize: ' + error.message, 'error');
        UIManager.updateSystemStatus({ allReady: false });
    } finally {
        UIManager.showLoading(false);
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    delegate(document, '.nav-item', 'click', handleNavigation);

    // Forms
    const forms = {
        'heart-attack-form': handleHeartAttackPrediction,
        'heart-disease-form': handleHeartDiseasePrediction,
        'diabetes-form': handleDiabetesPrediction,
        'kidney-form': handleKidneyPrediction,
        'breast-cancer-form': handleBreastCancerPrediction,
        'liver-form': handleLiverPrediction
    };

    Object.entries(forms).forEach(([formId, handler]) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', handler);
        }
    });

    // Symptom checker
    const searchInput = document.getElementById('symptom-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSymptomSearch, CONFIG.DEBOUNCE_DELAY));
    }

    const predictBtn = document.getElementById('general-predict-btn');
    if (predictBtn) {
        predictBtn.addEventListener('click', handleGeneralPrediction);
    }

    // Language and category filters
    delegate(document, '.lang-btn', 'click', handleLanguageChange);
    delegate(document, '.category-btn', 'click', handleCategoryChange);
    
    // Event delegation for symptoms
    delegate(document, '.symptom-card-advanced', 'click', handleSymptomCardClick);
}

// Event Delegation Helper
function delegate(parent, selector, event, handler) {
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target) {
            handler(e, target);
        }
    });
}

// Event Handlers
function handleNavigation(e, target) {
    const tab = target.dataset.tab;
    if (!tab) return;

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    target.classList.add('active');
    
    document.querySelectorAll('.content-panel').forEach(panel => panel.classList.remove('active'));
    const panel = document.getElementById(`${tab}-tab`);
    if (panel) panel.classList.add('active');
    
    appState.currentTab = tab;
}

function handleLanguageChange(e, target) {
    const lang = target.dataset.lang;
    if (!lang || lang === appState.currentLanguage) return;
    
    LanguageManager.switchLanguage(lang);
}

function handleCategoryChange(e, target) {
    const category = target.dataset.category;
    if (!category) return;
    
    filterByCategory(category);
}

function handleSymptomCardClick(e, target) {
    // Don't trigger if clicking checkbox or remove button
    if (e.target.matches('input, button')) return;
    
    const checkbox = target.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        const symptomId = checkbox.value;
        toggleSymptom(symptomId, checkbox.checked);
    }
}

// Language Manager
class LanguageManager {
    static switchLanguage(lang) {
        appState.currentLanguage = lang;
        
        // Update button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update translatable elements
        this.updateTranslations(lang);

        // Reload symptoms
        if (appState.allSymptoms.length > 0) {
            SymptomManager.render(appState.allSymptoms);
        }

        UIManager.showToast(
            lang === 'ta' ? 'தமிழுக்கு மாற்றப்பட்டது' : 'Switched to English', 
            'success'
        );
    }

    static updateTranslations(lang) {
        // Update text content
        document.querySelectorAll('[data-en]').forEach(element => {
            const key = lang === 'ta' && element.dataset.ta ? 'ta' : 'en';
            element.textContent = element.dataset[key];
        });

        // Update placeholders
        document.querySelectorAll('[data-en-placeholder]').forEach(element => {
            const key = lang === 'ta' && element.dataset.taPlaceholder ? 'taPlaceholder' : 'enPlaceholder';
            element.placeholder = element.dataset[key];
        });
    }
}

// Symptom Manager
class SymptomManager {
    static render(symptoms) {
        const container = document.getElementById('symptoms-container');
        if (!container) return;
        
        if (symptoms.length === 0) {
            container.innerHTML = '<p class="no-results">No symptoms found</p>';
            return;
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        symptoms.forEach(symptom => {
            const card = this.createSymptomCard(symptom);
            fragment.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    static createSymptomCard(symptom) {
        const isSelected = appState.selectedSymptoms.has(symptom.id);
        const div = document.createElement('div');
        div.className = `symptom-card-advanced ${isSelected ? 'selected' : ''}`;
        
        const categoryIcon = this.getCategoryIcon(symptom.category);
        const translation = symptom.translations?.ta || symptom.label;
        
        div.innerHTML = `
            <input type="checkbox" 
                   id="symptom-${symptom.id}" 
                   value="${symptom.id}"
                   ${isSelected ? 'checked' : ''}
                   aria-label="${symptom.label}">
            <div class="symptom-card-content">
                <span class="symptom-label-en">${sanitizeHTML(symptom.label)}</span>
                <span class="symptom-label-ta">${sanitizeHTML(translation)}</span>
            </div>
            <span class="symptom-category-badge" aria-label="${symptom.category}">${categoryIcon}</span>
        `;
        
        // Event listener for checkbox
        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleSymptom(symptom.id, e.target.checked);
        });
        
        return div;
    }

    static getCategoryIcon(category) {
        const icons = {
            'cardiac': '❤️',
            'respiratory': '🫁',
            'neurological': '🧠',
            'digestive': '🔥',
            'metabolic': '⚡',
            'urinary': '💧',
            'musculoskeletal': '🦴',
            'skin': '🩹',
            'mental': '😔',
            'visual': '👁️',
            'immune': '🛡️',
            'general': '📋'
        };
        return icons[category] || '📋';
    }

    static renderSelected() {
        const container = document.getElementById('selected-symptoms-list');
        if (!container) {
            console.error('Container #selected-symptoms-list not found!');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        if (appState.selectedSymptoms.size === 0) {
            const lang = appState.currentLanguage;
            container.innerHTML = `<span class="no-selection">${
                lang === 'ta' ? 'அறிகுறிகள் தேர்ந்தெடுக்கப்படவில்லை' : 'No symptoms selected'
            }</span>`;
            return;
        }

        // Create fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Add each selected symptom
        appState.selectedSymptoms.forEach(symptomId => {
            const symptom = appState.allSymptoms.find(s => s.id === symptomId);
            if (symptom) {
                const tag = this.createSymptomTag(symptom);
                fragment.appendChild(tag);
            }
        });

        container.appendChild(fragment);
        
        // Debug
        console.log('Rendered', appState.selectedSymptoms.size, 'selected symptoms');
    }

    static createSymptomTag(symptom) {
        const tag = document.createElement('div');
        tag.className = 'selected-tag-advanced';
        tag.dataset.symptomId = symptom.id;
        
        const translation = symptom.translations?.ta || symptom.label;
        
        tag.innerHTML = `
            <span class="selected-tag-label-en">${sanitizeHTML(symptom.label)}</span>
            <span class="selected-tag-label-ta">${sanitizeHTML(translation)}</span>
            <button class="remove-symptom-btn-advanced" 
                    aria-label="Remove ${symptom.label}"
                    type="button">×</button>
        `;
        
        // Add click handler for remove button
        const removeBtn = tag.querySelector('.remove-symptom-btn-advanced');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSymptom(symptom.id);
        });
        
        return tag;
    }

    static updateCount() {
        const countElement = document.getElementById('symptom-count');
        if (countElement) {
            countElement.textContent = appState.selectedSymptoms.size;
        }
    }
}

// Symptom Functions
async function loadSymptoms() {
    try {
        const data = await API.loadSymptoms(appState.currentLanguage);
        appState.allSymptoms = data.symptoms || [];
        SymptomManager.render(appState.allSymptoms);
    } catch (error) {
        console.error('Error loading symptoms:', error);
        UIManager.showToast('Failed to load symptoms', 'error');
    }
}

function toggleSymptom(symptomId, isSelected) {
    if (isSelected) {
        if (appState.selectedSymptoms.size >= CONFIG.MAX_SYMPTOMS) {
            UIManager.showToast(
                `Maximum ${CONFIG.MAX_SYMPTOMS} symptoms allowed`,
                'warning'
            );
            const checkbox = document.getElementById(`symptom-${symptomId}`);
            if (checkbox) checkbox.checked = false;
            return;
        }
        appState.selectedSymptoms.add(symptomId);
    } else {
        appState.selectedSymptoms.delete(symptomId);
    }
    
    SymptomManager.updateCount();
    SymptomManager.renderSelected();
    
    // Update the card's selected state
    const card = document.querySelector(`#symptom-${symptomId}`)?.closest('.symptom-card-advanced');
    if (card) {
        card.classList.toggle('selected', isSelected);
    }
    
    // Debug log
    console.log('Selected symptoms:', Array.from(appState.selectedSymptoms));
}

function removeSymptom(symptomId) {
    console.log('Removing symptom:', symptomId);
    
    appState.selectedSymptoms.delete(symptomId);
    
    // Uncheck the checkbox
    const checkbox = document.getElementById(`symptom-${symptomId}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    // Remove 'selected' class from card
    const card = checkbox?.closest('.symptom-card-advanced');
    if (card) {
        card.classList.remove('selected');
    }
    
    // Update UI
    SymptomManager.updateCount();
    SymptomManager.renderSelected();
}

function handleSymptomSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filterByCategory(appState.currentCategory);
        return;
    }
    
    const filtered = appState.allSymptoms.filter(symptom =>
        symptom.label.toLowerCase().includes(searchTerm) ||
        (symptom.translations?.ta && symptom.translations.ta.includes(searchTerm))
    );
    
    SymptomManager.render(filtered);
}

function filterByCategory(category) {
    appState.currentCategory = category;
    
    // Update button states
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    // Filter and render
    const filtered = category === 'all' 
        ? appState.allSymptoms 
        : appState.allSymptoms.filter(s => s.category === category);
    
    SymptomManager.render(filtered);
}

// Form Data Extractors
const FormExtractors = {
    heartAttack: () => ({
        age: parseFloat(document.getElementById('ha-age')?.value),
        sex: parseFloat(document.getElementById('ha-sex')?.value),
        cp: parseFloat(document.getElementById('ha-cp')?.value),
        trestbps: parseFloat(document.getElementById('ha-trestbps')?.value),
        chol: parseFloat(document.getElementById('ha-chol')?.value),
        fbs: parseFloat(document.getElementById('ha-fbs')?.value),
        restecg: parseFloat(document.getElementById('ha-restecg')?.value),
        thalach: parseFloat(document.getElementById('ha-thalach')?.value),
        exang: parseFloat(document.getElementById('ha-exang')?.value),
        oldpeak: parseFloat(document.getElementById('ha-oldpeak')?.value),
        slope: parseFloat(document.getElementById('ha-slope')?.value),
        ca: parseFloat(document.getElementById('ha-ca')?.value),
        thal: parseFloat(document.getElementById('ha-thal')?.value)
    }),

    diabetes: () => ({
        pregnancies: parseInt(document.getElementById('db-pregnancies')?.value),
        glucose: parseInt(document.getElementById('db-glucose')?.value),
        bloodPressure: parseInt(document.getElementById('db-bp')?.value),
        skinThickness: parseInt(document.getElementById('db-skin')?.value),
        insulin: parseInt(document.getElementById('db-insulin')?.value),
        bmi: parseFloat(document.getElementById('db-bmi')?.value),
        diabetesPedigreeFunction: parseFloat(document.getElementById('db-pedigree')?.value),
        age: parseInt(document.getElementById('db-age')?.value)
    }),

    kidney: () => ({
        age: parseInt(document.getElementById('kd-age')?.value),
        bloodPressure: parseInt(document.getElementById('kd-bp')?.value),
        specificGravity: parseFloat(document.getElementById('kd-sg')?.value),
        albumin: parseInt(document.getElementById('kd-al')?.value),
        sugar: parseInt(document.getElementById('kd-su')?.value),
        redBloodCells: document.getElementById('kd-rbc')?.value,
        bloodGlucoseRandom: parseInt(document.getElementById('kd-bgr')?.value),
        bloodUrea: parseFloat(document.getElementById('kd-bu')?.value),
        serumCreatinine: parseFloat(document.getElementById('kd-sc')?.value),
        hemoglobin: parseFloat(document.getElementById('kd-hemo')?.value),
        wbcCount: parseInt(document.getElementById('kd-wbcc')?.value),
        hypertension: document.getElementById('kd-htn')?.value,
        diabetesMellitus: document.getElementById('kd-dm')?.value
    }),

    breastCancer: () => ({
        radiusMean: parseFloat(document.getElementById('bc-radius')?.value),
        textureMean: parseFloat(document.getElementById('bc-texture')?.value),
        perimeterMean: parseFloat(document.getElementById('bc-perimeter')?.value),
        areaMean: parseFloat(document.getElementById('bc-area')?.value),
        smoothnessMean: parseFloat(document.getElementById('bc-smoothness')?.value),
        compactnessMean: parseFloat(document.getElementById('bc-compactness')?.value),
        concavityMean: parseFloat(document.getElementById('bc-concavity')?.value),
        concavePointsMean: parseFloat(document.getElementById('bc-concave-points')?.value),
        symmetryMean: parseFloat(document.getElementById('bc-symmetry')?.value),
        fractalDimensionMean: parseFloat(document.getElementById('bc-fractal')?.value)
    }),

    liver: () => ({
        age: parseInt(document.getElementById('liver-age')?.value),
        gender: parseInt(document.getElementById('liver-gender')?.value),
        totalBilirubin: parseFloat(document.getElementById('liver-total-bil')?.value),
        directBilirubin: parseFloat(document.getElementById('liver-direct-bil')?.value),
        alkalinePhosphatase: parseInt(document.getElementById('liver-alp')?.value),
        alamineAminotransferase: parseInt(document.getElementById('liver-alt')?.value),
        aspartateAminotransferase: parseInt(document.getElementById('liver-ast')?.value),
        totalProteins: parseFloat(document.getElementById('liver-proteins')?.value),
        albumin: parseFloat(document.getElementById('liver-albumin')?.value),
        albuminGlobulinRatio: parseFloat(document.getElementById('liver-ag-ratio')?.value)
    })
};

// Prediction Handlers
async function handleHeartAttackPrediction(e) {
    e.preventDefault();
    await makePrediction('heart-disease', FormExtractors.heartAttack(), 'heart-attack-results');
}

async function handleHeartDiseasePrediction(e) {
    e.preventDefault();
    await makePrediction('heart-disease', FormExtractors.heartAttack(), 'heart-disease-results');
}

async function handleDiabetesPrediction(e) {
    e.preventDefault();
    await makePrediction('diabetes', FormExtractors.diabetes(), 'diabetes-results');
}

async function handleKidneyPrediction(e) {
    e.preventDefault();
    await makePrediction('kidney-disease', FormExtractors.kidney(), 'kidney-results');
}

async function handleBreastCancerPrediction(e) {
    e.preventDefault();
    await makePrediction('breast-cancer', FormExtractors.breastCancer(), 'breast-cancer-results');
}

async function handleLiverPrediction(e) {
    e.preventDefault();
    await makePrediction('liver-disease', FormExtractors.liver(), 'liver-results');
}

async function handleGeneralPrediction() {
    if (appState.selectedSymptoms.size === 0) {
        const lang = appState.currentLanguage;
        UIManager.showToast(
            lang === 'ta' 
                ? 'குறைந்தது ஒரு அறிகுறியையாவது தேர்ந்தெடுக்கவும்' 
                : 'Please select at least one symptom', 
            'warning'
        );
        return;
    }

    if (appState.isLoading) return;
    
    const age = document.getElementById('patient-age-symptom')?.value;
    const gender = document.getElementById('patient-gender-symptom')?.value;
    
    try {
        appState.isLoading = true;
        const lang = appState.currentLanguage;
        UIManager.showLoading(true, lang === 'ta' ? 'பகுப்பாய்வு செய்யப்படுகிறது...' : 'Analyzing symptoms...');
        
        console.log('Sending prediction request with:', {
            symptoms: Array.from(appState.selectedSymptoms),
            patientData: {
                age: age ? parseInt(age) : null,
                gender: gender || null
            },
            language: lang
        });
        
        const data = await API.predict('advanced-symptoms', {
            symptoms: Array.from(appState.selectedSymptoms),
            patientData: {
                age: age ? parseInt(age) : null,
                gender: gender || null
            },
            language: lang
        });
        
        console.log('Received prediction:', data);
        
        ResultsRenderer.renderAdvanced(data.prediction);
        UIManager.showToast(
            lang === 'ta' ? 'பகுப்பாய்வு முடிந்தது' : 'Analysis complete', 
            'success'
        );
    } catch (error) {
        console.error('Prediction error:', error);
        UIManager.showToast('Prediction failed: ' + error.message, 'error');
    } finally {
        appState.isLoading = false;
        UIManager.showLoading(false);
    }
}

async function makePrediction(endpoint, formData, resultsDivId) {
    if (appState.isLoading) return;

    try {
        validateFormData(formData);
        appState.isLoading = true;
        UIManager.showLoading(true, 'Analyzing patient data...');
        
        const data = await API.predict(endpoint, formData);
        ResultsRenderer.render(data.prediction, resultsDivId);
        UIManager.showToast('Analysis complete', 'success');
    } catch (error) {
        UIManager.showToast(error.message, 'error');
    } finally {
        appState.isLoading = false;
        UIManager.showLoading(false);
    }
}

// Results Renderer
class ResultsRenderer {
    static render(prediction, resultsDivId) {
        const resultsDiv = document.getElementById(resultsDivId);
        if (!resultsDiv) return;
        
        const isPositive = prediction.hasDiseaseRisk;
        
        resultsDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header ${isPositive ? 'result-positive' : 'result-negative'}">
                    <div class="result-title">${sanitizeHTML(prediction.disease)}</div>
                    <div class="result-subtitle">Prediction: ${sanitizeHTML(prediction.prediction)}</div>
                </div>
                
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">${prediction.confidence}%</div>
                        <div class="metric-label">Confidence</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${prediction.riskScore}%</div>
                        <div class="metric-label">Risk Score</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${sanitizeHTML(prediction.riskLevel)}</div>
                        <div class="metric-label">Risk Level</div>
                    </div>
                </div>
                
                ${this.renderAnalysis(prediction.analysis)}
                ${this.renderRecommendations(prediction.recommendations)}
                
                <div class="disclaimer">
                    <strong>⚕️ Medical Disclaimer:</strong> This is an automated prediction tool. 
                    Always consult qualified healthcare professionals for accurate diagnosis and treatment.
                </div>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    static renderAnalysis(analysis) {
        if (!analysis?.riskFactors?.length) return '';
        
        return `
            <div class="info-section">
                <h3>Risk Factors</h3>
                <ul class="info-list">
                    ${analysis.riskFactors.map(factor => `<li>${sanitizeHTML(factor)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    static renderRecommendations(recommendations) {
        if (!recommendations?.length) return '';
        
        return `
            <div class="info-section">
                <h3>Recommendations</h3>
                <ul class="info-list recommendations-list">
                    ${recommendations.map(rec => `<li>${sanitizeHTML(rec)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    static renderAdvanced(prediction) {
        const resultsDiv = document.getElementById('general-results');
        if (!resultsDiv) return;
        
        const lang = appState.currentLanguage;
        
        if (!prediction.predictions?.length) {
            resultsDiv.innerHTML = `
                <div class="result-card">
                    <div style="text-align: center; padding: 40px;">
                        <h3>${lang === 'ta' ? 'பொருந்தும் நோய்கள் இல்லை' : 'No Matching Diseases Found'}</h3>
                        <p>${lang === 'ta' ? 'தயவுசெய்து மருத்துவரை அணுகவும்' : 'Please consult a healthcare professional'}</p>
                    </div>
                </div>
            `;
            resultsDiv.style.display = 'block';
            return;
        }
        
        let html = `
            <div class="result-card">
                <h3>${lang === 'ta' ? 'AI பகுப்பாய்வு முடிவுகள்' : 'AI Analysis Results'}</h3>
                <p class="subtitle">${sanitizeHTML(prediction.analysisMethod || 'Advanced Analysis')}</p>
                <p class="subtitle">${lang === 'ta' ? `துல்லியம்: ${prediction.confidence}` : `Confidence: ${prediction.confidence || 'High'}`}</p>
        `;
        
        prediction.predictions.forEach((pred, index) => {
            html += this.renderPredictionItem(pred, index);
        });
        
        html += `
            <div class="disclaimer">
                <strong>⚕️ ${lang === 'ta' ? 'மருத்துவ பொறுப்புத் துறப்பு' : 'Medical Disclaimer'}:</strong> 
                ${lang === 'ta' 
                    ? 'இது ஒரு AI அடிப்படையிலான கணிப்பு கருவி. எப்போதும் தகுதிவாய்ந்த மருத்துவ நிபுணர்களை அணுகவும்.' 
                    : sanitizeHTML(prediction.disclaimer || 'This is an AI-based prediction tool. Always consult qualified healthcare professionals.')}
            </div>
        </div>`;
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }

    static renderPredictionItem(pred, index) {
        const lang = appState.currentLanguage;
        const urgencyClass = `urgency-${pred.urgency || 'routine'}`;
        const urgencyText = {
            'emergency': lang === 'ta' ? 'அவசரம்' : 'EMERGENCY',
            'urgent': lang === 'ta' ? 'விரைவு' : 'URGENT',
            'soon': lang === 'ta' ? 'விரைவில்' : 'SOON',
            'routine': lang === 'ta' ? 'வழக்கமான' : 'ROUTINE'
        };
        
        return `
            <div class="info-section">
                <h3>
                    ${index + 1}. ${sanitizeHTML(lang === 'ta' && pred.diseaseTranslation ? pred.diseaseTranslation : pred.disease)}
                    <span class="urgency-badge ${urgencyClass}">${urgencyText[pred.urgency] || urgencyText.routine}</span>
                </h3>
                
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">${pred.confidence || 0}%</div>
                        <div class="metric-label">${lang === 'ta' ? 'நம்பகத்தன்மை' : 'Confidence'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${pred.matchedSymptoms || 0}/${pred.totalSymptoms || 0}</div>
                        <div class="metric-label">${lang === 'ta' ? 'அறிகுறிகள் பொருத்தம்' : 'Symptoms Match'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${pred.neuralConfidence || pred.confidence || 0}%</div>
                        <div class="metric-label">${lang === 'ta' ? 'AI துல்லியம்' : 'AI Confidence'}</div>
                    </div>
                </div>
                
                <div class="severity-badge severity-${pred.severity || 'moderate'}">
                    ${lang === 'ta' ? 'தீவிரம்' : 'Severity'}: ${(pred.severity || 'moderate').toUpperCase()}
                </div>
                
                <p><strong>${lang === 'ta' ? 'விளக்கம்' : 'Description'}:</strong> ${sanitizeHTML(pred.description || 'No description available')}</p>
                <p><strong>${lang === 'ta' ? 'சிறப்பு மருத்துவம்' : 'Specialization'}:</strong> ${sanitizeHTML(pred.specialization || 'General Medicine')}</p>
                
                ${pred.modelVotes ? this.renderModelVotes(pred.modelVotes) : ''}
                
                <div class="recommendations">
                    <h4>${lang === 'ta' ? 'பரிந்துரைகள்' : 'Recommendations'}:</h4>
                    <ul class="recommendations-list">
                        ${(lang === 'ta' && pred.recommendationsTranslation 
                            ? pred.recommendationsTranslation 
                            : pred.recommendations || ['Consult a healthcare professional']
                        ).map(rec => `<li>${sanitizeHTML(rec)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    static renderModelVotes(modelVotes) {
        const lang = appState.currentLanguage;
        
        return `
            <div class="model-votes">
                <h4>${lang === 'ta' ? 'AI மாதிரி வாக்குகள்' : 'AI Model Votes'}:</h4>
                ${modelVotes.randomForest ? `
                    <div class="vote-item">
                        <span class="vote-model">🌳 Random Forest</span>
                        <span class="vote-confidence">${modelVotes.randomForest.confidence}%</span>
                    </div>
                ` : ''}
                ${modelVotes.neuralNetwork ? `
                    <div class="vote-item">
                        <span class="vote-model">🧠 Neural Network</span>
                        <span class="vote-confidence">${modelVotes.neuralNetwork.confidence}%</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// UI Manager
class UIManager {
    static showLoading(show, text = 'Processing...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
            if (loadingText) loadingText.textContent = text;
        }
    }

    static showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.warn('Toast container not found');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        container.appendChild(toast);
        
        // Force reflow for animation
        toast.offsetHeight;
        
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.TOAST_DURATION);
    }

    static updateSystemStatus(health) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (!statusDot || !statusText) return;
        
        // Reset classes
        statusDot.className = 'status-dot';
        
        if (health.allReady) {
            statusDot.classList.add('ready');
            statusText.textContent = 'System Online';
        } else if (health.error) {
            statusDot.classList.add('error');
            statusText.textContent = 'System Error';
        } else {
            statusText.textContent = 'Loading...';
        }
    }
}

// Make removeSymptom available globally for event handlers
window.removeSymptom = removeSymptom;

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, API, SymptomManager, ResultsRenderer, UIManager };
}
