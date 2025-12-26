-- ============================================================================
-- CLEAN RATING SYSTEM - FRESH START
-- This creates a simplified, working rating system from scratch
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: DROP ALL EXISTING TABLES (Clean slate)
-- ============================================================================

DROP TABLE IF EXISTS rent_company_reviews CASCADE;
DROP TABLE IF EXISTS landlord_reviews CASCADE;
DROP TABLE IF EXISTS building_reviews CASCADE;
DROP TABLE IF EXISTS neighborhood_reviews CASCADE;
DROP TABLE IF EXISTS rent_companies CASCADE;
DROP TABLE IF EXISTS landlords CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;

-- ============================================================================
-- STEP 2: CREATE ENTITY TABLES (Unique locations/people)
-- ============================================================================

-- Neighborhoods
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    slug TEXT UNIQUE,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    overall_rating NUMERIC(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buildings
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    slug TEXT UNIQUE,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    overall_rating NUMERIC(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landlords
CREATE TABLE landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    slug TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    profile_image TEXT,
    overall_rating NUMERIC(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rent Companies
CREATE TABLE rent_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    slug TEXT UNIQUE,
    website TEXT,
    email TEXT,
    phone TEXT,
    overall_rating NUMERIC(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE REVIEW TABLES (Individual user reviews)
-- ============================================================================

-- Neighborhood Reviews
CREATE TABLE neighborhood_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    images TEXT[],
    is_anonymous BOOLEAN DEFAULT false,
    display_name TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(neighborhood_id, user_id)
);

-- Building Reviews
CREATE TABLE building_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    images TEXT[],
    is_anonymous BOOLEAN DEFAULT false,
    display_name TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(building_id, user_id)
);

-- Landlord Reviews
CREATE TABLE landlord_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    images TEXT[],
    is_anonymous BOOLEAN DEFAULT false,
    display_name TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(landlord_id, user_id)
);

-- Rent Company Reviews
CREATE TABLE rent_company_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rent_company_id UUID REFERENCES rent_companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    images TEXT[],
    is_anonymous BOOLEAN DEFAULT false,
    display_name TEXT,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rent_company_id, user_id)
);

-- ============================================================================
-- STEP 4: CREATE AUTO-UPDATE FUNCTIONS
-- ============================================================================

-- Update Neighborhood Ratings
CREATE OR REPLACE FUNCTION update_neighborhood_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE neighborhoods
    SET
        overall_rating = COALESCE((
            SELECT AVG(overall_rating)::NUMERIC(3,2)
            FROM neighborhood_reviews
            WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                AND status = 'approved'
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM neighborhood_reviews
            WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                AND status = 'approved'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update Building Ratings
CREATE OR REPLACE FUNCTION update_building_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE buildings
    SET
        overall_rating = COALESCE((
            SELECT AVG(overall_rating)::NUMERIC(3,2)
            FROM building_reviews
            WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
                AND status = 'approved'
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM building_reviews
            WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
                AND status = 'approved'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.building_id, OLD.building_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update Landlord Ratings
CREATE OR REPLACE FUNCTION update_landlord_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE landlords
    SET
        overall_rating = COALESCE((
            SELECT AVG(overall_rating)::NUMERIC(3,2)
            FROM landlord_reviews
            WHERE landlord_id = COALESCE(NEW.landlord_id, OLD.landlord_id)
                AND status = 'approved'
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM landlord_reviews
            WHERE landlord_id = COALESCE(NEW.landlord_id, OLD.landlord_id)
                AND status = 'approved'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.landlord_id, OLD.landlord_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update Rent Company Ratings
CREATE OR REPLACE FUNCTION update_rent_company_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rent_companies
    SET
        overall_rating = COALESCE((
            SELECT AVG(overall_rating)::NUMERIC(3,2)
            FROM rent_company_reviews
            WHERE rent_company_id = COALESCE(NEW.rent_company_id, OLD.rent_company_id)
                AND status = 'approved'
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM rent_company_reviews
            WHERE rent_company_id = COALESCE(NEW.rent_company_id, OLD.rent_company_id)
                AND status = 'approved'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.rent_company_id, OLD.rent_company_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: CREATE TRIGGERS
-- ============================================================================

-- Neighborhood Triggers
DROP TRIGGER IF EXISTS update_neighborhood_ratings_trigger ON neighborhood_reviews;
CREATE TRIGGER update_neighborhood_ratings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON neighborhood_reviews
    FOR EACH ROW EXECUTE FUNCTION update_neighborhood_ratings();

-- Building Triggers
DROP TRIGGER IF EXISTS update_building_ratings_trigger ON building_reviews;
CREATE TRIGGER update_building_ratings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON building_reviews
    FOR EACH ROW EXECUTE FUNCTION update_building_ratings();

-- Landlord Triggers
DROP TRIGGER IF EXISTS update_landlord_ratings_trigger ON landlord_reviews;
CREATE TRIGGER update_landlord_ratings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON landlord_reviews
    FOR EACH ROW EXECUTE FUNCTION update_landlord_ratings();

-- Rent Company Triggers
DROP TRIGGER IF EXISTS update_rent_company_ratings_trigger ON rent_company_reviews;
CREATE TRIGGER update_rent_company_ratings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON rent_company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_rent_company_ratings();

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_neighborhoods_slug ON neighborhoods(slug);
CREATE INDEX idx_buildings_slug ON buildings(slug);
CREATE INDEX idx_landlords_slug ON landlords(slug);
CREATE INDEX idx_rent_companies_slug ON rent_companies(slug);

CREATE INDEX idx_neighborhood_reviews_neighborhood ON neighborhood_reviews(neighborhood_id);
CREATE INDEX idx_neighborhood_reviews_user ON neighborhood_reviews(user_id);
CREATE INDEX idx_neighborhood_reviews_status ON neighborhood_reviews(status);

CREATE INDEX idx_building_reviews_building ON building_reviews(building_id);
CREATE INDEX idx_building_reviews_user ON building_reviews(user_id);
CREATE INDEX idx_building_reviews_status ON building_reviews(status);

CREATE INDEX idx_landlord_reviews_landlord ON landlord_reviews(landlord_id);
CREATE INDEX idx_landlord_reviews_user ON landlord_reviews(user_id);
CREATE INDEX idx_landlord_reviews_status ON landlord_reviews(status);

CREATE INDEX idx_rent_company_reviews_company ON rent_company_reviews(rent_company_id);
CREATE INDEX idx_rent_company_reviews_user ON rent_company_reviews(user_id);
CREATE INDEX idx_rent_company_reviews_status ON rent_company_reviews(status);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '🎉 Clean rating system created successfully!' as status;
