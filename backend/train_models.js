const AdvancedML = require('../utils/advancedML');
const fs = require('fs');
const path = require('path');

async function trainAndValidateModels() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   🎓 MODEL TRAINING & VALIDATION              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Example: Train on heart disease data
    // You would load your actual data here
    
    const sampleData = generateSampleData(500); // Generate 500 sample records
    
    console.log(`📊 Dataset: ${sampleData.length} records`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Cross-validation with Random Forest
    console.log('🌳 Testing Random Forest...');
    const rfResults = AdvancedML.crossValidate(sampleData, 5, 'rf');
    console.log(`   ✅ Mean Accuracy: ${rfResults.meanAccuracy.toFixed(2)}%`);
    console.log(`   ✅ Std Deviation: ${rfResults.stdAccuracy.toFixed(2)}%`);
    console.log(`   ✅ Precision: ${rfResults.meanPrecision.toFixed(2)}%`);
    console.log(`   ✅ Recall: ${rfResults.meanRecall.toFixed(2)}%`);
    console.log(`   ✅ F1 Score: ${rfResults.meanF1Score.toFixed(2)}%\n`);
    
    // Cross-validation with Neural Network
    console.log('🧠 Testing Neural Network...');
    const nnResults = AdvancedML.crossValidate(sampleData, 5, 'nn');
    console.log(`   ✅ Mean Accuracy: ${nnResults.meanAccuracy.toFixed(2)}%`);
    console.log(`   ✅ Std Deviation: ${nnResults.stdAccuracy.toFixed(2)}%`);
    console.log(`   ✅ Precision: ${nnResults.meanPrecision.toFixed(2)}%`);
    console.log(`   ✅ Recall: ${nnResults.meanRecall.toFixed(2)}%`);
    console.log(`   ✅ F1 Score: ${nnResults.meanF1Score.toFixed(2)}%\n`);
    
    // Save results
    const results = {
        timestamp: new Date().toISOString(),
        dataset: {
            totalRecords: sampleData.length,
            trainingRecords: Math.floor(sampleData.length * 0.8),
            testRecords: Math.floor(sampleData.length * 0.2)
        },
        randomForest: rfResults,
        neuralNetwork: nnResults
    };
    
    const resultsPath = path.join(__dirname, '../validation_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Validation Complete!');
    console.log(`📄 Results saved to: ${resultsPath}\n`);
}

function generateSampleData(count) {
    const data = [];
    for (let i = 0; i < count; i++) {
        const features = Array(10).fill(0).map(() => Math.random());
        const label = features.reduce((sum, f) => sum + f, 0) > 5 ? 1 : 0;
        data.push({ features, label });
    }
    return data;
}

trainAndValidateModels().catch(console.error);