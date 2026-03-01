# GCP Deployment Debugging Guide

## Overview

This guide provides comprehensive troubleshooting steps and CLI commands for debugging Google Cloud Platform deployments after running `setup-gcp.py`, `gcp_setup_core.py`, and `deploy-dev.py` scripts.

## Quick Diagnostic Commands

### 1. Service Status Check

```bash
# Check Cloud Run service status
gcloud run services describe rag-processor-dev --region=us-central1 --format="table(status.conditions[0].type,status.conditions[0].status,status.conditions[0].message)"

# Get service URL
gcloud run services describe rag-processor-dev --region=us-central1 --format="value(status.url)"

# List all Cloud Run services
gcloud run services list --region=us-central1
```

### 2. Recent Logs Analysis

```bash
# Get recent logs (last 1 hour)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rag-processor-dev" --limit=50 --freshness=1h

# Get error logs only
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rag-processor-dev AND (severity=ERROR OR textPayload:FATAL OR textPayload:failed OR textPayload:error)" --limit=20 --freshness=2h

# Get structured JSON logs with error details
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rag-processor-dev" --limit=20 --format=json --freshness=1h | jq -r '.[] | select(.jsonPayload != null) | "\(.timestamp) [\(.severity // "INFO")] \(.jsonPayload.message // .jsonPayload.event // .jsonPayload.error // .jsonPayload)"'

# Follow logs in real-time
gcloud run logs read rag-processor-dev --region=us-central1 --follow
```

### 3. Secret Manager Verification

```bash
# List all secrets
gcloud secrets list

# Check specific secret versions
gcloud secrets versions list database-url-dev --limit=5

# Verify secret content (be careful - this shows the actual secret!)
gcloud secrets versions access latest --secret=database-url-dev

# Check for newlines in secrets (common issue)
gcloud secrets versions access latest --secret=database-url-dev | hexdump -C
```

### 4. Service Account Permissions

```bash
# Check service account exists
gcloud iam service-accounts describe rag-processor-dev@PROJECT_ID.iam.gserviceaccount.com

# List IAM policies for the project
gcloud projects get-iam-policy PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role,bindings.members)"

# Check secret access permissions
gcloud secrets get-iam-policy database-url-dev
gcloud secrets get-iam-policy rag-processor-dev-api-key
```

## Common Issues and Solutions

### 1. Database Connection Errors

#### Symptoms

```
FATAL: database "postgres\n" does not exist
server didn't return client encoding
connection to server failed
```

#### Debugging Commands

```bash
# Check current database URL
gcloud secrets versions access latest --secret=database-url-dev

# Test for trailing newlines (common cause)
gcloud secrets versions access latest --secret=database-url-dev | hexdump -C

# Check if using correct port (5432 vs 6543)
gcloud secrets versions access latest --secret=database-url-dev | grep -o ':[0-9]*/'
```

#### Solutions

```bash
# Fix trailing newline in secret (CRITICAL: use printf, not echo)
printf "postgresql://postgres:password@host:5432/postgres" | gcloud secrets versions add database-url-dev --data-file=-

# Switch from pooler (6543) to direct connection (5432)
# Change: @host:6543/postgres to @host:5432/postgres

# Restart service to pick up new secret
gcloud run services update rag-processor-dev --region=us-central1 --update-env-vars=RESTART_TIMESTAMP=$(date +%s)
```

**⚠️ CRITICAL: Secret Creation Best Practice**

```bash
# ❌ WRONG - echo adds trailing newline causing "database postgres\n does not exist"
echo "secret_value" | gcloud secrets versions add secret-name --data-file=-

# ✅ CORRECT - printf avoids trailing newline
printf "secret_value" | gcloud secrets versions add secret-name --data-file=-
```

### 2. Service Authentication Issues

#### Symptoms

```
Permission denied on secret
403 Forbidden
Service account does not have permission
```

#### Debugging Commands

```bash
# Check if service account has secret access
gcloud secrets get-iam-policy database-url-dev --format="table(bindings.role,bindings.members)"

# Verify service account email format
echo "rag-processor-dev@$(gcloud config get-value project).iam.gserviceaccount.com"

# Check Cloud Run service configuration
gcloud run services describe rag-processor-dev --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"
```

