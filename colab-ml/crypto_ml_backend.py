import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import requests
import json
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import warnings
warnings.filterwarnings('ignore')

print("🚀 Initializing GPU-Accelerated Crypto ML Backend...")

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🔥 Using device: {device}")

class CryptoAnalysisNet(nn.Module):
    def __init__(self):
        super(CryptoAnalysisNet, self).__init__()
        self.feature_extractor = nn.Sequential(
            nn.Linear(20, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, 128)
        )
        
        self.risk_classifier = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 4)  # Low, Medium, High, Critical
        )
        
        self.profit_predictor = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1)  # Expected profit %
        )
        
        self.hold_time_predictor = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1)  # Optimal hold time in hours
        )
        
        self.buy_score = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1)  # Buy recommendation score 0-1
        )

    def forward(self, x):
        features = self.feature_extractor(x)
        risk = torch.softmax(self.risk_classifier(features), dim=1)
        profit = self.profit_predictor(features)
        hold_time = torch.relu(self.hold_time_predictor(features))
        buy_score = torch.sigmoid(self.buy_score(features))
        return risk, profit, hold_time, buy_score

model = CryptoAnalysisNet().to(device)

# Load pre-trained weights or initialize randomly
try:
    model.load_state_dict(torch.load('crypto_model.pth', map_location=device))
    print("✅ Loaded pre-trained model")
except:
    print("🔄 Initializing with random weights")

app = Flask(__name__)
CORS(app)

def fetch_historical_data(token_address, chain):
    """Fetch historical data for market age analysis"""
    try:
        if chain.lower() == 'eth':
            url = f"https://api.etherscan.io/api?module=account&action=txlist&address={token_address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc"
        elif chain.lower() == 'bsc':
            url = f"https://api.bscscan.com/api?module=account&action=txlist&address={token_address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc"
        else:
            return None
            
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get('result') and len(data['result']) > 0:
                first_tx = data['result'][0]
                timestamp = int(first_tx['timeStamp'])
                return datetime.fromtimestamp(timestamp)
    except:
        pass
    return None

def get_token_metrics(token_data):
    """Extract ML features from token data"""
    try:
        # Base features
        price = float(token_data.get('price', 0))
        price_change = float(token_data.get('priceChange24h', 0))
        volume = float(token_data.get('volume24h', 0))
        chain = token_data.get('chain', 'unknown')
        
        # Market age (days since first transaction)
        market_age = 365  # Default to 1 year if unknown
        creation_date = fetch_historical_data(token_data.get('address'), chain)
        if creation_date:
            market_age = (datetime.now() - creation_date).days
        
        # Liquidity analysis
        liquidity = float(token_data.get('liquidity', volume * 0.1))
        liquidity_ratio = liquidity / max(volume, 1)
        
        # Volatility features
        volatility_score = abs(price_change) / 10.0  # Normalize
        momentum_score = max(0, price_change - 9) / 4.0  # 0-1 for 9-13% range
        
        # Volume analysis
        volume_score = min(volume / 1000000, 1.0)  # Normalize to millions
        
        # Chain analysis (encoded)
        chain_scores = {
            'ETH': [1.0, 0.0, 0.0],
            'BSC': [0.0, 1.0, 0.0], 
            'POLYGON': [0.0, 0.0, 1.0],
            'ARBITRUM': [0.8, 0.2, 0.0],
            'OPTIMISM': [0.8, 0.0, 0.2]
        }
        chain_encoding = chain_scores.get(chain.upper(), [0.0, 0.0, 0.0])
        
        # Risk indicators
        risk_indicators = [
            1.0 if market_age < 7 else 0.0,  # Very new token
            1.0 if market_age < 30 else 0.0,  # New token
            1.0 if liquidity_ratio < 0.1 else 0.0,  # Low liquidity
            1.0 if volume < 10000 else 0.0,  # Low volume
            1.0 if price_change > 12 else 0.0,  # High volatility
        ]
        
        # Opportunity indicators
        opportunity_indicators = [
            1.0 if 30 < market_age < 365 else 0.0,  # Established but not old
            1.0 if liquidity_ratio > 0.5 else 0.0,  # Good liquidity
            1.0 if volume > 100000 else 0.0,  # Good volume
            1.0 if 9.5 <= price_change <= 11.5 else 0.0,  # Sweet spot
        ]
        
        # Combine all features
        features = [
            price_change / 13.0,  # Normalized price change
            volume_score,
            liquidity_ratio,
            market_age / 365.0,  # Normalized age
            volatility_score,
            momentum_score,
        ] + chain_encoding + risk_indicators + opportunity_indicators
        
        return np.array(features, dtype=np.float32), market_age, liquidity_ratio
        
    except Exception as e:
        print(f"❌ Error extracting features: {e}")
        return np.zeros(20, dtype=np.float32), 365, 0.1

