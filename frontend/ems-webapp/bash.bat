:: Step 1: Build the Docker image in Cloud Build using cloudbuild.yaml and substitutions
gcloud builds submit --config cloudbuild.yaml . ^
  --project=project-3a9ff029-3c42-45d1-970 ^
  --substitutions=_FIREBASE_PROJECT_ID=energy-management-system-fd6fb,_FIREBASE_API_KEY=AIzaSyBU_xkCYLHk7zfRZ2VI8VWaQvmexNi5tkk,_FIREBASE_AUTH_DOMAIN=energy-management-system-fd6fb.firebaseapp.com

:: Step 2: Deploy the newly built image to Cloud Run
gcloud run deploy ems-webapp ^
  --image gcr.io/project-3a9ff029-3c42-45d1-970/ems-webapp ^
  --project=project-3a9ff029-3c42-45d1-970 ^
  --allow-unauthenticated ^
  --set-build-env-vars=DOCKER_BUILDKIT=1 ^
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_PUBLISHABLE_KEY=SUPABASE_PUBLISHABLE_KEY:latest,MONGO_URI=MONGO_URI:latest,BACKEND_URL=BACKEND_URL:latest" ^
  --set-env-vars="NEXT_PUBLIC_FIREBASE_PROJECT_ID=energy-management-system-fd6fb,NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBU_xkCYLHk7zfRZ2VI8VWaQvmexNi5tkk,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=energy-management-system-fd6fb.firebaseapp.com" ^
  --region asia-southeast1
  
gcloud run services add-iam-policy-binding ems-webapp ^
  --project=project-3a9ff029-3c42-45d1-970 ^
  --region=asia-southeast1 ^
  --member="allUsers" ^
  --role="roles/run.invoker"