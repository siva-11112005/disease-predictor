const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const MLAlgorithms = require('../utils/mlAlgorithms');

class LiverDiseaseModel {
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
      const csvPath = path.join(__dirname, '../data/liver.csv');
      const results = [];

      if (!fs.existsSync(csvPath)) {
        this.createSampleData(csvPath);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.trainingData = this.processData(results);
          console.log(`   Loaded ${this.trainingData.length} liver disease records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  processData(rawData) {
    return rawData.map(row => ({
      features: [
        parseFloat(row.age),
        parseFloat(row.gender),
        parseFloat(row.total_bilirubin),
        parseFloat(row.direct_bilirubin),
        parseFloat(row.alkaline_phosphatase),
        parseFloat(row.alamine_aminotransferase),
        parseFloat(row.aspartate_aminotransferase),
        parseFloat(row.total_proteins),
        parseFloat(row.albumin),
        parseFloat(row.albumin_globulin_ratio)
      ],
      label: parseInt(row.is_patient)
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
    if (!this.trainingData || this.trainingData.length === 0) {
      return {
        disease: 'Liver Disease',
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
          'Please ensure the liver.csv file contains valid data.',
          'Consult a healthcare professional for proper diagnosis.'
        ],
        timestamp: new Date().toISOString()
      };
    }

    const features = [
      parseFloat(patientData.age),
      parseFloat(patientData.gender),
      parseFloat(patientData.totalBilirubin),
      parseFloat(patientData.directBilirubin),
      parseFloat(patientData.alkalinePhosphatase),
      parseFloat(patientData.alamineAminotransferase),
      parseFloat(patientData.aspartateAminotransferase),
      parseFloat(patientData.totalProteins),
      parseFloat(patientData.albumin),
      parseFloat(patientData.albuminGlobulinRatio)
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
      disease: 'Liver Disease',
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
      { min: 4, max: 90 },      // age
      { min: 0, max: 1 },       // gender
      { min: 0.4, max: 75 },    // total bilirubin
      { min: 0.1, max: 19.7 },  // direct bilirubin
      { min: 63, max: 2110 },   // alkaline phosphatase
      { min: 10, max: 2000 },   // alamine aminotransferase
      { min: 10, max: 4929 },   // aspartate aminotransferase
      { min: 2.7, max: 9.6 },   // total proteins
      { min: 0.9, max: 5.5 },   // albumin
      { min: 0.3, max: 2.8 }    // albumin globulin ratio
    ];

    return features.map((val, idx) => 
      MLAlgorithms.normalize(val, ranges[idx].min, ranges[idx].max)
    );
  }

  calculateRiskScore(features) {
    let score = 0;

    // Total Bilirubin
    if (features[2] > 2) score += 20;
    else if (features[2] > 1.2) score += 10;

    // Direct Bilirubin
    if (features[3] > 0.8) score += 15;

    // Alkaline Phosphatase
    if (features[4] > 300) score += 15;
    else if (features[4] > 200) score += 8;

    // ALT (Alamine Aminotransferase)
    if (features[5] > 100) score += 15;
    else if (features[5] > 50) score += 8;

    // AST (Aspartate Aminotransferase)
    if (features[6] > 100) score += 15;
    else if (features[6] > 50) score += 8;

    // Total Proteins
    if (features[7] < 6 || features[7] > 8.3) score += 10;

    // Albumin
    if (features[8] < 3.5) score += 10;

    // A/G Ratio
    if (features[9] < 1.0) score += 10;

    // Age
    if (features[0] > 60) score += 5;

    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score >= 60) return 'High';
    if (score >= 35) return 'Moderate';
    return 'Low';
  }

  getAnalysis(features, prediction) {
    const factors = [];

    if (features[2] > 2) factors.push('Elevated total bilirubin (jaundice)');
    if (features[3] > 0.8) factors.push('High direct bilirubin');
    if (features[4] > 300) factors.push('Elevated alkaline phosphatase');
    if (features[5] > 100) factors.push('High ALT levels (liver damage)');
    if (features[6] > 100) factors.push('High AST levels (liver damage)');
    if (features[7] < 6) factors.push('Low total proteins');
    if (features[8] < 3.5) factors.push('Low albumin (poor liver function)');
    if (features[9] < 1.0) factors.push('Low A/G ratio');

    return {
      riskFactors: factors,
      patientProfile: {
        age: features[0],
        totalBilirubin: features[2],
        ALT: features[5],
        AST: features[6],
        albumin: features[8]
      }
    };
  }

  getRecommendations(prediction, riskScore) {
    if (prediction === 1 || riskScore >= 60) {
      return [
        '🚨 URGENT: Consult a hepatologist immediately',
        'Get comprehensive liver function tests',
        'Ultrasound or CT scan of liver may be needed',
        'Avoid alcohol completely',
        'Stop hepatotoxic medications',
        'Rest and proper nutrition',
        'Monitor for jaundice, abdominal swelling',
        'Possible hospitalization may be required',
        'Vaccination for hepatitis A and B',
        'Regular liver monitoring'
      ];
    } else if (riskScore >= 35) {
      return [
        'Consult a gastroenterologist for evaluation',
        'Get liver function tests',
        'Avoid alcohol',
        'Healthy diet rich in fruits and vegetables',
        'Maintain healthy weight',
        'Regular exercise',
        'Avoid unnecessary medications',
        'Follow-up tests in 3-6 months'
      ];
    } else {
      return [
        'Maintain healthy lifestyle',
        'Limit alcohol consumption',
        'Healthy balanced diet',
        'Regular exercise',
        'Annual health checkups',
        'Avoid hepatotoxic substances'
      ];
    }
  }

  getStats() {
    return this.stats;
  }

  createSampleData(csvPath) {
    const header = 'age,gender,total_bilirubin,direct_bilirubin,alkaline_phosphatase,alamine_aminotransferase,aspartate_aminotransferase,total_proteins,albumin,albumin_globulin_ratio,is_patient\n';
    const sampleData = [
      '65,1,0.7,0.1,187,16,18,6.8,3.3,0.90,1',
      '62,0,10.9,5.5,699,64,100,7.5,3.2,0.74,1',
      '47,0,0.9,0.3,192,60,68,7.0,3.2,0.84,1',
      '58,1,0.9,0.2,182,14,20,6.8,3.4,1.00,1',
      '72,0,3.9,1.3,928,29,42,8.7,4.2,0.93,1',
      '46,0,1.8,0.7,417,23,35,6.7,3.3,0.98,1',
      '54,1,0.7,0.2,193,16,25,7.1,3.8,1.15,1',
      '32,0,0.9,0.3,277,20,45,6.5,3.0,0.85,1',
      '38,1,0.7,0.2,204,41,52,7.2,3.5,0.95,1',
      '44,0,11.3,5.8,1600,233,225,7.9,3.1,0.68,1',
      '24,0,0.7,0.2,216,32,48,7.3,3.9,1.14,0',
      '32,1,0.8,0.2,208,22,30,6.9,3.5,1.03,0',
      '36,0,0.6,0.1,228,18,24,7.2,3.8,1.11,0',
      '42,1,0.7,0.2,195,19,28,7.0,3.6,1.05,0',
      '28,0,0.8,0.3,204,25,35,6.8,3.4,1.00,0'
    ];

    const csvContent = header + sampleData.join('\n');
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent);
  }
}

module.exports = new LiverDiseaseModel();