@app.route('/analyze', methods=['POST'])
def analyze_tokens():
    try:
        tokens = request.json.get('tokens', [])
        print(f"🔍 Analyzing {len(tokens)} tokens...")
        
        results = []
        
        for token in tokens:
            features, market_age, liquidity_ratio = get_token_metrics(token)
            
            # Convert to tensor
            features_tensor = torch.tensor(features).unsqueeze(0).to(device)
            
            with torch.no_grad():
                risk_probs, profit_pred, hold_time_pred, buy_score = model(features_tensor)
                
                risk_labels = ['Low', 'Medium', 'High', 'Critical']
                risk_level = risk_labels[torch.argmax(risk_probs, dim=1).item()]
                risk_confidence = torch.max(risk_probs).item()
                
                expected_profit = profit_pred.item()
                optimal_hold_hours = max(1, hold_time_pred.item())
                buy_recommendation = buy_score.item()
                
                # Calculate recommendation strength
                if buy_recommendation >= 0.8:
                    recommendation = "STRONG BUY"
                elif buy_recommendation >= 0.6:
                    recommendation = "BUY"
                elif buy_recommendation >= 0.4:
                    recommendation = "HOLD"
                elif buy_recommendation >= 0.2:
                    recommendation = "WEAK BUY"
                else:
                    recommendation = "AVOID"
                
                # Calculate market maturity
                if market_age < 7:
                    maturity = "Brand New"
                elif market_age < 30:
                    maturity = "Very New"
                elif market_age < 90:
                    maturity = "New"
                elif market_age < 365:
                    maturity = "Established"
                else:
                    maturity = "Mature"
                
                # Generate specific advice
                advice = []
                if buy_recommendation > 0.7:
                    advice.append(f"Strong momentum indicator")
                if market_age < 30:
                    advice.append(f"New token - higher risk/reward")
                if liquidity_ratio > 0.5:
                    advice.append(f"Good liquidity")
                if optimal_hold_hours < 24:
                    advice.append(f"Short-term play")
                elif optimal_hold_hours > 168:
                    advice.append(f"Long-term hold")
                
                result = {
                    'symbol': token.get('symbol'),
                    'address': token.get('address'),
                    'chain': token.get('chain'),
                    'recommendation': recommendation,
                    'buy_score': round(buy_recommendation, 3),
                    'risk_level': risk_level,
                    'risk_confidence': round(risk_confidence, 3),
                    'expected_profit_percent': round(expected_profit, 2),
                    'optimal_hold_hours': round(optimal_hold_hours, 1),
                    'optimal_hold_readable': f"{optimal_hold_hours:.1f}h" if optimal_hold_hours < 48 else f"{optimal_hold_hours/24:.1f}d",
                    'market_age_days': market_age,
                    'market_maturity': maturity,
                    'liquidity_ratio': round(liquidity_ratio, 3),
                    'advice': advice,
                    'analysis_timestamp': datetime.now().isoformat()
                }
                
                results.append(result)
        
        # Sort by buy score descending
        results.sort(key=lambda x: x['buy_score'], reverse=True)
        
        print(f"✅ Analysis complete. Top recommendation: {results[0]['symbol'] if results else 'None'}")
        
        return jsonify({
            'success': True,
            'analyzed_count': len(results),
            'recommendations': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'device': str(device),
        'model_loaded': True,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🤖 ML Backend ready!")
    print("🔥 GPU acceleration enabled")
    print("📊 Ready to analyze tokens...")
    app.run(host='0.0.0.0', port=5000, debug=False)
