const DataProcessor = require('./dataProcessor');

class DiseaseModel {
  constructor() {
    this.dataProcessor = new DataProcessor();
    this.diseasesData = null;
    this.symptomsData = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.dataProcessor.loadData();
      this.diseasesData = this.dataProcessor.getDiseasesData();
      this.symptomsData = this.dataProcessor.getSymptomsData();
      this.initialized = true;
      console.log(`   Loaded ${this.diseasesData.length} general diseases`);
      return true;
    } catch (error) {
      console.error('Error initializing Disease Model:', error);
      throw error;
    }
  }

  getSymptoms() {
    return this.symptomsData;
  }

  getDiseases() {
    return this.diseasesData.map(d => ({
      name: d.name,
      severity: d.severity,
      description: d.description
    }));
  }

  async predict(symptoms, patientData = {}) {
    const predictions = [];

    for (const disease of this.diseasesData) {
      const match = this.calculateMatch(symptoms, disease.symptoms);
      
      if (match.percentage > 0) {
        let confidence = match.percentage;

        if (patientData.age && disease.ageRisk) {
          confidence = this.adjustForAge(confidence, patientData.age, disease.ageRisk);
        }

        predictions.push({
          disease: disease.name,
          confidence: Math.min(Math.round(confidence), 100),
          severity: disease.severity,
          description: disease.description,
          matchedSymptoms: match.matched,
          totalSymptoms: disease.symptoms.length,
          recommendations: disease.recommendations,
          specialization: disease.specialization || 'General Physician'
        });
      }
    }

    predictions.sort((a, b) => b.confidence - a.confidence);

    return {
      predictions: predictions.slice(0, 5),
      totalMatches: predictions.length,
      timestamp: new Date().toISOString(),
      disclaimer: 'This is an AI-based prediction tool for educational purposes only.'
    };
  }

  calculateMatch(userSymptoms, diseaseSymptoms) {
    const matched = userSymptoms.filter(s => diseaseSymptoms.includes(s));
    const percentage = (matched.length / diseaseSymptoms.length) * 100;
    return { percentage, matched: matched.length };
  }

  adjustForAge(confidence, age, ageRisk) {
    if (ageRisk.high && age >= ageRisk.high.min && age <= ageRisk.high.max) {
      return confidence * 1.2;
    }
    if (ageRisk.low && age >= ageRisk.low.min && age <= ageRisk.low.max) {
      return confidence * 0.8;
    }
    return confidence;
  }

  getStatistics() {
    return this.dataProcessor.getStatistics();
  }
}

module.exports = new DiseaseModel();