// Simple ML algorithms for disease prediction

class MLAlgorithms {
  // Normalize data to 0-1 range
  static normalize(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
  }

  // Calculate Euclidean distance
  static euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  // K-Nearest Neighbors prediction
  static knnPredict(trainData, testPoint, k = 5) {
    // Handle empty training data
    if (!trainData || trainData.length === 0) {
      return {
        prediction: 0,
        confidence: 50,
        neighbors: 0
      };
    }

    // Adjust k if we don't have enough data
    k = Math.min(k, trainData.length);

    // Calculate distances
    const distances = trainData.map(item => ({
      distance: this.euclideanDistance(item.features, testPoint),
      label: item.label
    }));

    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance);

    // Get k nearest neighbors
    const neighbors = distances.slice(0, k);

    // Count votes
    const votes = {};
    neighbors.forEach(neighbor => {
      votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
    });

    // Get majority vote
    const prediction = Object.keys(votes).reduce((a, b) => 
      votes[a] > votes[b] ? a : b
    );

    // Calculate confidence
    const confidence = (votes[prediction] / k) * 100;

    return {
      prediction: parseInt(prediction),
      confidence: Math.round(confidence),
      neighbors: neighbors.length
    };
  }

  // Simple weighted scoring
  static weightedScore(features, weights, thresholds) {
    let score = 0;
    features.forEach((value, index) => {
      if (weights[index]) {
        const normalized = this.normalize(value, 
          thresholds[index].min, 
          thresholds[index].max
        );
        score += normalized * weights[index];
      }
    });
    return score;
  }

  // Calculate risk level
  static getRiskLevel(score, thresholds) {
    if (score >= thresholds.high) return 'High';
    if (score >= thresholds.moderate) return 'Moderate';
    return 'Low';
  }

  // Statistical analysis with safety checks
  static calculateStats(data) {
    // Handle empty array
    if (!data || data.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0
      };
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const sorted = data.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    const variance = data.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, min, max, stdDev };
  }

  // Decision tree like classification
  static decisionTree(features, rules) {
    for (const rule of rules) {
      let ruleMatch = true;
      for (const condition of rule.conditions) {
        const value = features[condition.index];
        if (!this.checkCondition(value, condition)) {
          ruleMatch = false;
          break;
        }
      }
      if (ruleMatch) {
        return rule.result;
      }
    }
    return { prediction: 0, confidence: 50 };
  }

  static checkCondition(value, condition) {
    switch (condition.operator) {
      case '>': return value > condition.value;
      case '>=': return value >= condition.value;
      case '<': return value < condition.value;
      case '<=': return value <= condition.value;
      case '==': return value == condition.value;
      default: return false;
    }
  }
}

module.exports = MLAlgorithms;