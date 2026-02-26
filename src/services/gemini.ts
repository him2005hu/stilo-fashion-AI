import { GoogleGenAI, Type } from "@google/genai";
import { Occasion, WeatherInfo, OutfitSuggestion, StylePreference } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateOutfitSuggestions(
  occasion: Occasion,
  weather?: WeatherInfo,
  gender: string = 'unisex',
  stylePreference: StylePreference = 'classic'
): Promise<OutfitSuggestion> {
  const weatherContext = weather 
    ? `The weather is ${weather.temp}°C and ${weather.condition}.` 
    : "Consider a mild, pleasant day.";

  const prompt = `You are a world-class fashion stylist. 
  Suggest a complete outfit for a ${occasion} occasion. 
  Context: ${weatherContext}
  Target Gender/Style: ${gender}.
  Aesthetic Preference: ${stylePreference}.
  
  Provide the suggestion in a structured format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                description: { type: Type.STRING },
                color: { type: Type.STRING },
              },
              required: ["item", "description", "color"],
            },
          },
          accessories: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          styleTip: { type: Type.STRING },
        },
        required: ["title", "description", "items", "accessories", "styleTip"],
      },
    },
  });

  const suggestion: OutfitSuggestion = JSON.parse(response.text || '{}');

  // Generate images for each item
  const itemImages = await Promise.all(
    suggestion.items.map(async (item) => {
      try {
        const imageResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                text: `A high-quality studio product photo of a ${item.color} ${item.item}. ${item.description}. Professional fashion photography, clean white background, soft lighting.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      } catch (e) {
        console.error("Image generation failed for item:", item.item, e);
      }
      return undefined;
    })
  );

  suggestion.items = suggestion.items.map((item, idx) => ({
    ...item,
    imageUrl: itemImages[idx],
  }));

  return suggestion;
}
