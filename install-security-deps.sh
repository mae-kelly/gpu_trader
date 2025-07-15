#!/bin/bash

echo "📦 Installing security dependencies..."

# Install new dependencies
npm install jsonwebtoken bcryptjs joi helmet express-rate-limit express-validator node-forge ws-rate-limit
npm install -D @types/bcryptjs @types/jsonwebtoken @types/node-forge

echo "✅ Security dependencies installed"

# Initialize database
echo "🗄️ Setting up database..."
if command -v psql &> /dev/null; then
    echo "Creating database..."
    createdb gpuswarm_prod || echo "Database may already exist"
    psql -d gpuswarm_prod -f database/init-database.sql
    echo "✅ Database initialized"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL and run:"
    echo "   psql -d gpuswarm_prod -f database/init-database.sql"
fi

# Generate SSL certificates for development
./security/generate-ssl-certs.sh

echo "🎉 Security setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your actual API keys and secrets"
echo "2. Set up your production database"
echo "3. Configure proper SSL certificates for production"
echo "4. Review and customize the authentication flows"
echo "5. Test the security features thoroughly"
