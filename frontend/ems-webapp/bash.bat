gcloud run deploy ems-webapp ^
  --source . ^
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_PUBLISHABLE_KEY:latest,MONGO_URI=MONGO_URI:latest" ^
  --set-build-env-vars=DOCKER_BUILDKIT=1 ^
  --region asia-south1

gcloud run services add-iam-policy-binding ems-webapp ^
  --region=asia-east2 ^
  --member="allUsers" ^
  --role="roles/run.invoker"