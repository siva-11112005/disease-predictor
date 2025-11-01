const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const MLAlgorithms = require('../utils/mlAlgorithms');

class BreastCancerModel {
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
      const csvPath = path.join(__dirname, '../data/breast_cancer.csv');
      const results = [];

      if (!fs.existsSync(csvPath)) {
        this.createSampleData(csvPath);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.trainingData = this.processData(results);
          console.log(`   Loaded ${this.trainingData.length} breast cancer records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  processData(rawData) {
    return rawData.map(row => ({
      features: [
        parseFloat(row.radius_mean),
        parseFloat(row.texture_mean),
        parseFloat(row.perimeter_mean),
        parseFloat(row.area_mean),
        parseFloat(row.smoothness_mean),
        parseFloat(row.compactness_mean),
        parseFloat(row.concavity_mean),
        parseFloat(row.concave_points_mean),
        parseFloat(row.symmetry_mean),
        parseFloat(row.fractal_dimension_mean)
      ],
      label: row.diagnosis === 'M' ? 1 : 0
    })).filter(item => !item.features.some(isNaN));
  }

  calculateStatistics() {
    this.stats = {
      totalRecords: this.trainingData.length,
      malignantCount: this.trainingData.filter(d => d.label === 1).length,
      benignCount: this.trainingData.filter(d => d.label === 0).length
    };
  }
async predict(patientData) {
  // Check if we have training data
  if (!this.trainingData || this.trainingData.length === 0) {
    return {
      disease: 'Breast Cancer',
      prediction: 'Insufficient Data',
      hasDiseaseRisk: false,
      confidence: 0,
      riskScore: 0,
      riskLevel: 'Unknown',
      analysis: {
        riskFactors: ['No training data available'],
        tumorCharacteristics: {}
      },
      recommendations: [
        'The system needs training data to make predictions.',
        'Please ensure the breast_cancer.csv file contains valid data.',
        'Consult a healthcare professional for proper diagnosis.'
      ],
      timestamp: new Date().toISOString()
    };
  }

  const features = [
    parseFloat(patientData.radiusMean),
    parseFloat(patientData.textureMean),
    parseFloat(patientData.perimeterMean),
    parseFloat(patientData.areaMean),
    parseFloat(patientData.smoothnessMean),
    parseFloat(patientData.compactnessMean),
    parseFloat(patientData.concavityMean),
    parseFloat(patientData.concavePointsMean),
    parseFloat(patientData.symmetryMean),
    parseFloat(patientData.fractalDimensionMean)
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
    disease: 'Breast Cancer',
    prediction: knnResult.prediction === 1 ? 'Malignant' : 'Benign',
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
      { min: 6.981, max: 28.11 },      // radius
      { min: 9.71, max: 39.28 },       // texture
      { min: 43.79, max: 188.5 },      // perimeter
      { min: 143.5, max: 2501 },       // area
      { min: 0.05263, max: 0.1634 },   // smoothness
      { min: 0.01938, max: 0.3454 },   // compactness
      { min: 0.0, max: 0.4268 },       // concavity
      { min: 0.0, max: 0.2012 },       // concave points
      { min: 0.106, max: 0.304 },      // symmetry
      { min: 0.04996, max: 0.09744 }   // fractal dimension
    ];

    return features.map((val, idx) => 
      MLAlgorithms.normalize(val, ranges[idx].min, ranges[idx].max)
    );
  }

  calculateRiskScore(features) {
    let score = 0;

    // Radius mean
    if (features[0] > 17) score += 20;
    else if (features[0] > 14) score += 10;

    // Perimeter
    if (features[2] > 100) score += 15;
    else if (features[2] > 80) score += 8;

    // Area
    if (features[3] > 800) score += 15;
    else if (features[3] > 500) score += 8;

    // Compactness
    if (features[5] > 0.15) score += 12;
    else if (features[5] > 0.1) score += 6;

    // Concavity
    if (features[6] > 0.2) score += 15;
    else if (features[6] > 0.1) score += 8;

    // Concave points
    if (features[7] > 0.1) score += 15;
    else if (features[7] > 0.05) score += 8;

    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score >= 60) return 'High';
    if (score >= 35) return 'Moderate';
    return 'Low';
  }

  getAnalysis(features, prediction) {
    const factors = [];

    if (features[0] > 17) factors.push('Large tumor radius');
    if (features[2] > 100) factors.push('Large tumor perimeter');
    if (features[3] > 800) factors.push('Large tumor area');
    if (features[5] > 0.15) factors.push('High compactness');
    if (features[6] > 0.2) factors.push('High concavity');
    if (features[7] > 0.1) factors.push('High concave points');

    return {
      riskFactors: factors,
      tumorCharacteristics: {
        radius: features[0].toFixed(2),
        area: features[3].toFixed(2),
        perimeter: features[2].toFixed(2),
        compactness: features[5].toFixed(4)
      }
    };
  }

  getRecommendations(prediction, riskScore) {
    if (prediction === 1 || riskScore >= 60) {
      return [
        '🚨 URGENT: Consult an oncologist immediately',
        'Get comprehensive biopsy and pathology report',
        'Discuss treatment options (surgery, chemotherapy, radiation)',
        'Consider second opinion from cancer specialist',
        'Genetic testing for BRCA mutations',
        'Join cancer support groups',
        'Discuss fertility preservation if needed',
        'Mental health support is important',
        'Follow prescribed treatment plan strictly',
        'Regular follow-up appointments critical'
      ];
    } else if (riskScore >= 35) {
      return [
        'Consult a breast specialist for detailed evaluation',
        'Regular mammogram screening',
        'Monthly self-breast examination',
        'Follow-up imaging as recommended',
        'Maintain healthy lifestyle',
        'Limit alcohol consumption',
        'Regular exercise',
        'Healthy diet rich in fruits and vegetables'
      ];
    } else {
      return [
        'Continue regular breast self-examinations',
        'Annual mammogram screening as recommended',
        'Maintain healthy weight',
        'Regular exercise',
        'Limit alcohol',
        'Healthy diet',
        'Know your family history'
      ];
    }
  }

  getStats() {
    return this.stats;
  }

  createSampleData(csvPath) {
    const header = 'diagnosis,radius_mean,texture_mean,perimeter_mean,area_mean,smoothness_mean,compactness_mean,concavity_mean,concave_points_mean,symmetry_mean,fractal_dimension_mean\n';
    const sampleData = [
      'M,17.99,10.38,122.8,1001,0.1184,0.2776,0.3001,0.1471,0.2419,0.07871',
      'M,20.57,17.77,132.9,1326,0.08474,0.07864,0.0869,0.07017,0.1812,0.05667',
      'M,19.69,21.25,130,1203,0.1096,0.1599,0.1974,0.1279,0.2069,0.05999',
      'M,11.42,20.38,77.58,386.1,0.1425,0.2839,0.2414,0.1052,0.2597,0.09744',
      'M,20.29,14.34,135.1,1297,0.1003,0.1328,0.198,0.1043,0.1809,0.05883',
      'M,12.45,15.7,82.57,477.1,0.1278,0.17,0.1578,0.08089,0.2087,0.07613',
      'M,18.25,19.98,119.6,1040,0.09463,0.109,0.1127,0.074,0.1794,0.05742',
      'M,13.71,20.83,90.2,577.9,0.1189,0.1645,0.09366,0.05985,0.2196,0.07451',
      'M,13,21.82,87.5,519.8,0.1273,0.1932,0.1859,0.09353,0.235,0.07389',
      'M,12.46,24.04,83.97,475.9,0.1186,0.2396,0.2273,0.08543,0.203,0.08243',
      'B,13.08,15.71,85.63,520,0.1075,0.127,0.04568,0.0311,0.1967,0.06811',
      'B,9.504,12.44,60.34,273.9,0.1024,0.06492,0.02956,0.02076,0.1815,0.06905',
      'B,12.04,18.02,77.66,446.7,0.09746,0.06987,0.01628,0.01311,0.1863,0.06643',
      'B,11.28,13.39,73,384.8,0.1164,0.1136,0.04635,0.04796,0.1771,0.06072',
      'B,9.738,11.97,61.24,288.5,0.092,0.04062,0,0,0.1809,0.05883'
    ];

    const csvContent = header + sampleData.join('\n');
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);
  }
}

module.exports = new BreastCancerModel();