#### Solutions

```bash
# Grant secret access to service account
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="rag-processor-dev@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud secrets add-iam-policy-binding database-url-dev \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding rag-processor-dev-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. EventArc Trigger Issues

#### Symptoms

```
File uploads not triggering processing
EventArc trigger not found
Permission denied for EventArc
```

#### Debugging Commands

```bash
# List EventArc triggers
gcloud eventarc triggers list --location=us-central1

# Check specific trigger details
gcloud eventarc triggers describe rag-processor-trigger-dev --location=us-central1

# Check EventArc service account permissions
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
echo "EventArc SA: service-${PROJECT_NUMBER}@gcp-sa-eventarc.iam.gserviceaccount.com"

# Check bucket permissions
gcloud storage buckets get-iam-policy gs://your-bucket-name
```

#### Solutions

```bash
# Recreate EventArc trigger
gcloud eventarc triggers delete rag-processor-trigger-dev --location=us-central1 --quiet

# Get project details
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
EVENTARC_SA="service-${PROJECT_NUMBER}@gcp-sa-eventarc.iam.gserviceaccount.com"
SERVICE_ACCOUNT="rag-processor-dev@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${EVENTARC_SA}" \
    --role="roles/pubsub.publisher"

# Recreate trigger
gcloud eventarc triggers create rag-processor-trigger-dev \
    --destination-run-service=rag-processor-dev \
    --destination-run-region=us-central1 \
    --destination-run-path=/ \
    --event-filters="type=google.cloud.storage.object.v1.finalized" \
    --event-filters="bucket=your-bucket-name" \
    --location=us-central1 \
    --service-account=${SERVICE_ACCOUNT}
```

### 4. Storage Bucket Issues

#### Symptoms

```
Bucket not found
Access denied to bucket
CORS errors
```

#### Debugging Commands

```bash
# Check bucket exists
gcloud storage ls gs://your-bucket-name/

# Check bucket permissions
gcloud storage buckets get-iam-policy gs://your-bucket-name

# Check CORS configuration
gcloud storage buckets describe gs://your-bucket-name --format="value(cors)"

# Test file upload
echo "test content" | gcloud storage cp - gs://your-bucket-name/test-file.txt
```

#### Solutions

```bash
# Create bucket if missing
PROJECT_ID=$(gcloud config get-value project)
BUCKET_NAME="${PROJECT_ID}-rag-documents-dev"
gcloud storage buckets create gs://$BUCKET_NAME --project=$PROJECT_ID --location=us-central1

# Set bucket permissions
SERVICE_ACCOUNT="rag-processor-dev@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member=serviceAccount:${SERVICE_ACCOUNT} --role=roles/storage.objectAdmin

# Configure CORS
cat > cors-config.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization", "Range"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=cors-config.json
rm cors-config.json
```

### 5. API and Service Enablement Issues

#### Symptoms

```
API not enabled
Service not found
Quota exceeded
```

#### Debugging Commands

```bash
# Check enabled APIs
gcloud services list --enabled --filter="name:cloudbuild OR name:run OR name:storage OR name:secretmanager OR name:eventarc OR name:aiplatform"

# Check API quotas
gcloud compute project-info describe --format="table(quotas.metric,quotas.limit,quotas.usage)"

# Check billing account
gcloud beta billing accounts list
gcloud beta billing projects describe $(gcloud config get-value project)
```

#### Solutions

```bash
# Enable all required APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    eventarc.googleapis.com \
    aiplatform.googleapis.com \
    speech.googleapis.com \
    pubsub.googleapis.com
```

## Advanced Debugging Techniques

### 1. Test Service Manually

```bash
# Get service URL and API key
SERVICE_URL=$(gcloud run services describe rag-processor-dev --region=us-central1 --format="value(status.url)")
API_KEY=$(gcloud secrets versions access latest --secret=rag-processor-dev-api-key)

# Test health endpoint
curl -X GET "${SERVICE_URL}/health" \
    -H "X-API-Key: ${API_KEY}" \
    -v

