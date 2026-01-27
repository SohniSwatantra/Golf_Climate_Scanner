/**
 * Seed script to populate the database with Dutch golf courses from OpenStreetMap
 *
 * Uses the Overpass API to fetch all golf courses in the Netherlands
 * Run with: npx tsx scripts/seed-golf-courses.ts
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'golf-climate.db');
const db = new Database(dbPath);

// Overpass API endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Overpass query for Dutch golf courses
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["ISO3166-1"="NL"]->.netherlands;
(
  // Golf courses as ways (polygons)
  way["leisure"="golf_course"](area.netherlands);
  // Golf courses as relations
  relation["leisure"="golf_course"](area.netherlands);
  // Golf courses as nodes (less common but possible)
  node["leisure"="golf_course"](area.netherlands);
);
out center tags;
`;

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:nl'?: string;
    website?: string;
    phone?: string;
    'contact:website'?: string;
    'contact:phone'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:postcode'?: string;
    'addr:city'?: string;
    holes?: string;
    operator?: string;
    description?: string;
  };
}

interface GolfCourse {
  name: string;
  location: string | null;
  address: string | null;
  lat: number;
  lng: number;
  holes: number | null;
  area: string | null;
  osm_id: string;
  website: string | null;
  phone: string | null;
}

async function fetchGolfCourses(): Promise<OSMElement[]> {
  console.log('🔍 Fetching golf courses from OpenStreetMap...');

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.elements || [];
}

function parseGolfCourse(element: OSMElement): GolfCourse | null {
  const tags = element.tags || {};

  // Get coordinates (center for ways/relations, direct for nodes)
  let lat: number | undefined;
  let lng: number | undefined;

  if (element.type === 'node') {
    lat = element.lat;
    lng = element.lon;
  } else if (element.center) {
    lat = element.center.lat;
    lng = element.center.lon;
  }

  // Skip if no coordinates
  if (!lat || !lng) {
    return null;
  }

  // Get name (prefer Dutch name, fallback to generic name)
  const name = tags['name:nl'] || tags.name || tags['name:en'];

  // Skip unnamed golf courses
  if (!name) {
    return null;
  }

  // Build address from components
  let address: string | null = null;
  const addressParts: string[] = [];

  if (tags['addr:street']) {
    let streetAddress = tags['addr:street'];
    if (tags['addr:housenumber']) {
      streetAddress += ' ' + tags['addr:housenumber'];
    }
    addressParts.push(streetAddress);
  }
  if (tags['addr:postcode']) {
    addressParts.push(tags['addr:postcode']);
  }
  if (tags['addr:city']) {
    addressParts.push(tags['addr:city']);
  }

  if (addressParts.length > 0) {
    address = addressParts.join(', ');
  }

  // Parse holes (could be "18", "9", "27", etc.)
  let holes: number | null = null;
  if (tags.holes) {
    const parsed = parseInt(tags.holes, 10);
    if (!isNaN(parsed)) {
      holes = parsed;
    }
  }

  // Get website and phone
  const website = tags.website || tags['contact:website'] || null;
  const phone = tags.phone || tags['contact:phone'] || null;

  // Location/city
  const location = tags['addr:city'] || null;

  return {
    name,
    location,
    address,
    lat,
    lng,
    holes,
    area: tags.operator || null,
    osm_id: `${element.type}/${element.id}`,
    website,
    phone,
  };
}

async function seedDatabase() {
  console.log('🏌️ Golf Course Database Seeder');
  console.log('================================\n');

  try {
    // Fetch golf courses from OSM
    const elements = await fetchGolfCourses();
    console.log(`📍 Found ${elements.length} golf course elements in OSM\n`);

    // Parse and filter valid courses
    const courses: GolfCourse[] = [];
    for (const element of elements) {
      const course = parseGolfCourse(element);
      if (course) {
        courses.push(course);
      }
    }

    console.log(`✅ Parsed ${courses.length} valid golf courses with names and coordinates\n`);

    // Add osm_id and website/phone columns if they don't exist
    try {
      db.exec('ALTER TABLE golf_courses ADD COLUMN osm_id TEXT');
    } catch (e) {
      // Column might already exist
    }
    try {
      db.exec('ALTER TABLE golf_courses ADD COLUMN website TEXT');
    } catch (e) {
      // Column might already exist
    }
    try {
      db.exec('ALTER TABLE golf_courses ADD COLUMN phone TEXT');
    } catch (e) {
      // Column might already exist
    }

    // Create index on osm_id for duplicate checking
    try {
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_osm_id ON golf_courses(osm_id)');
    } catch (e) {
      // Index might already exist
    }

    // Prepare insert statement with upsert
    const insertStmt = db.prepare(`
      INSERT INTO golf_courses (name, location, address, lat, lng, holes, area, osm_id, website, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(osm_id) DO UPDATE SET
        name = excluded.name,
        location = excluded.location,
        address = excluded.address,
        lat = excluded.lat,
        lng = excluded.lng,
        holes = excluded.holes,
        area = excluded.area,
        website = excluded.website,
        phone = excluded.phone,
        updated_at = CURRENT_TIMESTAMP
    `);

    // Insert courses in a transaction
    let inserted = 0;
    let updated = 0;

    const insertMany = db.transaction((courses: GolfCourse[]) => {
      for (const course of courses) {
        // Check if exists
        const existing = db.prepare('SELECT id FROM golf_courses WHERE osm_id = ?').get(course.osm_id);

        insertStmt.run(
          course.name,
          course.location,
          course.address,
          course.lat,
          course.lng,
          course.holes,
          course.area,
          course.osm_id,
          course.website,
          course.phone
        );

        if (existing) {
          updated++;
        } else {
          inserted++;
        }
      }
    });

    insertMany(courses);

    console.log(`📊 Database updated:`);
    console.log(`   - New courses inserted: ${inserted}`);
    console.log(`   - Existing courses updated: ${updated}`);

    // Show total count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM golf_courses').get() as { count: number };
    console.log(`   - Total courses in database: ${totalCount.count}\n`);

    // Show sample courses
    console.log('📋 Sample courses:');
    const samples = db.prepare('SELECT name, location, lat, lng, holes FROM golf_courses ORDER BY name LIMIT 10').all() as any[];
    samples.forEach((course, i) => {
      console.log(`   ${i + 1}. ${course.name} (${course.location || 'Unknown location'}) - ${course.holes || '?'} holes`);
    });

    console.log('\n✨ Seeding complete!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
