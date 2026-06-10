gcloud run deploy ems-webapp ^
  --source . ^
  --allow-unauthenticated ^
  --set-build-env-vars=DOCKER_BUILDKIT=1 ^
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_PUBLISHABLE_KEY=SUPABASE_PUBLISHABLE_KEY:latest,MONGO_URI=MONGO_URI:latest,BACKEND_URL=BACKEND_URL:latest" ^
  --set-env-vars="NEXT_PUBLIC_FIREBASE_PROJECT_ID=energy-management-system-fd6fb,NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBU_xkCYLHk7zfRZ2VI8VWaQvmexNi5tkk" ^
  --region asia-southeast1

gcloud run services add-iam-policy-binding ems-webapp ^
  --region=asia-southeast1 ^
  --member="allUsers" ^
  --role="roles/run.invoker"