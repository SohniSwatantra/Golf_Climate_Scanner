import { createClient } from '@libsql/client';

// Initialize Turso client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Database helper functions
export async function getCourseByName(name: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM golf_courses WHERE name LIKE ?',
    args: [`%${name}%`],
  });
  return result.rows[0] || null;
}

export async function getCourseById(id: number) {
  const result = await db.execute({
    sql: 'SELECT * FROM golf_courses WHERE id = ?',
    args: [id],
  });
  return result.rows[0] || null;
}

export async function searchCourses(query: string) {
  const searchTerm = `%${query}%`;
  const result = await db.execute({
    sql: `
      SELECT id, name, location, address, lat, lng, holes, website, phone
      FROM golf_courses
      WHERE name LIKE ? COLLATE NOCASE
         OR location LIKE ? COLLATE NOCASE
      ORDER BY
        CASE
          WHEN name LIKE ? COLLATE NOCASE THEN 1
          WHEN name LIKE ? COLLATE NOCASE THEN 2
          ELSE 3
        END,
        name
      LIMIT 10
    `,
    args: [searchTerm, searchTerm, query + '%', searchTerm],
  });
  return result.rows;
}

export async function getCoursesCount() {
  const result = await db.execute('SELECT COUNT(*) as count FROM golf_courses');
  return Number(result.rows[0]?.count || 0);
}

export async function createCourse(course: {
  name: string;
  location?: string;
  address?: string;
  lat?: number;
  lng?: number;
  holes?: number;
  area?: string;
  pdok_id?: string;
}) {
  const result = await db.execute({
    sql: `
      INSERT INTO golf_courses (name, location, address, lat, lng, holes, area, pdok_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      course.name,
      course.location || null,
      course.address || null,
      course.lat || null,
      course.lng || null,
      course.holes || null,
      course.area || null,
      course.pdok_id || null,
    ],
  });
  return result.lastInsertRowid;
}

export async function createScan(scan: {
  course_id: number;
  flood_score: number;
  flood_level: string;
  heat_score: number;
  heat_level: string;
  drought_score: number;
  drought_level: string;
  subsidence_score: number;
  subsidence_level: string;
  overall_score: number;
  overall_level: string;
  insights: string[];
  recommendations: string[];
  raw_data?: any;
}) {
  const result = await db.execute({
    sql: `
      INSERT INTO climate_scans 
      (course_id, flood_score, flood_level, heat_score, heat_level, drought_score, drought_level,
       subsidence_score, subsidence_level, overall_score, overall_level, insights, recommendations, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      scan.course_id,
      scan.flood_score,
      scan.flood_level,
      scan.heat_score,
      scan.heat_level,
      scan.drought_score,
      scan.drought_level,
      scan.subsidence_score,
      scan.subsidence_level,
      scan.overall_score,
      scan.overall_level,
      JSON.stringify(scan.insights),
      JSON.stringify(scan.recommendations),
      scan.raw_data ? JSON.stringify(scan.raw_data) : null,
    ],
  });
  return result.lastInsertRowid;
}

export async function getLatestScan(courseId: number) {
  const result = await db.execute({
    sql: `
      SELECT * FROM climate_scans 
      WHERE course_id = ? 
      ORDER BY scanned_at DESC 
      LIMIT 1
    `,
    args: [courseId],
  });

  const scan = result.rows[0] as any;
  if (scan) {
    scan.insights = JSON.parse(scan.insights || '[]');
    scan.recommendations = JSON.parse(scan.recommendations || '[]');
    scan.raw_data = scan.raw_data ? JSON.parse(scan.raw_data as string) : null;
  }
  return scan || null;
}

export async function logSearch(query: string, resultsCount: number) {
  await db.execute({
    sql: 'INSERT INTO search_history (query, results_count) VALUES (?, ?)',
    args: [query, resultsCount],
  });
}

export async function getAllCourses() {
  const result = await db.execute('SELECT * FROM golf_courses ORDER BY name');
  return result.rows;
}

export async function getRecentScans(limit = 10) {
  const result = await db.execute({
    sql: `
      SELECT cs.*, gc.name as course_name, gc.location
      FROM climate_scans cs
      JOIN golf_courses gc ON cs.course_id = gc.id
      ORDER BY cs.scanned_at DESC
      LIMIT ?
    `,
    args: [limit],
  });
  return result.rows;
}

export default db;
