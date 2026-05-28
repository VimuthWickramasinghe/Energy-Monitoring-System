gcloud run deploy ems-backend ^
  --source . ^
  --region asia-southeast1 ^
  --allow-unauthenticated ^
  --set-secrets="HARDWARE_API_KEY=HARDWARE_API_KEY:latest,MONGODB_URI=MONGO_URI:latest,SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_PUBLISHABLE_KEY=SUPABASE_PUBLISHABLE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest" ^
  --set-env-vars="NEXT_PUBLIC_FIREBASE_PROJECT_ID=energy-management-system-fd6fb"