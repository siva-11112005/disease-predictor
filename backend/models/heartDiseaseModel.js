const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const MLAlgorithms = require('../utils/mlAlgorithms');

class HeartDiseaseModel {
  constructor() {
    this.trainingData = [];
    this.stats = null;
  }

  async initialize() {
    await this.loadData();
    this.calculateStatistics();
  }

  async loadData() {
    return new Promise((resolve, reject) => {
      const csvPath = path.join(__dirname, '../data/heart.csv');
      const results = [];

      // Create sample data if file doesn't exist
      if (!fs.existsSync(csvPath)) {
        this.createSampleData(csvPath);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.trainingData = this.processData(results);
          console.log(`   Loaded ${this.trainingData.length} heart disease records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  processData(rawData) {
    return rawData.map(row => ({
      features: [
        parseFloat(row.age),
        parseFloat(row.sex),
        parseFloat(row.cp),
        parseFloat(row.trestbps),
        parseFloat(row.chol),
        parseFloat(row.fbs),
        parseFloat(row.restecg),
        parseFloat(row.thalach),
        parseFloat(row.exang),
        parseFloat(row.oldpeak),
        parseFloat(row.slope),
        parseFloat(row.ca),
        parseFloat(row.thal)
      ],
      label: parseInt(row.target)
    })).filter(item => !item.features.some(isNaN));
  }

  calculateStatistics() {
  this.stats = {
    totalRecords: this.trainingData.length,
    diseaseCount: this.trainingData.filter(d => d.label === 1).length,
    healthyCount: this.trainingData.filter(d => d.label === 0).length
  };
  
  // Add percentage only if we have data
  if (this.trainingData.length > 0) {
    this.stats.diseasePercentage = Math.round((this.stats.diseaseCount / this.trainingData.length) * 100);
  } else {
    this.stats.diseasePercentage = 0;
  }
}

  async predict(patientData) {
    const features = [
      parseFloat(patientData.age),
      parseFloat(patientData.sex),
      parseFloat(patientData.cp),
      parseFloat(patientData.trestbps),
      parseFloat(patientData.chol),
      parseFloat(patientData.fbs),
      parseFloat(patientData.restecg),
      parseFloat(patientData.thalach),
      parseFloat(patientData.exang),
      parseFloat(patientData.oldpeak),
      parseFloat(patientData.slope),
      parseFloat(patientData.ca),
      parseFloat(patientData.thal)
    ];

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);

    // KNN prediction
    const knnResult = MLAlgorithms.knnPredict(
      this.trainingData.map(d => ({
        features: this.normalizeFeatures(d.features),
        label: d.label
      })),
      normalizedFeatures,
      7
    );

    // Risk scoring
    const riskScore = this.calculateRiskScore(features);

    return {
      disease: 'Heart Disease',
      prediction: knnResult.prediction === 1 ? 'Positive' : 'Negative',
      hasDiseaseRisk: knnResult.prediction === 1,
      confidence: knnResult.confidence,
      riskScore: Math.round(riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      analysis: this.getAnalysis(features, knnResult.prediction),
      recommendations: this.getRecommendations(knnResult.prediction, riskScore),
      timestamp: new Date().toISOString()
    };
  }

  normalizeFeatures(features) {
    const ranges = [
      { min: 29, max: 77 },   // age
      { min: 0, max: 1 },     // sex
      { min: 0, max: 3 },     // cp
      { min: 94, max: 200 },  // trestbps
      { min: 126, max: 564 }, // chol
      { min: 0, max: 1 },     // fbs
      { min: 0, max: 2 },     // restecg
      { min: 71, max: 202 },  // thalach
      { min: 0, max: 1 },     // exang
      { min: 0, max: 6.2 },   // oldpeak
      { min: 0, max: 2 },     // slope
      { min: 0, max: 4 },     // ca
      { min: 0, max: 3 }      // thal
    ];

    return features.map((val, idx) => 
      MLAlgorithms.normalize(val, ranges[idx].min, ranges[idx].max)
    );
  }

  calculateRiskScore(features) {
    const weights = [2, 1.5, 2, 1.5, 1.8, 1, 1.2, 1.5, 2, 2.5, 1, 2, 2];
    let score = 0;

    // Age risk
    if (features[0] > 55) score += 15;
    else if (features[0] > 45) score += 10;

    // Sex (male = 1)
    if (features[1] === 1) score += 10;

    // Chest pain type
    score += features[2] * 8;

    // Blood pressure
    if (features[3] > 140) score += 15;
    else if (features[3] > 120) score += 8;

    // Cholesterol
    if (features[4] > 240) score += 15;
    else if (features[4] > 200) score += 8;

    // Fasting blood sugar
    if (features[5] === 1) score += 10;

    // Max heart rate
    if (features[7] < 100) score += 15;

    // Exercise induced angina
    if (features[8] === 1) score += 15;

    // ST depression
    score += features[9] * 10;

    // Number of major vessels
    score += features[11] * 8;

    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score >= 60) return 'High';
    if (score >= 35) return 'Moderate';
    return 'Low';
  }

  getAnalysis(features, prediction) {
    const factors = [];

    if (features[0] > 55) factors.push('Age over 55 increases risk');
    if (features[1] === 1) factors.push('Male gender has higher risk');
    if (features[3] > 140) factors.push('High blood pressure detected');
    if (features[4] > 240) factors.push('High cholesterol level');
    if (features[5] === 1) factors.push('Elevated fasting blood sugar');
    if (features[7] < 100) factors.push('Low maximum heart rate');
    if (features[8] === 1) factors.push('Exercise-induced chest pain');
    if (features[9] > 2) factors.push('Significant ST depression');

    return {
      riskFactors: factors,
      patientProfile: {
        age: features[0],
        gender: features[1] === 1 ? 'Male' : 'Female',
        bloodPressure: features[3],
        cholesterol: features[4],
        maxHeartRate: features[7]
      }
    };
  }

  getRecommendations(prediction, riskScore) {
    if (prediction === 1 || riskScore >= 60) {
      return [
        '🚨 URGENT: Consult a cardiologist immediately',
        'Get a complete cardiac evaluation including ECG and echocardiogram',
        'Do NOT engage in strenuous physical activity until cleared by doctor',
        'Monitor blood pressure and heart rate regularly',
        'Follow prescribed medication strictly',
        'Adopt a heart-healthy diet (low sodium, low fat)',
        'Quit smoking and limit alcohol consumption',
        'Manage stress through relaxation techniques',
        'Regular follow-up appointments are critical'
      ];
    } else if (riskScore >= 35) {
      return [
        'Schedule an appointment with a cardiologist for evaluation',
        'Get regular cardiac checkups',
        'Monitor blood pressure weekly',
        'Adopt a heart-healthy lifestyle',
        'Exercise moderately (30 min/day, 5 days/week)',
        'Maintain healthy weight',
        'Reduce salt and saturated fat intake',
        'Manage stress effectively',
        'Annual cardiac screening recommended'
      ];
    } else {
      return [
        'Maintain current healthy lifestyle',
        'Continue regular exercise routine',
        'Eat a balanced, heart-healthy diet',
        'Annual health checkups',
        'Monitor blood pressure periodically',
        'Avoid smoking and excessive alcohol',
        'Manage stress through healthy activities',
        'Stay physically active'
      ];
    }
  }

  getStats() {
    return this.stats;
  }

  createSampleData(csvPath) {
    const header = 'age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal,target\n';
    const sampleData = [
      '63,1,3,145,233,1,0,150,0,2.3,0,0,1,1',
      '37,1,2,130,250,0,1,187,0,3.5,0,0,2,1',
      '41,0,1,130,204,0,0,172,0,1.4,2,0,2,1',
      '56,1,1,120,236,0,1,178,0,0.8,2,0,2,1',
      '57,0,0,120,354,0,1,163,1,0.6,2,0,2,1',
      '57,1,0,140,192,0,1,148,0,0.4,1,0,1,1',
      '56,0,1,140,294,0,0,153,0,1.3,1,0,2,1',
      '44,1,1,120,263,0,1,173,0,0,2,0,3,1',
      '52,1,2,172,199,1,1,162,0,0.5,2,0,3,1',
      '57,1,2,150,168,0,1,174,0,1.6,2,0,2,1',
      '54,1,0,140,239,0,1,160,0,1.2,2,0,2,1',
      '48,0,2,130,275,0,1,139,0,0.2,2,0,2,1',
      '49,1,1,130,266,0,1,171,0,0.6,2,0,2,1',
      '64,1,3,110,211,0,0,144,1,1.8,1,0,2,1',
      '58,0,3,150,283,1,0,162,0,1,2,0,2,1',
      '50,0,2,120,219,0,1,158,0,1.6,1,0,2,1',
      '58,0,2,120,340,0,1,172,0,0,2,0,2,1',
      '66,0,3,150,226,0,1,114,0,2.6,0,0,2,1',
      '43,1,0,150,247,0,1,171,0,1.5,2,0,2,1',
      '69,0,3,140,239,0,1,151,0,1.8,2,2,2,1',
      '59,1,0,135,234,0,1,161,0,0.5,1,0,3,0',
      '44,1,2,130,233,0,1,179,1,0.4,2,0,2,0',
      '42,1,0,140,226,0,1,178,0,0,2,0,2,0',
      '61,1,2,150,243,1,1,137,1,1,1,0,2,0',
      '40,1,3,140,199,0,1,178,1,1.4,2,0,3,0',
      '71,0,1,160,302,0,1,162,0,0.4,2,2,2,0',
      '59,1,2,150,212,1,1,157,0,1.6,2,0,2,0',
      '51,1,2,110,175,0,1,123,0,0.6,2,0,2,0',
      '65,0,2,140,417,1,0,157,0,0.8,2,1,2,0',
      '53,1,2,130,197,1,0,152,0,1.2,0,0,2,0'
    ];

    const csvContent = header + sampleData.join('\n');
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);
  }
}

module.exports = new HeartDiseaseModel();