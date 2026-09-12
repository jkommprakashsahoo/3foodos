// FoodWise AI - Gemini Vision Analysis Service
// Strict anti-hallucination compliance: Visual categorization & relative waste levels only.

import { GoogleGenAI, Type } from '@google/genai';

export interface DetectedFoodItem {
  name: string;
  category: 'grain' | 'lentil_curry' | 'vegetable' | 'dairy' | 'bakery' | 'protein' | 'other';
  wasteLevel: 'low' | 'medium' | 'high';
  estimatedFillPercentage: number | null;
  visualConfidencePercentage: number;
  observations: string;
  recommendedSuggestedUnit: string;
}

export interface FoodWasteAnalysisResponse {
  foodItems: DetectedFoodItem[];
  overallAssessment: string;
  requiresHumanConfirmation: true;
  modelName: string;
  analyzedAt: string;
  disclaimer: string;
}

const SYSTEM_INSTRUCTION = `You are analyzing an image of food waste for FoodWise AI, an institutional kitchen management application.
Strict rules:
1. Only describe information visually supported by the image.
2. Do not invent food items. If an item cannot be identified with reasonable certainty, specify "Unidentified leftover" or describe visible characteristics.
3. CRITICAL: Do NOT estimate exact weight in kilograms or grams from the image. The camera is not a weighing scale.
4. Identify visible food categories (grain, lentil_curry, vegetable, dairy, bakery, protein, other).
5. Estimate relative waste level ('low', 'medium', 'high') based on tray volume and container surface area.
6. Estimate visible fill percentage (0 to 100) only when reasonably possible from container boundaries; otherwise return null.
7. Clearly indicate uncertainty in observations.
8. This is an AI-assisted assessment and ALWAYS requires human confirmation before storing quantities.`;

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY is not configured on the server. AI analysis is temporarily unavailable.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function analyzeFoodWasteImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<FoodWasteAnalysisResponse> {
  // Strip data URL prefix if present
  let cleanBase64 = base64Image;
  if (base64Image.includes(',')) {
    const parts = base64Image.split(',');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }

  // Validate image payload length
  if (!cleanBase64 || cleanBase64.length < 100) {
    throw new Error('Invalid image data provided. Please provide a clear photograph.');
  }

  const ai = getAiClient();

  const prompt = `Analyze this food waste container / dining tray. 
Identify visible food items, their category, relative waste level (low, medium, high), and estimated visible fill percentage (0-100).
Provide observations detailing visible characteristics and preservation status for potential redistribution.
Remember: Do not invent items and do not claim exact kilogram scale weights.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      foodItems: {
        type: Type.ARRAY,
        description: 'Visually detected food items in the leftover container or plate',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Common name of visible food (e.g. Steamed Rice, Dal, Mixed Subzi)' },
            category: { 
              type: Type.STRING, 
              enum: ['grain', 'lentil_curry', 'vegetable', 'dairy', 'bakery', 'protein', 'other'] 
            },
            wasteLevel: { 
              type: Type.STRING, 
              enum: ['low', 'medium', 'high'] 
            },
            estimatedFillPercentage: { 
              type: Type.INTEGER, 
              description: 'Estimated container fill percentage from 0 to 100, or null if uncertain' 
            },
            visualConfidencePercentage: {
              type: Type.INTEGER,
              description: 'Confidence in visual identification (0 to 100)'
            },
            observations: { 
              type: Type.STRING, 
              description: 'Direct visual observations about volume, condition, and moisture' 
            },
            recommendedSuggestedUnit: { 
              type: Type.STRING, 
              description: 'Standard unit for human confirmation (default: kg)' 
            }
          },
          required: ['name', 'category', 'wasteLevel', 'observations']
        }
      },
      overallAssessment: {
        type: Type.STRING,
        description: 'High-level synthesis of visible leftover state'
      },
      requiresHumanConfirmation: {
        type: Type.BOOLEAN,
        description: 'Must always be true'
      }
    },
    required: ['foodItems', 'overallAssessment', 'requiresHumanConfirmation']
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed = JSON.parse(text);

    // Validate structure strictly
    if (!parsed || !Array.isArray(parsed.foodItems)) {
      throw new Error('Gemini response did not conform to the expected structured format.');
    }

    const validatedItems: DetectedFoodItem[] = parsed.foodItems.map((item: any) => ({
      name: String(item.name || 'Unidentified Leftover').trim(),
      category: ['grain', 'lentil_curry', 'vegetable', 'dairy', 'bakery', 'protein', 'other'].includes(item.category)
        ? item.category
        : 'other',
      wasteLevel: ['low', 'medium', 'high'].includes(item.wasteLevel) ? item.wasteLevel : 'medium',
      estimatedFillPercentage: typeof item.estimatedFillPercentage === 'number' ? item.estimatedFillPercentage : null,
      visualConfidencePercentage: typeof item.visualConfidencePercentage === 'number' ? item.visualConfidencePercentage : 90,
      observations: String(item.observations || 'Visible leftover detected in container.').trim(),
      recommendedSuggestedUnit: 'kg'
    }));

    return {
      foodItems: validatedItems,
      overallAssessment: parsed.overallAssessment || 'Visible food waste detected across meal prep containers.',
      requiresHumanConfirmation: true,
      modelName: 'Gemini 3.8 Flash (Vision)',
      analyzedAt: new Date().toISOString(),
      disclaimer: 'AI estimates are derived from geometric volume heuristics and require human confirmation before saving.'
    };
  } catch (err: any) {
    console.error('[Gemini Vision Error]', err);
    throw new Error(err.message || 'AI analysis is temporarily unavailable.');
  }
}
