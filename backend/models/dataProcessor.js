const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class DataProcessor {
  constructor() {
    this.diseasesData = [];
    this.symptomsData = [];
    this.diabetesData = [];
  }

  async loadData() {
    try {
      // Load diseases and symptoms data
      this.loadDiseasesAndSymptoms();
      
      // Load diabetes CSV data
      await this.loadDiabetesCSV();
      
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  loadDiseasesAndSymptoms() {
    // Disease database with symptoms
    this.diseasesData = [
      {
        name: 'Diabetes Type 2',
        symptoms: ['increased_thirst', 'frequent_urination', 'increased_hunger', 'fatigue', 
                   'blurred_vision', 'slow_healing', 'tingling_hands', 'unexplained_weight_loss'],
        severity: 'serious',
        description: 'A chronic condition affecting how your body processes blood sugar (glucose)',
        recommendations: [
          'Consult an endocrinologist immediately',
          'Get HbA1c and fasting glucose tests',
          'Monitor blood sugar levels regularly',
          'Follow a diabetic-friendly diet',
          'Exercise for at least 30 minutes daily',
          'Maintain healthy weight',
          'Take prescribed medications regularly'
        ],
        specialization: 'Endocrinology',
        ageRisk: { high: { min: 45, max: 100 }, low: { min: 0, max: 30 } },
        genderRisk: { male: 1.1, female: 1.0 }
      },
      {
        name: 'Hypertension',
        symptoms: ['headache', 'shortness_of_breath', 'nosebleeds', 'chest_pain', 
                   'dizziness', 'vision_problems', 'fatigue', 'irregular_heartbeat'],
        severity: 'serious',
        description: 'High blood pressure - a condition where blood pressure is consistently too high',
        recommendations: [
          'Consult a cardiologist',
          'Monitor blood pressure daily',
          'Reduce salt intake',
          'Exercise regularly',
          'Maintain healthy weight',
          'Limit alcohol consumption',
          'Manage stress',
          'Take prescribed medications'
        ],
        specialization: 'Cardiology',
        ageRisk: { high: { min: 40, max: 100 }, low: { min: 0, max: 25 } }
      },
      {
        name: 'Common Cold',
        symptoms: ['runny_nose', 'sneezing', 'sore_throat', 'cough', 'mild_fever', 
                   'nasal_congestion', 'body_aches', 'mild_headache'],
        severity: 'mild',
        description: 'A viral infection of the upper respiratory tract',
        recommendations: [
          'Get plenty of rest',
          'Drink lots of fluids',
          'Use over-the-counter cold medications',
          'Gargle with warm salt water',
          'Use a humidifier',
          'Consult doctor if symptoms persist beyond 10 days'
        ],
        specialization: 'General Medicine'
      },
      {
        name: 'Influenza (Flu)',
        symptoms: ['high_fever', 'body_aches', 'chills', 'fatigue', 'headache', 
                   'dry_cough', 'sore_throat', 'nasal_congestion', 'muscle_pain'],
        severity: 'moderate',
        description: 'A contagious respiratory illness caused by influenza viruses',
        recommendations: [
          'Rest and get plenty of sleep',
          'Drink plenty of fluids',
          'Consider antiviral medication within 48 hours',
          'Use fever reducers',
          'Stay home to avoid spreading',
          'Consult a doctor if high-risk group'
        ],
        specialization: 'General Medicine'
      },
      {
        name: 'Migraine',
        symptoms: ['severe_headache', 'nausea', 'vomiting', 'light_sensitivity', 
                   'sound_sensitivity', 'vision_problems', 'dizziness', 'neck_pain'],
        severity: 'moderate',
        description: 'A neurological condition causing intense, debilitating headaches',
        recommendations: [
          'Rest in a quiet, dark room',
          'Apply cold or warm compress',
          'Take prescribed migraine medication',
          'Identify and avoid triggers',
          'Stay hydrated',
          'Consult a neurologist for recurring migraines'
        ],
        specialization: 'Neurology',
        genderRisk: { male: 0.8, female: 1.3 }
      },
      {
        name: 'Asthma',
        symptoms: ['shortness_of_breath', 'chest_tightness', 'wheezing', 'dry_cough', 
                   'difficulty_sleeping', 'rapid_breathing', 'fatigue'],
        severity: 'serious',
        description: 'A condition where airways narrow and swell, producing extra mucus',
        recommendations: [
          'Use prescribed inhaler as directed',
          'Identify and avoid triggers',
          'Monitor peak flow readings',
          'Have an asthma action plan',
          'Consult a pulmonologist',
          'Get annual flu vaccination'
        ],
        specialization: 'Pulmonology'
      },
      {
        name: 'Gastritis',
        symptoms: ['stomach_pain', 'nausea', 'vomiting', 'bloating', 'loss_of_appetite', 
                   'indigestion', 'burning_sensation', 'hiccups'],
        severity: 'moderate',
        description: 'Inflammation, irritation, or erosion of the stomach lining',
        recommendations: [
          'Avoid spicy and acidic foods',
          'Eat smaller, frequent meals',
          'Avoid alcohol and caffeine',
          'Take antacids',
          'Manage stress',
          'Consult a gastroenterologist if symptoms persist'
        ],
        specialization: 'Gastroenterology'
      },
      {
        name: 'Anxiety Disorder',
        symptoms: ['excessive_worry', 'restlessness', 'fatigue', 'difficulty_concentrating', 
                   'irritability', 'sleep_problems', 'rapid_heartbeat', 'sweating', 'trembling'],
        severity: 'moderate',
        description: 'A mental health condition causing excessive, persistent worry and fear',
        recommendations: [
          'Practice relaxation techniques',
          'Exercise regularly',
          'Maintain regular sleep schedule',
          'Limit caffeine and alcohol',
          'Consider cognitive behavioral therapy',
          'Consult a mental health professional',
          'Join support groups'
        ],
        specialization: 'Psychiatry'
      },
      {
        name: 'Urinary Tract Infection',
        symptoms: ['frequent_urination', 'burning_urination', 'cloudy_urine', 'pelvic_pain', 
                   'mild_fever', 'strong_urine_odor', 'blood_in_urine', 'lower_back_pain'],
        severity: 'moderate',
        description: 'An infection in any part of the urinary system',
        recommendations: [
          'Drink plenty of water',
          'Consult a doctor for antibiotics',
          'Urinate frequently',
          'Avoid irritating products',
          'Practice good hygiene',
          'Complete full antibiotic course'
        ],
        specialization: 'Urology'
      },
      {
        name: 'Allergic Rhinitis',
        symptoms: ['sneezing', 'runny_nose', 'itchy_eyes', 'nasal_congestion', 
                   'postnasal_drip', 'watery_eyes', 'itchy_throat', 'cough'],
        severity: 'mild',
        description: 'Allergic response affecting the nose and eyes',
        recommendations: [
          'Identify and avoid allergens',
          'Use antihistamines',
          'Try nasal sprays',
          'Consider allergy testing',
          'Use air purifiers',
          'Keep windows closed during high pollen seasons'
        ],
        specialization: 'Allergy/Immunology'
      },
      {
        name: 'Bronchitis',
        symptoms: ['persistent_cough', 'mucus_production', 'fatigue', 'shortness_of_breath', 
                   'mild_fever', 'chest_discomfort', 'wheezing', 'sore_throat'],
        severity: 'moderate',
        description: 'Inflammation of the bronchial tubes carrying air to lungs',
        recommendations: [
          'Get plenty of rest',
          'Drink lots of fluids',
          'Use a humidifier',
          'Avoid lung irritants',
          'Take cough medicine if needed',
          'Consult doctor if symptoms worsen'
        ],
        specialization: 'Pulmonology'
      },
      {
        name: 'Depression',
        symptoms: ['persistent_sadness', 'loss_of_interest', 'fatigue', 'sleep_problems', 
                   'appetite_changes', 'difficulty_concentrating', 'feelings_of_worthlessness', 
                   'physical_aches'],
        severity: 'serious',
        description: 'A mood disorder causing persistent feelings of sadness and loss of interest',
        recommendations: [
          'Seek professional mental health support',
          'Consider therapy or counseling',
          'Medication may be prescribed',
          'Exercise regularly',
          'Maintain social connections',
          'Practice self-care',
          'Join support groups'
        ],
        specialization: 'Psychiatry'
      }
    ];

    // Extract all unique symptoms
    const symptomsSet = new Set();
    this.diseasesData.forEach(disease => {
      disease.symptoms.forEach(symptom => symptomsSet.add(symptom));
    });

    // Symptom labels
    const symptomLabels = {
      'increased_thirst': 'Increased Thirst',
      'frequent_urination': 'Frequent Urination',
      'increased_hunger': 'Increased Hunger',
      'fatigue': 'Fatigue/Tiredness',
      'blurred_vision': 'Blurred Vision',
      'slow_healing': 'Slow Healing Wounds',
      'tingling_hands': 'Tingling in Hands/Feet',
      'unexplained_weight_loss': 'Unexplained Weight Loss',
      'headache': 'Headache',
      'severe_headache': 'Severe Headache',
      'mild_headache': 'Mild Headache',
      'shortness_of_breath': 'Shortness of Breath',
      'nosebleeds': 'Nosebleeds',
      'chest_pain': 'Chest Pain',
      'dizziness': 'Dizziness',
      'vision_problems': 'Vision Problems',
      'irregular_heartbeat': 'Irregular Heartbeat',
      'runny_nose': 'Runny Nose',
      'sneezing': 'Sneezing',
      'sore_throat': 'Sore Throat',
      'cough': 'Cough',
      'dry_cough': 'Dry Cough',
      'persistent_cough': 'Persistent Cough',
      'mild_fever': 'Mild Fever',
      'high_fever': 'High Fever (>101°F)',
      'body_aches': 'Body Aches',
      'muscle_pain': 'Muscle Pain',
      'chills': 'Chills',
      'nasal_congestion': 'Nasal Congestion',
      'nausea': 'Nausea',
      'vomiting': 'Vomiting',
      'light_sensitivity': 'Sensitivity to Light',
      'sound_sensitivity': 'Sensitivity to Sound',
      'neck_pain': 'Neck Pain',
      'chest_tightness': 'Chest Tightness',
      'wheezing': 'Wheezing',
      'difficulty_sleeping': 'Difficulty Sleeping',
      'rapid_breathing': 'Rapid Breathing',
      'stomach_pain': 'Stomach Pain',
      'bloating': 'Bloating',
      'loss_of_appetite': 'Loss of Appetite',
      'indigestion': 'Indigestion',
      'burning_sensation': 'Burning Sensation in Stomach',
      'hiccups': 'Hiccups',
      'excessive_worry': 'Excessive Worry',
      'restlessness': 'Restlessness',
      'difficulty_concentrating': 'Difficulty Concentrating',
      'irritability': 'Irritability',
      'sleep_problems': 'Sleep Problems',
      'rapid_heartbeat': 'Rapid Heartbeat',
      'sweating': 'Excessive Sweating',
      'trembling': 'Trembling',
      'burning_urination': 'Burning During Urination',
      'cloudy_urine': 'Cloudy Urine',
      'pelvic_pain': 'Pelvic Pain',
      'strong_urine_odor': 'Strong Urine Odor',
      'blood_in_urine': 'Blood in Urine',
      'lower_back_pain': 'Lower Back Pain',
      'itchy_eyes': 'Itchy Eyes',
      'postnasal_drip': 'Postnasal Drip',
      'watery_eyes': 'Watery Eyes',
      'itchy_throat': 'Itchy Throat',
      'mucus_production': 'Mucus Production',
      'chest_discomfort': 'Chest Discomfort',
      'persistent_sadness': 'Persistent Sadness',
      'loss_of_interest': 'Loss of Interest in Activities',
      'appetite_changes': 'Changes in Appetite',
      'feelings_of_worthlessness': 'Feelings of Worthlessness',
      'physical_aches': 'Unexplained Physical Aches'
    };

    this.symptomsData = Array.from(symptomsSet).map(symptom => ({
      id: symptom,
      label: symptomLabels[symptom] || symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  async loadDiabetesCSV() {
    return new Promise((resolve, reject) => {
      const csvPath = path.join(__dirname, '../data/diabetes.csv');
      const results = [];

      // Check if file exists
      if (!fs.existsSync(csvPath)) {
        console.log('Creating sample diabetes.csv file...');
        this.createSampleDiabetesCSV(csvPath);
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          this.diabetesData = results;
          console.log(`Loaded ${results.length} diabetes data records`);
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  createSampleDiabetesCSV(csvPath) {
    // Create sample diabetes dataset
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
      '11,143,94,33,146,36.6,0.254,51,1'
    ];

    const csvContent = header + sampleData.join('\n');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(csvPath, csvContent);
    console.log('Sample diabetes.csv created successfully');
  }

  getDiseasesData() {
    return this.diseasesData;
  }

  getSymptomsData() {
    return this.symptomsData;
  }

  getDiabetesData() {
    return this.diabetesData;
  }

  getStatistics() {
    const severityCounts = {};
    this.diseasesData.forEach(disease => {
      severityCounts[disease.severity] = (severityCounts[disease.severity] || 0) + 1;
    });

    return {
      severityDistribution: severityCounts,
      avgSymptomsPerDisease: Math.round(
        this.diseasesData.reduce((sum, d) => sum + d.symptoms.length, 0) / this.diseasesData.length
      )
    };
  }
}

module.exports = DataProcessor;