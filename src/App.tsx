import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Sun, 
  Wind,
  Droplets,
  MapPin, 
  Briefcase, 
  PartyPopper, 
  Coffee, 
  Heart, 
  Dumbbell, 
  Shirt,
  ChevronRight,
  RefreshCw,
  Palette,
  User,
  Share2,
  Trash2,
  Bookmark,
  Check,
  X,
  Search
} from 'lucide-react';
import { Occasion, WeatherInfo, OutfitSuggestion, StylePreference } from './types';
import { generateOutfitSuggestions } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const OCCASIONS: { id: Occasion; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'casual', label: 'Casual Day', icon: <Coffee className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
  { id: 'office', label: 'Office / Work', icon: <Briefcase className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
  { id: 'party', label: 'Party Night', icon: <PartyPopper className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
  { id: 'date', label: 'Date Night', icon: <Heart className="w-5 h-5" />, color: 'bg-pink-50 text-pink-600' },
  { id: 'sport', label: 'Active / Sport', icon: <Dumbbell className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'formal', label: 'Formal Event', icon: <Shirt className="w-5 h-5" />, color: 'bg-slate-50 text-slate-600' },
];

const STYLES: { id: StylePreference; label: string }[] = [
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'bohemian', label: 'Bohemian' },
  { id: 'classic', label: 'Classic' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'luxury', label: 'Luxury' },
];

export default function App() {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null);
  const [gender, setGender] = useState<'masculine' | 'feminine' | 'unisex'>('unisex');
  const [stylePref, setStylePref] = useState<StylePreference>('classic');
  const [favorites, setFavorites] = useState<OutfitSuggestion[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  useEffect(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('stilo_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    // Check for shared outfit in URL
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        setSuggestion(decoded);
        // Clear the URL param without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to decode shared outfit", e);
      }
    }

    // Get location and mock weather (or just ask user)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(() => {
        // In a real app, we'd fetch weather from an API using these coords
        // For this demo, we'll set a default pleasant weather
        setWeather({
          temp: 22,
          condition: 'Sunny',
          location: 'San Francisco',
          humidity: 45,
          windSpeed: 12
        });
      }, () => {
        setWeather({
          temp: 20,
          condition: 'Clear',
          location: 'London',
          humidity: 60,
          windSpeed: 8
        });
      });
    }
  }, []);

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    
    // Mock weather update based on location
    setWeather({
      temp: Math.floor(Math.random() * 15) + 15, // Random temp between 15-30
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Clear'][Math.floor(Math.random() * 4)],
      location: locationInput,
      humidity: Math.floor(Math.random() * 40) + 30,
      windSpeed: Math.floor(Math.random() * 20) + 5
    });
    setIsEditingLocation(false);
    setLocationInput('');
  };

  const handleGenerate = async (selectedOccasion: Occasion) => {
    setOccasion(selectedOccasion);
    setLoading(true);
    setSuggestion(null);
    try {
      const result = await generateOutfitSuggestions(selectedOccasion, weather || undefined, gender, stylePref);
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to generate outfit:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (outfit: OutfitSuggestion) => {
    const isFav = favorites.some(f => f.title === outfit.title);
    let newFavs;
    if (isFav) {
      newFavs = favorites.filter(f => f.title !== outfit.title);
    } else {
      newFavs = [...favorites, outfit];
    }
    setFavorites(newFavs);
    localStorage.setItem('stilo_favorites', JSON.stringify(newFavs));
  };

  const handleShare = () => {
    if (!suggestion) return;
    // Create a shareable link by encoding the outfit data (minus images for URL length)
    const { items, ...rest } = suggestion;
    const itemsWithoutImages = items.map(({ imageUrl, ...item }) => item);
    const shareData = btoa(JSON.stringify({ ...rest, items: itemsWithoutImages }));
    const url = `${window.location.origin}${window.location.pathname}?share=${shareData}`;
    
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-8 md:px-12 flex justify-between items-center border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight">STILO</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowFavorites(true)}
            className="relative p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Bookmark className="w-5 h-5" />
            {favorites.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#FDFCFB]">
                {favorites.length}
              </span>
            )}
          </button>
          
          {weather && (
            <div className="hidden md:flex items-center gap-4 px-5 py-2.5 bg-white rounded-full border border-black/5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold">{weather.temp}°C</span>
              </div>
              
              <div className="w-px h-4 bg-black/10" />
              
              <div className="flex items-center gap-4 text-black/40">
                <div className="flex items-center gap-1.5" title="Humidity">
                  <Droplets className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1.5" title="Wind Speed">
                  <Wind className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{weather.windSpeed} km/h</span>
                </div>
              </div>

              <div className="w-px h-4 bg-black/10" />

              <button 
                onClick={() => setIsEditingLocation(!isEditingLocation)}
                className="flex items-center gap-1.5 hover:text-black transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 text-black/30 group-hover:text-black" />
                <span className="text-xs uppercase tracking-wider font-bold">{weather.location}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence>
        {isEditingLocation && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 md:px-12 py-4 bg-black/5 border-b border-black/5"
          >
            <form onSubmit={handleLocationSearch} className="max-w-md mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                <input 
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter city name..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:outline-none focus:border-black/20 transition-all"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-bold hover:bg-black/80 transition-all"
              >
                Update
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-12">
            <section>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-5xl font-serif font-bold leading-tight mb-4">
                  Dress for the <br />
                  <span className="italic text-black/40">Moment.</span>
                </h2>
                <p className="text-black/60 text-lg max-w-md">
                  Personalized AI outfit suggestions tailored to your occasion, style, and local weather.
                </p>
              </motion.div>
            </section>

            <section className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3 h-3 text-black/40" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-black/40">Gender</h3>
                </div>
                <div className="relative">
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full appearance-none px-6 py-4 bg-white border border-black/5 rounded-3xl text-sm font-bold focus:outline-none focus:border-black/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <option value="feminine">Feminine Style</option>
                    <option value="masculine">Masculine Style</option>
                    <option value="unisex">Unisex / Neutral</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-3 h-3 text-black/40" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-black/40">Aesthetic</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStylePref(s.id)}
                      className={cn(
                        "px-4 py-2 rounded-2xl text-xs font-bold border transition-all",
                        stylePref === s.id 
                          ? "bg-black border-black text-white" 
                          : "bg-white border-black/5 text-black/60 hover:border-black/20"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {OCCASIONS.map((occ, idx) => (
                  <motion.button
                    key={occ.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleGenerate(occ.id)}
                    disabled={loading}
                    className={cn(
                      "group relative flex flex-col items-start p-6 rounded-3xl border transition-all duration-300 text-left",
                      occasion === occ.id 
                        ? "bg-black border-black text-white shadow-2xl shadow-black/20" 
                        : "bg-white border-black/5 hover:border-black/20 hover:shadow-lg"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                      occasion === occ.id ? "bg-white/20 text-white" : occ.color
                    )}>
                      {occ.icon}
                    </div>
                    <span className="font-semibold">{occ.label}</span>
                    <ChevronRight className={cn(
                      "absolute bottom-6 right-6 w-4 h-4 transition-transform group-hover:translate-x-1",
                      occasion === occ.id ? "text-white" : "text-black/20"
                    )} />
                  </motion.button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            <div className="sticky top-12 min-h-[600px] bg-white rounded-[40px] border border-black/5 shadow-xl overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-black/5 rounded-full" />
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent rounded-full"
                      />
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-black animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-2">Curating your look...</h3>
                    <p className="text-black/40">Our AI stylist is analyzing trends and weather.</p>
                  </motion.div>
                ) : suggestion ? (
                  <motion.div 
                    key="suggestion"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    {/* Suggestion Header */}
                    <div className="p-8 md:p-12 bg-black text-white">
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {occasion || 'Shared'} Suggestion
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleShare}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
                            title="Share Link"
                          >
                            {copyFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => toggleFavorite(suggestion)}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              favorites.some(f => f.title === suggestion.title) 
                                ? "bg-white text-black" 
                                : "hover:bg-white/10 text-white"
                            )}
                            title="Save to Favorites"
                          >
                            <Heart className={cn("w-4 h-4", favorites.some(f => f.title === suggestion.title) && "fill-current")} />
                          </button>
                          <button 
                            onClick={() => handleGenerate(occasion || 'casual')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Regenerate"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-4xl font-serif font-bold mb-4">{suggestion.title}</h3>
                      <p className="text-white/70 leading-relaxed max-w-xl">
                        {suggestion.description}
                      </p>
                    </div>

                    {/* Suggestion Content */}
                    <div className="p-8 md:p-12 space-y-10">
                      <div className="space-y-6">
                        <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-black/40">The Ensemble</h4>
                        <div className="space-y-4">
                          {suggestion.items.map((item, i) => (
                            <div key={i} className="flex items-start gap-6 group">
                              <div className="w-24 h-24 rounded-2xl bg-black/5 flex-shrink-0 overflow-hidden border border-black/5">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.item} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-serif font-bold text-2xl text-black/10">
                                    0{i + 1}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 pb-4 border-b border-black/5">
                                <div className="flex justify-between items-baseline mb-1">
                                  <span className="font-bold text-lg">{item.item}</span>
                                  <span className="text-xs font-medium text-black/40 italic">{item.color}</span>
                                </div>
                                <p className="text-sm text-black/60">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-black/40">Accessories</h4>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.accessories.map((acc, i) => (
                              <span key={i} className="px-4 py-2 bg-black/5 rounded-2xl text-sm font-medium">
                                {acc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-black/40">Stylist Tip</h4>
                          <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100">
                            <p className="text-sm text-orange-900 leading-relaxed italic">
                              "{suggestion.styleTip}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                    <Shirt className="w-16 h-16 mb-6 stroke-[1px]" />
                    <h3 className="text-xl font-serif font-bold mb-2">No Outfit Selected</h3>
                    <p className="text-sm max-w-xs">Select an occasion on the left to generate your personalized look.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Favorites Sidebar/Overlay */}
      <AnimatePresence>
        {showFavorites && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFavorites(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold">Your Favorites</h2>
                <button onClick={() => setShowFavorites(false)} className="p-2 hover:bg-black/5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {favorites.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Bookmark className="w-12 h-12 mb-4 stroke-[1px]" />
                    <p className="text-sm">No favorites saved yet.</p>
                  </div>
                ) : (
                  favorites.map((fav, idx) => (
                    <div key={idx} className="group p-6 bg-black/5 rounded-[32px] space-y-4 relative">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg leading-tight pr-8">{fav.title}</h4>
                        <button 
                          onClick={() => toggleFavorite(fav)}
                          className="absolute top-6 right-6 p-2 text-black/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-black/60 line-clamp-2">{fav.description}</p>
                      <button 
                        onClick={() => {
                          setSuggestion(fav);
                          setShowFavorites(false);
                        }}
                        className="w-full py-3 bg-white border border-black/5 rounded-2xl text-xs font-bold hover:bg-black hover:text-white transition-all"
                      >
                        View Outfit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-black/5 text-center">
        <p className="text-xs font-bold text-black/20 uppercase tracking-widest">
          Powered by Gemini AI • Crafted for Style
        </p>
      </footer>
    </div>
  );
}
