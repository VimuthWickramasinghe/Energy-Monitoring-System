-- Metadata (Relational Structure)
CREATE TABLE "PROFILE" (
  "user_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_name" varchar(255),
  "profile_pic_url" varchar(255),
  "role" varchar(50)
);

ALTER TABLE "PROFILE" ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_self_view_policy ON "PROFILE"
  FOR SELECT
  USING (user_id = auth.uid());

CREATE TABLE "BUILDING" (
  "building_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "building_name" varchar(255),
  "owner_id" UUID,
  "address" varchar(500),
  "added_on" timestamptz DEFAULT now(),
  CONSTRAINT "fk_building_owner" FOREIGN KEY ("owner_id") REFERENCES "PROFILE" ("user_id")
);

CREATE TABLE "MODULE" (
  "module_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_name" varchar(255),
  "owner_id" UUID,
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