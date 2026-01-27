import { NextRequest, NextResponse } from 'next/server';
import { logSearch, searchCourses, getCoursesCount } from '@/lib/db';

// PDOK Locatieserver API - Free Dutch geocoding (fallback)
const PDOK_SUGGEST_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest';

interface GolfCourseRow {
  id: number;
  name: string;
  location: string | null;
  address: string | null;
  lat: number;
  lng: number;
  holes: number | null;
  website: string | null;
  phone: string | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    // First, search local database for golf courses
    const courses = await searchCourses(query);

    if (courses.length > 0) {
      const localResults = courses.map((course: any) => ({
        id: `golf_${course.id}`,
        name: course.name,
        type: 'golf_course',
        location: course.location,
        address: course.address,
        holes: course.holes,
        website: course.website,
        phone: course.phone,
        centroid: course.lat && course.lng ? { lat: course.lat, lng: course.lng } : null,
        bbox: null,
      }));

      // Log the search
      await logSearch(query, localResults.length);

      const totalCourses = await getCoursesCount();

      return NextResponse.json({
        results: localResults,
        source: 'database',
        totalCourses,
      });
    }

    // Fallback to PDOK if no local results
    const pdokResults = await searchPDOK(query);

    // Log the search
    await logSearch(query, pdokResults.length);

    return NextResponse.json({
      results: pdokResults,
      source: 'pdok',
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search locations', details: String(error) },
      { status: 500 }
    );
  }
}

async function searchPDOK(query: string) {
  // Search PDOK for locations matching the query
  const pdokResponse = await fetch(
    `${PDOK_SUGGEST_URL}?q=${encodeURIComponent(query + ' golf')}&rows=10&fq=type:(adres OR perceel OR woonplaats)`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!pdokResponse.ok) {
    // Fallback to general search without golf filter
    const fallbackResponse = await fetch(`${PDOK_SUGGEST_URL}?q=${encodeURIComponent(query)}&rows=10`, {
      headers: { Accept: 'application/json' },
    });

    if (!fallbackResponse.ok) {
      throw new Error(`PDOK API error: ${fallbackResponse.status}`);
    }

    const fallbackData = await fallbackResponse.json();
    return parseResults(fallbackData);
  }

  const data = await pdokResponse.json();
  return parseResults(data);
}

function parseResults(data: any) {
  if (!data.response || !data.response.docs) {
    return [];
  }

  return data.response.docs.map((doc: any) => ({
    id: doc.id,
    name: doc.weergavenaam || doc.suggest,
    type: doc.type,
    score: doc.score,
    centroid: doc.centroide_ll ? parseCentroid(doc.centroide_ll) : null,
    bbox: doc.boundingbox_ll ? parseBbox(doc.boundingbox_ll) : null,
  }));
}

function parseCentroid(centroidStr: string) {
  // Format: "POINT(lng lat)"
  const match = centroidStr.match(/POINT\(([^ ]+) ([^)]+)\)/);
  if (match) {
    return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  }
  return null;
}

function parseBbox(bboxStr: string) {
  // Format: "POLYGON((minLng minLat, maxLng minLat, maxLng maxLat, minLng maxLat, minLng minLat))"
  const match = bboxStr.match(/POLYGON\(\(([^)]+)\)\)/);
  if (match) {
    const coords = match[1].split(',').map((c) => c.trim().split(' ').map(Number));
    if (coords.length >= 4) {
      return {
        minLng: coords[0][0],
        minLat: coords[0][1],
        maxLng: coords[2][0],
        maxLat: coords[2][1],
      };
    }
  }
  return null;
}
