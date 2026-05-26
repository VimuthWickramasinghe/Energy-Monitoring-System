gcloud run deploy ems-webapp ^
  --source . ^
  --allow-unauthenticated ^
  --set-build-env-vars=DOCKER_BUILDKIT=1 ^
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_PUBLISHABLE_KEY:latest,MONGO_URI=MONGO_URI:latest" ^
  --region asia-southeast1

gcloud run services add-iam-policy-binding ems-webapp ^
  --region=asia-southeast1 ^
  --member="allUsers" ^
  --role="roles/run.invoker"