#!/bin/bash
echo "🔐 Generating SSL certificates for development..."

cd security/certificates

# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate signing request
openssl req -new -key private.key -out cert.csr \
  -subj "/C=US/ST=CA/L=San Francisco/O=GPU Swarm Trader/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in cert.csr -signkey private.key -out cert.pem

# Set proper permissions
chmod 600 private.key
chmod 644 cert.pem

# Clean up
rm cert.csr

echo "✅ SSL certificates generated"
echo "⚠️  These are self-signed certificates for development only!"
