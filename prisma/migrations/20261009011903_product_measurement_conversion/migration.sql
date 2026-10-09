ALTER TABLE "Product" ADD COLUMN measurement JSONB;
ALTER TABLE "Product" ADD CONSTRAINT product_measurement_valid CHECK (measurement IS NULL OR (jsonb_typeof(measurement)='object' AND measurement->>'baseUnit' IN ('L','kg','un') AND (measurement->>'factor')::numeric>0 AND (measurement->>'factor')::numeric<=1000000));
