CREATE OR REPLACE FUNCTION validate_tenant_references() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path FROM CURRENT AS $fn$
DECLARE item jsonb; row_data jsonb;
BEGIN
 row_data=to_jsonb(NEW);
 IF TG_TABLE_NAME='Sale' THEN
  IF row_data->>'customerId'<>'default' AND NOT EXISTS(SELECT 1 FROM "Customer" WHERE id=row_data->>'customerId' AND "storeId"=row_data->>'storeId') THEN RAISE EXCEPTION 'Customer belongs to another store or does not exist';END IF;
 END IF;
 IF TG_TABLE_NAME IN ('Sale','PurchaseOrder','StockEntryLog') THEN
  IF jsonb_typeof(row_data->'items')<>'array' THEN RAISE EXCEPTION 'Items must be an array';END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(row_data->'items') LOOP
   IF NOT EXISTS(SELECT 1 FROM "Product" WHERE id=item->>'productId' AND "storeId"=row_data->>'storeId') THEN RAISE EXCEPTION 'Product belongs to another store or does not exist';END IF;
  END LOOP;
 END IF;
 IF TG_TABLE_NAME='CashTransaction' THEN
  IF row_data->>'customerId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "Customer" WHERE id=row_data->>'customerId' AND "storeId"=row_data->>'storeId') THEN RAISE EXCEPTION 'Customer belongs to another store or does not exist';END IF;
 END IF;
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION validate_tenant_references() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION validate_tenant_references() TO alvorada_runtime;
