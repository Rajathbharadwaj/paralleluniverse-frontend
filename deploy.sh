#!/bin/bash

# =============================================================================
# Cloud Build Deployment Script for Parallel Universe Frontend
# =============================================================================
#
# WHEN TO USE THIS SCRIPT:
#   - After making code changes to frontend components
#   - After fixing bugs that need to be deployed to production
#   - To redeploy after a failed deployment
#
# USAGE:
#   ./deploy.sh
#
# WHAT THIS SCRIPT DOES:
#   1. Fetches Clerk keys from Google Secret Manager
#   2. Builds the Docker image with build-time arguments (NEXT_PUBLIC_* vars)
#   3. Deploys to Cloud Run
#
# PREREQUISITES:
#   - gcloud CLI authenticated with parallel-universe-prod project
#   - Secrets configured in Google Secret Manager
#
# =============================================================================

set -e

PROJECT_ID="parallel-universe-prod"
REGION="us-central1"

echo "🚀 Deploying frontend to Cloud Run..."
echo "============================================"

# Fetch secrets from Google Secret Manager
echo "🔐 Fetching secrets from Secret Manager..."
CLERK_PUBLISHABLE=$(gcloud secrets versions access latest --secret=clerk-publishable-key --project=$PROJECT_ID)
CLERK_SECRET=$(gcloud secrets versions access latest --secret=clerk-secret-key --project=$PROJECT_ID)
LANGGRAPH_URL=$(gcloud secrets versions access latest --secret=langgraph-url --project=$PROJECT_ID)
LANGGRAPH_API_KEY=$(gcloud secrets versions access latest --secret=langgraph-api-key --project=$PROJECT_ID)
STRIPE_PUBLISHABLE=$(gcloud secrets versions access latest --secret=stripe-publishable-key --project=$PROJECT_ID)

echo "📦 Building and deploying with Cloud Build..."

gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions="_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE,_CLERK_SECRET_KEY=$CLERK_SECRET,_NEXT_PUBLIC_LANGGRAPH_URL=$LANGGRAPH_URL,_NEXT_PUBLIC_LANGGRAPH_API_KEY=$LANGGRAPH_API_KEY,_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE"

echo ""
echo "✅ Deployment complete!"
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."
SERVICE_URL=$(gcloud run services describe frontend \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo "📡 Service URL: $SERVICE_URL"

# Health check
echo "🏥 Running health check..."
HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/" 2>&1 || echo "FAILED")
if echo "$HEALTH_RESPONSE" | grep -q -i "parallel"; then
  echo "✅ Health check passed!"
else
  echo "⚠️  Health check response: $(echo $HEALTH_RESPONSE | head -c 200)"
fi

echo ""
echo "🎉 Done! Frontend deployed to: $SERVICE_URL"
