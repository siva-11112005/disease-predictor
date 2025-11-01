const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const MLAlgorithms = require('../utils/mlAlgorithms');

class KidneyDiseaseModel {
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
      const csvPath = path.join(__dirname, '../data/kidney_disease.csv');
      const results = [];

      if (!fs.existsSync(csvPath)) {
        this.createSampleData(csvPath);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.trainingData = this.processData(results);
          console.log(`   Loaded ${this.trainingData.length} kidney disease records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  processData(rawData) {
    return rawData.map(row => ({
      features: [
        parseFloat(row.age),
        parseFloat(row.bp),
        parseFloat(row.sg),
        parseFloat(row.al),
        parseFloat(row.su),
        parseFloat(row.rbc === 'normal' ? 0 : 1),
        parseFloat(row.bgr),
        parseFloat(row.bu),
        parseFloat(row.sc),
        parseFloat(row.hemo),
        parseFloat(row.wbcc),
        parseFloat(row.htn === 'yes' ? 1 : 0),
        parseFloat(row.dm === 'yes' ? 1 : 0)
      ],
      label: row.classification === 'ckd' ? 1 : 0
    })).filter(item => !item.features.some(isNaN));
  }

  calculateStatistics() {
    this.stats = {
      totalRecords: this.trainingData.length,
      diseaseCount: this.trainingData.filter(d => d.label === 1).length,
      healthyCount: this.trainingData.filter(d => d.label === 0).length
    };
  }

  async predict(patientData) {
  // Check if we have training data
  if (!this.trainingData || this.trainingData.length === 0) {
    return {
      disease: 'Chronic Kidney Disease (CKD)',
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
        'Please ensure the kidney_disease.csv file contains valid data.',
        'Consult a healthcare professional for proper diagnosis.'
      ],
      timestamp: new Date().toISOString()
    };
  }

  const features = [
    parseFloat(patientData.age),
    parseFloat(patientData.bloodPressure),
    parseFloat(patientData.specificGravity),
    parseFloat(patientData.albumin),
    parseFloat(patientData.sugar),
    patientData.redBloodCells === 'abnormal' ? 1 : 0,
    parseFloat(patientData.bloodGlucoseRandom),
    parseFloat(patientData.bloodUrea),
    parseFloat(patientData.serumCreatinine),
    parseFloat(patientData.hemoglobin),
    parseFloat(patientData.wbcCount),
    patientData.hypertension === 'yes' ? 1 : 0,
    patientData.diabetesMellitus === 'yes' ? 1 : 0
  ];

  const normalizedFeatures = this.normalizeFeatures(features);
  
  const knnResult = MLAlgorithms.knnPredict(
    this.trainingData.map(d => ({
      features: this.normalizeFeatures(d.features),
      label: d.label
    })),
    normalizedFeatures,
    7
  );

  const riskScore = this.calculateRiskScore(features);

  return {
    disease: 'Chronic Kidney Disease (CKD)',
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
      { min: 2, max: 90 },      // age
      { min: 50, max: 180 },    // bp
      { min: 1.005, max: 1.025 }, // sg
      { min: 0, max: 5 },       // al
      { min: 0, max: 5 },       // su
      { min: 0, max: 1 },       // rbc
      { min: 22, max: 490 },    // bgr
      { min: 1.5, max: 391 },   // bu
      { min: 0.4, max: 76 },    // sc
      { min: 3.1, max: 17.8 },  // hemo
      { min: 2200, max: 26400 }, // wbcc
      { min: 0, max: 1 },       // htn
      { min: 0, max: 1 }        // dm
    ];

    return features.map((val, idx) => 
      MLAlgorithms.normalize(val, ranges[idx].min, ranges[idx].max)
    );
  }

  calculateRiskScore(features) {
    let score = 0;

    // Blood Urea
    if (features[7] > 40) score += 20;
    else if (features[7] > 20) score += 10;

    // Serum Creatinine
    if (features[8] > 1.4) score += 25;
    else if (features[8] > 1.0) score += 12;

    // Hemoglobin
    if (features[9] < 10) score += 15;
    else if (features[9] < 12) score += 8;

    // Albumin
    if (features[3] > 2) score += 15;
    else if (features[3] > 0) score += 8;

    // Hypertension
    if (features[11] === 1) score += 10;

    // Diabetes
    if (features[12] === 1) score += 10;

    // Age
    if (features[0] > 60) score += 10;

    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score >= 60) return 'High';
    if (score >= 35) return 'Moderate';
    return 'Low';
  }

  getAnalysis(features, prediction) {
    const factors = [];

    if (features[7] > 40) factors.push('Elevated blood urea');
    if (features[8] > 1.4) factors.push('High serum creatinine');
    if (features[9] < 10) factors.push('Low hemoglobin (anemia)');
    if (features[3] > 2) factors.push('High albumin in urine');
    if (features[11] === 1) factors.push('Hypertension present');
    if (features[12] === 1) factors.push('Diabetes mellitus present');

    return {
      riskFactors: factors,
      patientProfile: {
        age: features[0],
        bloodUrea: features[7],
        serumCreatinine: features[8],
        hemoglobin: features[9]
      }
    };
  }

  getRecommendations(prediction, riskScore) {
    if (prediction === 1 || riskScore >= 60) {
      return [
        '🚨 URGENT: Consult a nephrologist immediately',
        'Get comprehensive kidney function tests',
        'Monitor blood pressure strictly',
        'Control blood sugar if diabetic',
        'Reduce protein intake as advised',
        'Limit salt consumption',
        'Stay well hydrated',
        'Avoid NSAIDs and nephrotoxic drugs',
        'Regular dialysis may be needed',
        'Consider kidney transplant evaluation'
      ];
    } else if (riskScore >= 35) {
      return [
        'Consult a nephrologist for evaluation',
        'Regular kidney function monitoring',
        'Control blood pressure',
        'Manage diabetes if present',
        'Healthy diet low in protein and salt',
        'Stay hydrated',
        'Avoid nephrotoxic medications',
        'Regular checkups'
      ];
    } else {
      return [
        'Maintain healthy lifestyle',
        'Regular health checkups',
        'Stay hydrated',
        'Balanced diet',
        'Control blood pressure',
        'Regular exercise'
      ];
    }
  }

  getStats() {
    return this.stats;
  }

  createSampleData(csvPath) {
    const header = 'age,bp,sg,al,su,rbc,bgr,bu,sc,hemo,wbcc,htn,dm,classification\n';
    const sampleData = [
      '48,80,1.020,1,0,normal,121,36,1.2,15.4,7800,yes,yes,ckd',
      '53,90,1.020,2,0,abnormal,92,53,1.8,9.6,6900,yes,no,ckd',
      '63,70,1.010,3,0,abnormal,380,60,2.7,7.7,3800,yes,yes,ckd',
      '68,80,1.010,3,2,normal,157,90,4.1,7.1,9800,yes,yes,ckd',
      '61,80,1.015,2,0,abnormal,173,148,3.9,9.8,7300,yes,yes,ckd',
      '48,70,1.020,4,0,abnormal,95,163,7.7,11.3,6000,yes,no,ckd',
      '69,70,1.010,3,4,abnormal,264,87,2.7,12.2,5800,yes,yes,ckd',
      '73,80,1.020,0,0,normal,253,142,4.6,15.4,6700,yes,yes,ckd',
      '25,80,1.020,0,0,normal,75,21,1.0,14.7,9200,no,no,notckd',
      '45,70,1.015,0,0,normal,117,15,0.8,13.5,7500,no,no,notckd',
      '38,70,1.020,0,0,normal,104,18,0.9,15.2,6200,no,no,notckd',
      '42,80,1.020,0,0,normal,89,17,0.7,16.1,7300,no,no,notckd',
      '35,80,1.015,0,0,normal,92,19,1.1,13.9,8100,no,no,notckd',
      '58,80,1.020,1,0,normal,131,28,1.4,12.4,6800,yes,no,ckd',
      '71,80,1.015,2,0,abnormal,162,54,2.1,10.2,4900,yes,yes,ckd'
    ];

    const csvContent = header + sampleData.join('\n');
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);
  }
}

module.exports = new KidneyDiseaseModel();