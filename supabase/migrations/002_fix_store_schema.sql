-- Fix store_listings table structure and RPCs
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.store_listings ADD COLUMN install_command TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.store_listings ADD COLUMN avg_rating DECIMAL DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- RPC: increment_listing_stars
CREATE OR REPLACE FUNCTION public.increment_listing_stars(listing_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.store_listings SET star_count = star_count + 1 WHERE id = listing_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: decrement_listing_stars
CREATE OR REPLACE FUNCTION public.decrement_listing_stars(listing_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.store_listings SET star_count = GREATEST(0, star_count - 1) WHERE id = listing_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: increment_listing_downloads
CREATE OR REPLACE FUNCTION public.increment_listing_downloads(listing_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.store_listings SET download_count = download_count + 1 WHERE id = listing_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: recalc_listing_rating
CREATE OR REPLACE FUNCTION public.recalc_listing_rating(listing_id_param UUID)
RETURNS void AS $$
DECLARE
  new_avg DECIMAL;
BEGIN
  SELECT AVG(rating) INTO new_avg FROM public.reviews WHERE listing_id = listing_id_param;
  UPDATE public.store_listings SET avg_rating = COALESCE(new_avg, 0) WHERE id = listing_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
