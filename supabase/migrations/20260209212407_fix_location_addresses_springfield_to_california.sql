/*
  # Fix Location Addresses - Replace Springfield IL with Correct CA Addresses

  1. Modified Tables
    - `locations` - Updated addresses for 6 test locations that had 
      placeholder "Springfield, IL" addresses
  
  2. Changes
    - Oakwood Recreation Center (Irvine): Updated to real Irvine, CA address
    - Main Sports Complex (Orange): Updated to real Orange, CA address
    - North Field Location (Fullerton): Updated to real Fullerton, CA address
    - Westside Sports Complex (Orange): Updated to real Orange, CA address
    - East Park Athletic Fields (Orange): Updated to real Orange, CA address
    - Springfield Community Center (RSM): Renamed to "RSM Community Center" 
      and updated to real Rancho Santa Margarita, CA address

  3. Important Notes
    - All lat/long coordinates were already correct for CA locations
    - Only address text fields are updated
    - No data is deleted or removed
*/

UPDATE locations
SET address = '1 Sunnyhill Dr, Irvine, CA 92618'
WHERE id = '00000000-0000-0000-0000-000000000103'
  AND name = 'Oakwood Recreation Center';

UPDATE locations
SET address = '170 N Glassell St, Orange, CA 92866'
WHERE id = '00000000-0000-0000-0000-000000000101'
  AND name = 'Main Sports Complex';

UPDATE locations
SET address = '340 W Commonwealth Ave, Fullerton, CA 92832'
WHERE id = '00000000-0000-0000-0000-000000000102'
  AND name = 'North Field Location';

UPDATE locations
SET address = '2901 W Chapman Ave, Orange, CA 92868'
WHERE id = '00000000-0000-0000-0000-000000000105'
  AND name = 'Westside Sports Complex';

UPDATE locations
SET address = '1045 E Katella Ave, Orange, CA 92867'
WHERE id = '00000000-0000-0000-0000-000000000106'
  AND name = 'East Park Athletic Fields';

UPDATE locations
SET name = 'RSM Community Center',
    address = '22772 Centre Dr, Rancho Santa Margarita, CA 92688'
WHERE id = '00000000-0000-0000-0000-000000000104'
  AND name = 'Springfield Community Center';
