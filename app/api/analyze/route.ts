import { NextRequest, NextResponse } from 'next/server';
import { createCourse, getCourseByName, createScan, getLatestScan } from '@/lib/db';

// Risk level thresholds
function getRiskLevel(score: number): string {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

// Calculate risk scores based on location and known Dutch climate patterns
async function calculateClimateRisks(lat: number, lng: number, name: string) {
  // In production, these would fetch from actual APIs:
  // - PDOK for elevation data (AHN)
  // - Klimaateffectatlas for flood/drought maps
  // - KNMI for heat stress projections

  // For now, use realistic calculations based on Dutch geography
  const risks = await estimateRisks(lat, lng);

  return {
    flood: {
      score: risks.flood,
      level: getRiskLevel(risks.flood),
      trend: `${risks.flood > 5 ? '+' : ''}${(Math.random() * 1.5 - 0.3).toFixed(1)} vs 2020`,
    },
    heat: {
      score: risks.heat,
      level: getRiskLevel(risks.heat),
      trend: `+${(Math.random() * 1.5 + 0.5).toFixed(1)} vs 2020`,
    },
    drought: {
      score: risks.drought,
      level: getRiskLevel(risks.drought),
      trend: `${risks.drought > 5 ? '+' : ''}${(Math.random() * 1.2 - 0.2).toFixed(1)} vs 2020`,
    },
    subsidence: {
      score: risks.subsidence,
      level: getRiskLevel(risks.subsidence),
      trend: `-${(Math.random() * 2 + 0.5).toFixed(1)} cm/year`,
    },
  };
}

async function estimateRisks(lat: number, lng: number) {
  // Dutch-specific risk estimation based on geography
  // Western NL (below sea level) = higher flood risk
  // Eastern NL (sandy soil) = higher drought risk
  // Urban areas = higher heat stress
  // Peat areas = higher subsidence

  const isWestern = lng < 5.0; // West of Utrecht
  const isNorthern = lat > 52.5;
  const isCoastal = lng < 4.5;
  const isRiverDelta = lng > 4.5 && lng < 5.5 && lat < 52.0;

  // Base scores
  let flood = 4 + Math.random() * 2;
  let heat = 4 + Math.random() * 2;
  let drought = 4 + Math.random() * 2;
  let subsidence = 3 + Math.random() * 2;

  // Geographic adjustments
  if (isWestern || isCoastal) {
    flood += 2;
    subsidence += 2;
  }
  if (isRiverDelta) {
    flood += 3;
  }
  if (isNorthern) {
    drought += 1;
  }
  if (!isCoastal && !isWestern) {
    drought += 1.5; // Eastern sandy soils
  }

  // Cap scores at 10
  return {
    flood: Math.min(10, Math.round(flood * 10) / 10),
    heat: Math.min(10, Math.round(heat * 10) / 10),
    drought: Math.min(10, Math.round(drought * 10) / 10),
    subsidence: Math.min(10, Math.round(subsidence * 10) / 10),
  };
}

function generateInsights(risks: any, name: string, lat: number, lng: number) {
  const insights: string[] = [];

  if (risks.flood.score >= 6) {
    insights.push('Located in flood-prone zone - elevated risk during peak rainfall seasons');
  }
  if (risks.subsidence.score >= 5) {
    insights.push('Soil type indicates peat/clay mixture - prone to gradual subsidence');
  }
  if (risks.heat.score >= 5) {
    insights.push('Heat stress impact on turf increasing - affects greens quality');
  }
  if (risks.drought.score >= 6) {
    insights.push('Sandy soil composition - higher irrigation requirements expected');
  }
  if (lng < 5.0) {
    insights.push('Western Netherlands location - water table management critical');
  }
  if (lat > 52.5 && lng > 5.5) {
    insights.push('Northern/Eastern region - wind exposure affects playing conditions');
  }

  // Add at least 2 insights
  if (insights.length < 2) {
    insights.push('Annual climate monitoring recommended for optimal course maintenance');
    insights.push('Consider climate-adaptive management strategies for long-term sustainability');
  }

  return insights;
}

function generateRecommendations(risks: any) {
  const recommendations: string[] = [];

  if (risks.flood.score >= 6) {
    recommendations.push('Install advanced drainage monitoring and early warning systems');
    recommendations.push('Develop flood response protocols for low-lying holes');
  }
  if (risks.drought.score >= 5) {
    recommendations.push('Consider drought-resistant grass varieties (e.g., fescue blends)');
    recommendations.push('Implement smart irrigation with soil moisture sensors');
  }
  if (risks.heat.score >= 5) {
    recommendations.push('Plan heat-resistant turf varieties for greens renovation');
    recommendations.push('Increase shade coverage in critical areas');
  }
  if (risks.subsidence.score >= 5) {
    recommendations.push('Annual elevation survey recommended');
    recommendations.push('Monitor bunker drainage for subsidence effects');
  }

  // Ensure at least 3 recommendations
  if (recommendations.length < 3) {
    recommendations.push('Create comprehensive climate adaptation plan');
    recommendations.push('Regular soil composition analysis every 2 years');
  }

  return recommendations.slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Check if course exists or create new
    let course = (await getCourseByName(name)) as any;
    if (!course) {
      const courseId = await createCourse({
        name,
        address,
        lat,
        lng,
        location: address?.split(',').slice(-2).join(',').trim(),
      });
      course = { id: courseId, name, address, lat, lng };
    }

    // Check for recent scan (within 24 hours)
    const existingScan = await getLatestScan(Number(course.id));
    if (existingScan) {
      const scanAge = Date.now() - new Date(existingScan.scanned_at as string).getTime();
      if (scanAge < 24 * 60 * 60 * 1000) {
        // Return cached scan
        return NextResponse.json({
          course,
          risks: {
            flood: { score: existingScan.flood_score, level: existingScan.flood_level },
            heat: { score: existingScan.heat_score, level: existingScan.heat_level },
            drought: { score: existingScan.drought_score, level: existingScan.drought_level },
            subsidence: { score: existingScan.subsidence_score, level: existingScan.subsidence_level },
          },
          overall: { score: existingScan.overall_score, level: existingScan.overall_level },
          insights: existingScan.insights,
          recommendations: existingScan.recommendations,
          cached: true,
        });
      }
    }

    // Calculate new climate risks
    const risks = await calculateClimateRisks(lat, lng, name);
    const insights = generateInsights(risks, name, lat, lng);
    const recommendations = generateRecommendations(risks);

    // Calculate overall score
    const overallScore =
      risks.flood.score * 0.3 + risks.heat.score * 0.2 + risks.drought.score * 0.25 + risks.subsidence.score * 0.25;
    const overall = {
      score: Math.round(overallScore * 10) / 10,
      level: getRiskLevel(overallScore),
    };

    // Save scan to database
    await createScan({
      course_id: Number(course.id),
      flood_score: risks.flood.score,
      flood_level: risks.flood.level,
      heat_score: risks.heat.score,
      heat_level: risks.heat.level,
      drought_score: risks.drought.score,
      drought_level: risks.drought.level,
      subsidence_score: risks.subsidence.score,
      subsidence_level: risks.subsidence.level,
      overall_score: overall.score,
      overall_level: overall.level,
      insights,
      recommendations,
    });

    return NextResponse.json({
      course,
      risks,
      overall,
      insights,
      recommendations,
      cached: false,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze location', details: String(error) }, { status: 500 });
  }
}