# Test with a simple file upload
curl -X POST "${SERVICE_URL}/" \
    -H "X-API-Key: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"message": {"data": "dGVzdA==", "attributes": {"bucketId": "test-bucket", "objectId": "test-file.txt"}}}' \
    -v
```

### 2. Monitor Resource Usage

```bash
# Check Cloud Run metrics
gcloud run services describe rag-processor-dev --region=us-central1 --format="table(status.traffic[].revisionName,status.traffic[].percent)"

# Check recent revisions
gcloud run revisions list --service=rag-processor-dev --region=us-central1 --limit=5

# Monitor costs
gcloud billing budgets list --billing-account=$(gcloud beta billing projects describe $(gcloud config get-value project) --format="value(billingAccountName.segment(1))")
```

### 3. Environment Variable Debugging

```bash
# Check environment variables in Cloud Run
gcloud run services describe rag-processor-dev --region=us-central1 --format="table(spec.template.spec.template.spec.containers[].env[].name,spec.template.spec.template.spec.containers[].env[].value)"

# Check secrets configuration
gcloud run services describe rag-processor-dev --region=us-central1 --format="table(spec.template.spec.template.spec.containers[].env[].valueFrom.secretKeyRef.name,spec.template.spec.template.spec.containers[].env[].valueFrom.secretKeyRef.key)"
```

## Preventive Monitoring

### 1. Set Up Log-Based Alerts

```bash
# Create error rate alert
gcloud alpha logging metrics create error_rate_metric \
    --description="Error rate for RAG processor" \
    --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="rag-processor-dev" AND severity="ERROR"'
```

### 2. Regular Health Checks

```bash
# Create a simple health check script
cat > health_check.sh << 'EOF'
#!/bin/bash
SERVICE_URL=$(gcloud run services describe rag-processor-dev --region=us-central1 --format="value(status.url)")
API_KEY=$(gcloud secrets versions access latest --secret=rag-processor-dev-api-key)

if curl -s -f -X GET "${SERVICE_URL}/health" -H "X-API-Key: ${API_KEY}" > /dev/null; then
    echo "✅ Service is healthy"
    exit 0
else
    echo "❌ Service health check failed"
    exit 1
fi
EOF
chmod +x health_check.sh
```

## Recovery Procedures

### 1. Complete Service Reset

```bash
# Delete and recreate service (nuclear option)
gcloud run services delete rag-processor-dev --region=us-central1 --quiet

# Redeploy using deployment script
python deploy-dev.py
```

### 2. Secret Rotation

```bash
# Generate new API key
NEW_API_KEY="sk_live_$(openssl rand -base64 32)"

# Update secret
printf "$NEW_API_KEY" | gcloud secrets versions add rag-processor-dev-api-key --data-file=-

# Restart service
gcloud run services update rag-processor-dev --region=us-central1 --update-env-vars=RESTART_TIMESTAMP=$(date +%s)
```

### 3. Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service=rag-processor-dev --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic rag-processor-dev --region=us-central1 --to-revisions=REVISION_NAME=100
```

## Getting Help

### 1. Useful Documentation Links

- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [EventArc Troubleshooting](https://cloud.google.com/eventarc/docs/troubleshooting)

### 2. Support Channels

- Google Cloud Support Console
- Stack Overflow with `google-cloud-platform` tag
- Google Cloud Community Slack

### 3. Emergency Contacts

- On-call engineer: [Your contact info]
- Project owner: [Your contact info]
- Billing admin: [Your contact info]

---

## Troubleshooting Checklist

When debugging issues, work through this checklist:

- [ ] Check service status with `gcloud run services describe`
- [ ] Review recent logs for errors
- [ ] Verify secrets are correctly formatted (no trailing newlines)
- [ ] Confirm service account has proper permissions
- [ ] Test database connectivity separately
- [ ] Verify EventArc trigger configuration
- [ ] Check bucket permissions and CORS
- [ ] Validate environment variables
- [ ] Test service endpoints manually
- [ ] Monitor resource usage and quotas

Remember: Most issues are related to permissions, secret formatting, or network connectivity. Start with the basics before diving into complex debugging.
