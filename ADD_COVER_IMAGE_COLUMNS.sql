-- Add cover_image column to neighborhoods and buildings tables if they don't exist

-- Check and add to neighborhoods
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'neighborhoods' AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE neighborhoods ADD COLUMN cover_image TEXT;
        RAISE NOTICE 'Added cover_image column to neighborhoods table';
    ELSE
        RAISE NOTICE 'cover_image column already exists in neighborhoods table';
    END IF;
END $$;

-- Check and add to buildings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buildings' AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE buildings ADD COLUMN cover_image TEXT;
        RAISE NOTICE 'Added cover_image column to buildings table';
    ELSE
        RAISE NOTICE 'cover_image column already exists in buildings table';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('neighborhoods', 'buildings') 
    AND column_name = 'cover_image'
ORDER BY table_name;


