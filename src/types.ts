export type Occasion = 'casual' | 'office' | 'party' | 'date' | 'sport' | 'formal';
export type StylePreference = 'minimalist' | 'bohemian' | 'classic' | 'streetwear' | 'vintage' | 'luxury';

export interface WeatherInfo {
  temp: number;
  condition: string;
  location?: string;
  humidity?: number;
  windSpeed?: number;
}

export interface OutfitPart {
  item: string;
  description: string;
  color: string;
  imageUrl?: string;
}

export interface OutfitSuggestion {
  title: string;
  description: string;
  items: OutfitPart[];
  accessories: string[];
  styleTip: string;
}
