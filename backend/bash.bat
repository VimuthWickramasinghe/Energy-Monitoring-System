gcloud run deploy ems-backend ^
  --source . ^
  --region asia-southeast1 ^
  --allow-unauthenticated ^
  --set-secrets="MONGO_URI=MONGO_URI:latest,SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_PUBLISHABLE_KEY=SUPABASE_PUBLISHABLE_KEY:latest"