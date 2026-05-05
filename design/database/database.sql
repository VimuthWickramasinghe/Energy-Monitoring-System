-- Metadata (Relational Structure)
CREATE TABLE "PROFILE" (
  "user_id" varchar(255) PRIMARY KEY,
  "user_name" varchar(255),
  "profile_pic_url" varchar(255),
  "role" varchar(50)
);

ALTER TABLE "PROFILE" ENABLE ROW LEVEL SECURITY;

-- Note: Supabase RLS using auth.uid() naturally works with Supabase Auth.
-- If you use Firebase Auth from a browser client, auth.uid() will be null.
-- For now, to allow Firebase frontend clients to read/write, we set these policies to true.
-- In production, manage this securely via a Next.js Server API route using the Service Role Key.
CREATE POLICY user_self_view_policy ON "PROFILE"
  FOR SELECT
  USING (true);

CREATE POLICY user_self_insert_policy ON "PROFILE"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY user_self_delete_policy ON "PROFILE"
  FOR DELETE
  USING (true);

CREATE POLICY user_self_update_policy ON "PROFILE"
  FOR UPDATE
  USING (true);

CREATE TABLE "BUILDING" (
  "building_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "building_name" varchar(255),
  "owner_id" varchar(255),
  "address" varchar(500),
  "added_on" timestamptz DEFAULT now(),
  CONSTRAINT "fk_building_owner" FOREIGN KEY ("owner_id") REFERENCES "PROFILE" ("user_id")
);

CREATE TABLE "MODULE" (
  "module_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_name" varchar(255),
  "owner_id" varchar(255),
  "building_id" UUID,
  "calibration_data" jsonb,
  "configured_at" timestamptz DEFAULT now(),
  "phase" int,
  CONSTRAINT "fk_module_owner" FOREIGN KEY ("owner_id") REFERENCES "PROFILE" ("user_id"),
  CONSTRAINT "fk_module_building" FOREIGN KEY ("building_id") REFERENCES "BUILDING" ("building_id")
);

-- Telemetry (PostgreSQL implementation)
CREATE TABLE "MEASUREMENTS" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "module_id" UUID,
  "timestamp" timestamptz DEFAULT now(),
  "voltage" double precision,
  "current" double precision,
  "instantaneous_power" double precision,
  CONSTRAINT "fk_meas_device" FOREIGN KEY ("module_id") REFERENCES "MODULE" ("module_id")
);