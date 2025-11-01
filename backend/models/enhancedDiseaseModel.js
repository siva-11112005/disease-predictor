const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const AdvancedML = require('../utils/advancedML');

class EnhancedDiseaseModel {
    constructor(diseaseName, csvFileName) {
        this.diseaseName = diseaseName;
        this.csvFileName = csvFileName;
        this.trainingData = [];
        this.testData = [];
        this.models = null;
        this.stats = null;
        this.accuracy = null;
    }

    async initialize() {
        await this.loadData();
        await this.trainModels();
        this.validateModels();
    }

    async loadData() {
        return new Promise((resolve, reject) => {
            const csvPath = path.join(__dirname, '../data', this.csvFileName);
            const results = [];

            if (!fs.existsSync(csvPath)) {
                console.log(`   ⚠️  ${this.csvFileName} not found, using sample data`);
                resolve();
                return;
            }

            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    const processedData = this.processData(results);
                    
                    // Shuffle data
                    const shuffled = processedData.sort(() => Math.random() - 0.5);
                    
                    // 80/20 split
                    const splitIndex = Math.floor(shuffled.length * 0.8);
                    this.trainingData = shuffled.slice(0, splitIndex);
                    this.testData = shuffled.slice(splitIndex);

                    console.log(`   Loaded ${processedData.length} records`);
                    console.log(`   Training: ${this.trainingData.length}, Testing: ${this.testData.length}`);
                    
                    resolve();
                })
                .on('error', reject);
        });
    }

    processData(rawData) {
        // Override in child classes
        return [];
    }

    async trainModels() {
        if (this.trainingData.length === 0) {
            console.log(`   ⚠️  No training data for ${this.diseaseName}`);
            return;
        }

        console.log(`\n   🧠 Training advanced models for ${this.diseaseName}...`);
        
        // Normalize data
        const normalizedData = AdvancedML.normalizeData(this.trainingData);
        
        // Train ensemble
        this.models = await AdvancedML.trainEnsemble(normalizedData);
        
        console.log(`   ✅ Models trained successfully`);
    }

    validateModels() {
        if (!this.models || this.testData.length === 0) {
            return;
        }

        console.log(`\n   📊 Validating models for ${this.diseaseName}...`);

        let tp = 0, tn = 0, fp = 0, fn = 0;
        const predictions = [];

        this.testData.forEach(async (d) => {
            const result = await AdvancedML.predictEnsemble(this.models, d.features);
            predictions.push(result);

            if (result.prediction === 1 && d.label === 1) tp++;
            else if (result.prediction === 0 && d.label === 0) tn++;
            else if (result.prediction === 1 && d.label === 0) fp++;
            else if (result.prediction === 0 && d.label === 1) fn++;
        });

        const accuracy = ((tp + tn) / (tp + tn + fp + fn)) * 100;
        const precision = tp / (tp + fp) * 100;
        const recall = tp / (tp + fn) * 100;
        const f1Score = (2 * precision * recall) / (precision + recall);

        this.accuracy = {
            accuracy: accuracy.toFixed(2),
            precision: precision.toFixed(2),
            recall: recall.toFixed(2),
            f1Score: f1Score.toFixed(2),
            confusionMatrix: { tp, tn, fp, fn }
        };

        console.log(`   📈 Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`   📈 Precision: ${precision.toFixed(2)}%`);
        console.log(`   📈 Recall: ${recall.toFixed(2)}%`);
        console.log(`   📈 F1 Score: ${f1Score.toFixed(2)}%`);
    }

    async predict(patientData) {
        if (!this.models) {
            return this.getInsufficientDataResponse();
        }

        const features = this.extractFeatures(patientData);
        const normalizedFeatures = this.normalizeFeatures(features);
        
        const result = await AdvancedML.predictEnsemble(this.models, normalizedFeatures);
        const riskScore = this.calculateRiskScore(features);

        return {
            disease: this.diseaseName,
            prediction: result.prediction === 1 ? 'Positive' : 'Negative',
            hasDiseaseRisk: result.prediction === 1,
            confidence: result.confidence,
            riskScore: Math.round(riskScore),
            riskLevel: this.getRiskLevel(riskScore),
            modelAccuracy: this.accuracy,
            modelVotes: result.modelVotes,
            analysis: this.getAnalysis(features, result.prediction),
            recommendations: this.getRecommendations(result.prediction, riskScore),
            timestamp: new Date().toISOString()
        };
    }

    extractFeatures(patientData) {
        // Override in child classes
        return [];
    }

    normalizeFeatures(features) {
        // Override in child classes
        return features;
    }

    calculateRiskScore(features) {
        // Override in child classes
        return 0;
    }

    getRiskLevel(score) {
        if (score >= 70) return 'High';
        if (score >= 40) return 'Moderate';
        return 'Low';
    }

    getAnalysis(features, prediction) {
        return {
            riskFactors: [],
            patientProfile: {}
        };
    }

    getRecommendations(prediction, riskScore) {
        return [];
    }

    getInsufficientDataResponse() {
        return {
            disease: this.diseaseName,
            prediction: 'Insufficient Data',
            hasDiseaseRisk: false,
            confidence: 0,
            riskScore: 0,
            riskLevel: 'Unknown',
            analysis: { riskFactors: ['No training data available'], patientProfile: {} },
            recommendations: ['Please ensure dataset is available'],
            timestamp: new Date().toISOString()
        };
    }

    getStats() {
        return {
            totalRecords: this.trainingData.length + this.testData.length,
            trainingRecords: this.trainingData.length,
            testRecords: this.testData.length,
            accuracy: this.accuracy
        };
    }
}

module.exports = EnhancedDiseaseModel;