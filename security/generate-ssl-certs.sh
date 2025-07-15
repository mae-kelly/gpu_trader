#!/bin/bash

echo "🔐 Generating SSL certificates for development..."

mkdir -p certificates

# Generate private key
openssl genrsa -out certificates/private.key 2048

# Generate certificate signing request
openssl req -new -key certificates/private.key -out certificates/cert.csr -subj "/C=US/ST=CA/L=San Francisco/O=GPU Swarm Trader/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in certificates/cert.csr -signkey certificates/private.key -out certificates/cert.pem

echo "✅ SSL certificates generated in security/certificates/"
echo "⚠️  These are self-signed certificates for development only!"
echo "🔒 Use proper CA-signed certificates in production"

# Set proper permissions
chmod 600 certificates/private.key
chmod 644 certificates/cert.pem

rm certificates/cert.csr
