-- products
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_sku text UNIQUE NOT NULL,
  asin text, listing_id text, product_id text, status text,
  category text, division text, licensing text, gender text,
  item_type text, property_description text, image_url text,
  item_type_attribute text, licensing_status text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bwp_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_bwp_cat ON products(category);
CREATE INDEX IF NOT EXISTS idx_bwp_lic ON products(licensing);
CREATE INDEX IF NOT EXISTS idx_bwp_prop ON products(property_description);

-- ad_performance (SP report uploads, joined to catalog by asin)
CREATE TABLE IF NOT EXISTS bw_ad_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name text,
  report_date text,
  asin text,
  advertised_sku text,
  campaign_name text,
  ad_group_name text,
  targeting text,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric DEFAULT 0,
  sales_14d numeric DEFAULT 0,
  orders_14d bigint DEFAULT 0,
  units_14d bigint DEFAULT 0,
  ctr numeric DEFAULT 0,
  acos numeric DEFAULT 0,
  roas numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bwad_asin ON bw_ad_performance(asin);
CREATE INDEX IF NOT EXISTS idx_bwad_batch ON bw_ad_performance(batch_name);

-- search terms
CREATE TABLE IF NOT EXISTS bw_search_terms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name text,
  report_date text,
  campaign_name text,
  ad_group_name text,
  targeting text,
  match_type text,
  search_term text,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric DEFAULT 0,
  sales_14d numeric DEFAULT 0,
  orders_14d bigint DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  acos numeric DEFAULT 0,
  roas numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bwst_term ON bw_search_terms(search_term);
CREATE INDEX IF NOT EXISTS idx_bwst_batch ON bw_search_terms(batch_name);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bw_ad_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE bw_search_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_products" ON products USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ads" ON bw_ad_performance USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_st" ON bw_search_terms USING (true) WITH CHECK (true);
