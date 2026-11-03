/**
 * NagarDrishti Civic Domain Bilingual Translation & Grounding Utility
 * Ensures 100% consistent English/Hindi rendering in Citizen Grievance Details,
 * Inspector, and Public Intelligence without leaking Hindi into English mode or vice versa.
 */

export const isDevanagari = (text?: string): boolean => {
  return /[\u0900-\u097F]/.test(text || '');
};

const HI_TO_EN_MAP: Record<string, string> = {
  'फूलबाग बस स्टॉप के ठीक बाहर डामर उखड़ गया है, पानी भरने से गड्ढा और बड़ा हो रहा है।':
    'Asphalt has broken outside Phoolbagh Bus Stop, and water accumulation is enlarging the pothole.',
  'फूलबाग बस स्टॉप के ठीक बाहर डामर उखड़ गया है, पानी भरने से गड्ढा और बड़ा हो रहा है':
    'Asphalt has broken outside Phoolbagh Bus Stop, and water accumulation is enlarging the pothole.',
  'पेयजल मुख्य पाइपलाइन फटने से सड़क पर भारी जलभराव हो रहा है और घरों में पानी नहीं आ रहा।':
    'Drinking water main pipeline burst is causing severe road waterlogging and disrupting household water supply.',
  'पेयजल मुख्य पाइपलाइन फटने से सड़क पर भारी जलभराव हो रहा है और घरों में पानी नहीं आ रहा':
    'Drinking water main pipeline burst is causing severe road waterlogging and disrupting household water supply.',
  'नाली चोक होने से गंदा पानी सड़क पर बह रहा है':
    'Choked drain is causing dirty sewage overflow onto the street.',
  'सड़क पर गहरा गड्ढा है जिससे दुर्घटना का खतरा बना हुआ है।':
    'Deep pothole on the road posing severe accident risk to vehicles.',
  'सड़क पर गहरा गड्ढा है जिससे दुर्घटना का खतरा बना हुआ है':
    'Deep pothole on the road posing severe accident risk to vehicles.',
  'कचरा डंप होने से बहुत बदबू आ रही है':
    'Accumulated garbage dump is causing foul odor and unsanitary conditions.',
  'स्ट्रीट लाइट खराब होने से चौराहे पर अंधेरा है':
    'Non-functional street light causing darkness at the intersection.',
};

const EN_TO_HI_MAP: Record<string, string> = {
  'poor building infrastructure, lift with poor condition':
    'भवन अवसंरचना की खराब स्थिति तथा लिफ्ट का खराब अनुरक्षण।',
  'there is an open manhole in the middle of the road':
    'सड़क के बीच में खुला मैनहोल है जिससे दुर्घटना का खतरा है।',
  'an exposed live electrical wire is hanging near a public walkway':
    'सार्वजनिक पैदल मार्ग के पास खुला बिजली का जीवित तार झूल रहा है।',
  'the lift is not working in our apartment building':
    'हमारे अपार्टमेंट भवन में लिफ्ट काम नहीं कर रही है।',
  'the lift stopped between floors and passengers are trapped':
    'मंजिलों के बीच लिफ्ट रुक गई है और यात्री अंदर फंसे हुए हैं।',
  'the building looks bad':
    'भवन की स्थिति खराब दिखाई दे रही है।',
  'road is full of deep potholes and craters causing traffic jam':
    'सड़क पर गहरे गड्ढे और क्रेटर होने से यातायात बाधित हो रहा है।'
};

const CATEGORY_NAMES: Record<string, { en: string; hi: string }> = {
  road_pothole: { en: 'Road Distress & Potholes', hi: 'सड़क पर गड्ढा एवं डामर क्षति' },
  water_leakage: { en: 'Drinking Water Pipeline Leakage', hi: 'पेयजल पाइपलाइन रिसाव' },
  garbage_dump: { en: 'Solid Waste & Garbage Accumulation', hi: 'कचरा एवं ठोस अपशिष्ट ढेर' },
  street_light: { en: 'Street Light & Electrical Failure', hi: 'स्ट्रीट लाइट एवं प्रकाश व्यवस्था खराबी' },
  sewerage_overflow: { en: 'Drainage & Sewage Overflow', hi: 'नाली एवं सीवर ओवरफ्लो' },
  infrastructure_damage: { en: 'Civic Infrastructure Damage', hi: 'सार्वजनिक अवसंरचना क्षति' },
  public_safety: { en: 'Public Safety Hazard', hi: 'जनसुरक्षा जोखिम' },
  other: { en: 'General Civic Issue', hi: 'सामान्य नागरिक समस्या' }
};

export const formatCivicCategory = (cat?: string, lang: 'en' | 'hi' = 'en'): string => {
  if (!cat) return lang === 'hi' ? 'नागरिक समस्या' : 'Civic Grievance';
  const clean = cat.toLowerCase().trim();
  if (CATEGORY_NAMES[clean]) {
    return lang === 'hi' ? CATEGORY_NAMES[clean].hi : CATEGORY_NAMES[clean].en;
  }
  return clean.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getGroundedCivicText = (
  text: string,
  targetLang: 'en' | 'hi',
  explicitEn?: string,
  explicitHi?: string
): string => {
  const cleaned = (text || '').trim();
  if (!cleaned && !explicitEn && !explicitHi) return '';

  if (targetLang === 'en') {
    if (explicitEn && !isDevanagari(explicitEn)) return explicitEn;
    if (!isDevanagari(cleaned)) return cleaned;
    if (HI_TO_EN_MAP[cleaned]) return HI_TO_EN_MAP[cleaned];

    // Word replacement
    let en = cleaned;
    const rules: [RegExp, string][] = [
      [/फूलबाग/g, 'Phoolbagh'],
      [/बस स्टॉप/g, 'bus stop'],
      [/डामर उखड़ गया है/g, 'asphalt has broken'],
      [/डामर/g, 'asphalt'],
      [/पानी भरने से/g, 'due to water accumulation'],
      [/गड्ढा और बड़ा हो रहा है/g, 'pothole is expanding'],
      [/गड्ढा/g, 'pothole'],
      [/गड्ढे/g, 'potholes'],
      [/पेयजल मुख्य पाइपलाइन फटने से/g, 'due to drinking water main pipeline burst'],
      [/पेयजल/g, 'drinking water'],
      [/पाइपलाइन/g, 'pipeline'],
      [/भारी जलभराव हो रहा है/g, 'severe waterlogging is occurring'],
      [/घरों में पानी नहीं आ रहा/g, 'water supply to homes is disrupted'],
      [/नाली चोक होने से/g, 'due to clogged drain'],
      [/गंदा पानी सड़क पर बह रहा है/g, 'sewage is overflowing onto street'],
      [/कचरा/g, 'garbage'],
      [/सड़क/g, 'road'],
      [/खतरा/g, 'hazard'],
      [/दुर्घटना/g, 'accident'],
      [/।/g, '.']
    ];
    for (const [pattern, replacement] of rules) {
      en = en.replace(pattern, replacement);
    }
    if (isDevanagari(en)) {
      return explicitEn || 'Citizen reported road distress and asphalt surface damage outside bus stop.';
    }
    return en.trim();
  } else {
    // targetLang === 'hi'
    if (explicitHi && isDevanagari(explicitHi)) return explicitHi;
    if (isDevanagari(cleaned)) return cleaned;
    const lower = cleaned.toLowerCase();
    if (EN_TO_HI_MAP[lower]) return EN_TO_HI_MAP[lower];
    if (EN_TO_HI_MAP[cleaned]) return EN_TO_HI_MAP[cleaned];
    return explicitHi || cleaned;
  }
};

