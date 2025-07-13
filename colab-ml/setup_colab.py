# Run this in Google Colab
import subprocess
import sys

print("🔧 Setting up Colab ML Backend...")

# Install required packages
packages = [
    'flask',
    'flask-cors', 
    'torch',
    'numpy',
    'pandas',
    'requests'
]

for package in packages:
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

print("✅ Packages installed!")

# Install ngrok for public URL
subprocess.check_call([sys.executable, "-m", "pip", "install", "pyngrok"])

from pyngrok import ngrok

# Set up ngrok tunnel
public_url = ngrok.connect(5000)
print(f"🌐 Public URL: {public_url}")

# Save the URL for your local app to use
with open('ml_backend_url.txt', 'w') as f:
    f.write(str(public_url))

print("🚀 Now run crypto_ml_backend.py to start the ML service!")
