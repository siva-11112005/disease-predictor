const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const MLAlgorithms = require('../utils/mlAlgorithms');

class DiabetesModel {
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
      const csvPath = path.join(__dirname, '../data/diabetes.csv');
      const results = [];

      if (!fs.existsSync(csvPath)) {
        this.createSampleData(csvPath);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.trainingData = this.processData(results);
          console.log(`   Loaded ${this.trainingData.length} diabetes records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  processData(rawData) {
    return rawData.map(row => ({
      features: [
        parseFloat(row.Pregnancies),
        parseFloat(row.Glucose),
        parseFloat(row.BloodPressure),
        parseFloat(row.SkinThickness),
        parseFloat(row.Insulin),
        parseFloat(row.BMI),
        parseFloat(row.DiabetesPedigreeFunction),
        parseFloat(row.Age)
      ],
      label: parseInt(row.Outcome)
    })).filter(item => !item.features.some(isNaN));
  }

  calculateStatistics() {
    this.stats = {
      totalRecords: this.trainingData.length,
      diabeticCount: this.trainingData.filter(d => d.label === 1).length,
      healthyCount: this.trainingData.filter(d => d.label === 0).length
    };
  }

  async predict(patientData) {
  // Check if we have training data
  if (!this.trainingData || this.trainingData.length === 0) {
    return {
      disease: 'Type 2 Diabetes',
      prediction: 'Insufficient Data',
      hasDiseaseRisk: false,
      confidence: 0,
      riskScore: 0,
      riskLevel: 'Unknown',
      analysis: {
        riskFactors: ['No training data available'],
        patientProfile: {}
      },
      recommendations: [
        'The system needs training data to make predictions.',
        'Please ensure the diabetes.csv file contains valid data.',
        'Consult a healthcare professional for proper diagnosis.'
      ],
      timestamp: new Date().toISOString()
    };
  }

  const features = [
    parseFloat(patientData.pregnancies || 0),
    parseFloat(patientData.glucose),
    parseFloat(patientData.bloodPressure),
    parseFloat(patientData.skinThickness || 0),
    parseFloat(patientData.insulin || 0),
    parseFloat(patientData.bmi),
    parseFloat(patientData.diabetesPedigreeFunction),
    parseFloat(patientData.age)
  ];

  const normalizedFeatures = this.normalizeFeatures(features);
  
  const knnResult = MLAlgorithms.knnPredict(
    this.trainingData.map(d => ({
      features: this.normalizeFeatures(d.features),
      label: d.label
    })),
    normalizedFeatures,
    9
  );

  const riskScore = this.calculateRiskScore(features);

  return {
    disease: 'Type 2 Diabetes',
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
      { min: 0, max: 17 },    // pregnancies
      { min: 0, max: 199 },   // glucose
      { min: 0, max: 122 },   // blood pressure
      { min: 0, max: 99 },    // skin thickness
      { min: 0, max: 846 },   // insulin
      { min: 0, max: 67.1 },  // BMI
      { min: 0.078, max: 2.42 }, // diabetes pedigree
      { min: 21, max: 81 }    // age
    ];

    return features.map((val, idx) => 
      MLAlgorithms.normalize(val, ranges[idx].min, ranges[idx].max)
    );
  }

  calculateRiskScore(features) {
    let score = 0;

    // Glucose (most important)
    if (features[1] >= 140) score += 35;
    else if (features[1] >= 100) score += 20;
    else if (features[1] >= 70) score += 5;

    // BMI
    if (features[5] >= 30) score += 20;
    else if (features[5] >= 25) score += 10;

    // Age
    if (features[7] > 45) score += 10;
    else if (features[7] > 35) score += 5;

    // Blood Pressure
    if (features[2] > 80) score += 10;
    else if (features[2] > 70) score += 5;

    // Insulin
    if (features[4] > 200 || (features[4] > 0 && features[4] < 50)) score += 10;

    // Diabetes Pedigree
    if (features[6] > 0.5) score += 15;

    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score >= 60) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  }

  getAnalysis(features, prediction) {
    const factors = [];

    if (features[1] > 126) factors.push('High fasting glucose level');
    if (features[5] > 30) factors.push('Obesity (BMI > 30)');
    if (features[7] > 45) factors.push('Age over 45');
    if (features[2] > 80) factors.push('Elevated blood pressure');
    if (features[6] > 0.5) factors.push('Strong family history of diabetes');
    if (features[0] > 5) factors.push('Multiple pregnancies');

    return {
      riskFactors: factors,
      patientProfile: {
        glucose: features[1],
        bmi: features[5],
        age: features[7],
        bloodPressure: features[2]
      }
    };
  }

  getRecommendations(prediction, riskScore) {
    if (prediction === 1 || riskScore >= 60) {
      return [
        '🚨 URGENT: Consult an endocrinologist immediately',
        'Get HbA1c test done',
        'Monitor blood glucose levels daily',
        'Follow a strict diabetic diet plan',
        'Start a supervised exercise program',
        'Weight loss if overweight (target BMI < 25)',
        'Regular eye and foot examinations',
        'Check blood pressure regularly',
        'Take prescribed medications strictly',
        'Carry diabetic emergency card'
      ];
    } else if (riskScore >= 30) {
      return [
        'Consult a doctor for glucose tolerance test',
        'Adopt a low-sugar, balanced diet',
        'Exercise 30 minutes daily, 5 days/week',
        'Lose weight if overweight',
        'Monitor blood sugar monthly',
        'Reduce stress levels',
        'Avoid sugary drinks and processed foods',
        'Regular health checkups',
        'Stay hydrated'
      ];
    } else {
      return [
        'Maintain healthy lifestyle',
        'Continue balanced diet',
        'Regular exercise',
        'Annual health checkups',
        'Monitor weight',
        'Stay active'
      ];
    }
  }

  getStats() {
    return this.stats;
  }

  createSampleData(csvPath) {
    const header = 'Pregnancies,Glucose,BloodPressure,SkinThickness,Insulin,BMI,DiabetesPedigreeFunction,Age,Outcome\n';
    const sampleData = [
      '6,148,72,35,0,33.6,0.627,50,1',
      '1,85,66,29,0,26.6,0.351,31,0',
      '8,183,64,0,0,23.3,0.672,32,1',
      '1,89,66,23,94,28.1,0.167,21,0',
      '0,137,40,35,168,43.1,2.288,33,1',
      '5,116,74,0,0,25.6,0.201,30,0',
      '3,78,50,32,88,31.0,0.248,26,1',
      '10,115,0,0,0,35.3,0.134,29,0',
      '2,197,70,45,543,30.5,0.158,53,1',
      '8,125,96,0,0,0.0,0.232,54,1',
      '4,110,92,0,0,37.6,0.191,30,0',
      '10,168,74,0,0,38.0,0.537,34,1',
      '10,139,80,0,0,27.1,1.441,57,0',
      '1,189,60,23,846,30.1,0.398,59,1',
      '5,166,72,19,175,25.8,0.587,51,1',
      '7,100,0,0,0,30.0,0.484,32,1',
      '0,118,84,47,230,45.8,0.551,31,1',
      '7,107,74,0,0,29.6,0.254,31,1',
      '1,103,30,38,83,43.3,0.183,33,0',
      '1,115,70,30,96,34.6,0.529,32,1',
      '3,126,88,41,235,39.3,0.704,27,0',
      '8,99,84,0,0,35.4,0.388,50,0',
      '7,196,90,0,0,39.8,0.451,41,1',
      '9,119,80,35,0,29.0,0.263,29,1',
      '11,143,94,33,146,36.6,0.254,51,1',
      '10,125,70,26,115,31.1,0.205,41,1',
      '7,147,76,0,0,39.4,0.257,43,1',
      '1,97,66,15,140,23.2,0.487,22,0',
      '13,145,82,19,110,22.2,0.245,57,0',
      '5,117,92,0,0,34.1,0.337,38,0'
    ];

    const csvContent = header + sampleData.join('\n');
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);
  }
}

module.exports = new DiabetesModel();