-- Metadata (Relational Structure)
CREATE TABLE "USER" (
  "user_id" UUID PRIMARY KEY,
  "user_name" varchar(255),
  "profile_pic_url" varchar(255),
  "role" varchar(50)
);

CREATE TABLE "BUILDING" (
  "building_id" UUID PRIMARY KEY,
  "building_name" varchar(255),
  "owner_id" UUID,
  "address" varchar(500),
  "added_on" datetime,
  CONSTRAINT "fk_building_owner" FOREIGN KEY ("owner_id") REFERENCES "USER" ("user_id")
);

CREATE TABLE "DEVICE" (
  "device_id" UUID PRIMARY KEY,
  "device_name" varchar(255),
  "owner_id" UUID,
  "building_id" UUID,
  "calibration_data" json,
  "configured_at" datetime,
  "phase" int,
  CONSTRAINT "fk_device_owner" FOREIGN KEY ("owner_id") REFERENCES "USER" ("user_id"),
  CONSTRAINT "fk_device_building" FOREIGN KEY ("building_id") REFERENCES "BUILDING" ("building_id")
);

-- Telemetry (Time-Series / MongoDB Mock for Diagram)
CREATE TABLE "MEASUREMENTS" (
  "_id" varchar(24) PRIMARY KEY, -- ObjectId representation
  "device_id" UUID,
  "timestamp" datetime,
  "voltage" float,
  "current" float,
  "instantaneous_power" float,
  CONSTRAINT "fk_meas_device" FOREIGN KEY ("device_id") REFERENCES "DEVICE" ("device_id")
);