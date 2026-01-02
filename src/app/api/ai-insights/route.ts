import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = 'AIzaSyDF_fCcOwxPDXCOkq3NGnGKBTBjAHv-Muo';

function generateFallbackInsights(ratio: number, childrenPct: number) {
  const whyReasons = [
    `${ratio.toFixed(1)}× national district average`,
    'Possible backlog clearance or migration influx',
  ];
  
  if (childrenPct > 40) {
    whyReasons.push(`High child enrollment (${childrenPct}%)`);
  } else {
    whyReasons.push('Increased adult address/biometric updates');
  }

  const actions = [
    'Deploy 2–3 additional operators',
    'Extend operating hours (2 weeks)',
  ];
  
  if (childrenPct > 40) {
    actions.push('Ensure Baal Aadhaar kit availability');
  } else {
    actions.push('Prioritize biometric update stations');
  }

  return { whyReasons, actions };
}

export async function POST(request: NextRequest) {
  let ratio = 1;
  let childrenPct = 0;
  
  try {
    const body = await request.json();
    const { district, state, updates, avgUpdates } = body;
    ratio = body.ratio || 1;
    childrenPct = body.childrenPct || 0;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are an expert analyst for India's Aadhaar enrollment system. Analyze this priority district data and provide actionable insights.

DISTRICT DATA:
- District: ${district}, ${state}
- Monthly Aadhaar Updates: ${updates.toLocaleString()}
- Ratio to National Average: ${ratio.toFixed(1)}× the national district average
- Children (0-17) percentage: ${childrenPct}%
- National Average Updates per District: ${avgUpdates.toLocaleString()}

Based on this data, provide analysis in EXACTLY this JSON format (no markdown, just raw JSON):
{
  "whyReasons": [
    "First reason explaining why this is happening (include the ${ratio.toFixed(1)}× national district average statistic)",
    "Second reason (e.g., migration patterns, backlog clearance, demographic factors)",
    "Third reason related to the ${childrenPct}% child enrollment if significant"
  ],
  "actions": [
    "First specific action recommendation (e.g., Deploy X additional operators)",
    "Second action (e.g., Extend operating hours for X weeks)",
    "Third action if child enrollment is high (e.g., Ensure Baal Aadhaar kit availability)"
  ]
}

Keep reasons and actions concise (under 50 characters each). Focus on:
- Statistical anomalies and their likely causes
- Operational recommendations for government officials
- Resource allocation suggestions`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(generateFallbackInsights(ratio, childrenPct));
    }

    const insights = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('AI Insights Error:', error);
    return NextResponse.json(generateFallbackInsights(ratio, childrenPct));
  }
}
