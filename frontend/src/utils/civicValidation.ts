/**
 * Strict Civic Input Validation for NagarDrishti
 * Detects random characters, keyboard mash, gibberish, repeated text, spam,
 * unpronounceable consonant clusters, and low-entropy submissions before sending to Sarvam AI or municipal triage.
 */
export function validateCivicDescription(text: string): { isValid: boolean; error?: string } {
  const cleaned = (text || '').trim();

  // 1. Minimum character length
  if (!cleaned || cleaned.length < 12) {
    return {
      isValid: false,
      error: 'विवरण बहुत छोटा है (कम से कम 12 अक्षर आवश्यक हैं) / Description is too short (minimum 12 characters required).'
    };
  }

  // 2. Minimum word count
  const words = cleaned.split(/[\s,.;:!?\-/]+/).filter(Boolean);
  if (words.length < 3) {
    return {
      isValid: false,
      error: 'कृपया कम से कम 3 सार्थक शब्द लिखें / Please enter at least 3 descriptive words explaining what is broken or needed.'
    };
  }

  // 3. Repeated single character check (e.g. "aaaaa", "zzzzzzz")
  if (/(.)\1{4,}/.test(cleaned)) {
    return {
      isValid: false,
      error: 'दोहराए गए वर्ण (Repeated characters) पाए गए। कृपया वास्तविक नागरिक समस्या लिखें।'
    };
  }

  // 4. Repeated short pattern check (e.g. "asdfasdfasdf", "testtesttest")
  if (/(.{2,6})\1{2,}/i.test(cleaned)) {
    return {
      isValid: false,
      error: 'दोहराया गया स्पैम टेक्स्ट पाया गया / Repetitive spam pattern detected. Please describe an authentic problem.'
    };
  }

  // 5. Low entropy / dominant character ratio check
  const noSpaces = cleaned.replace(/\s+/g, '').toLowerCase();
  const counts: Record<string, number> = {};
  for (const ch of noSpaces) {
    counts[ch] = (counts[ch] || 0) + 1;
  }
  const maxFreq = Math.max(...Object.values(counts));
  if (noSpaces.length > 10 && maxFreq / noSpaces.length > 0.35) {
    return {
      isValid: false,
      error: 'विवरण में एक ही अक्षर बार-बार दोहराया गया है / Description lacks character diversity. Please describe a valid civic problem.'
    };
  }

  // 6. Keyboard mash check (applies unconditionally across any length)
  const mash = [
    'asdf', 'fdsa', 'qwerty', 'ytrewq', 'zxcv', 'vcxz', 
    'ghjkl', 'lkjhg', 'poiuy', 'yuiop', '12345', '67890'
  ];
  for (const p of mash) {
    if (noSpaces.includes(p)) {
      return {
        isValid: false,
        error: 'कीबोर्ड मैश (Keyboard mash) या यादृच्छिक अनुक्रम पाया गया। कृपया सार्थक नागरिक शिकायत दर्ज करें।'
      };
    }
  }

  // 7. Unpronounceable consonant clusters (gibberish detector for English)
  // Check if any word has 5 or more consecutive consonants without a vowel
  const hasDevanagari = /[\u0900-\u097F]/.test(cleaned);
  if (!hasDevanagari) {
    for (const w of words) {
      if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(w)) {
        return {
          isValid: false,
          error: `अस्पष्ट अथवा अर्थहीन शब्द ("${w}") पाया गया। कृपया अर्थपूर्ण भाषा में समस्या का विवरण दें।`
        };
      }
    }
  }

  // 8. Authentic Civic Vocabulary Validation
  const civicKeywords = [
    'road', 'pothole', 'street', 'damage', 'broken', 'crack', 'asphalt', 'footpath', 'bridge',
    'water', 'leak', 'pipe', 'pipeline', 'drain', 'sewer', 'overflow', 'gutter', 'manhole', 'supply', 'drinking',
    'garbage', 'waste', 'trash', 'dump', 'clean', 'dirt', 'dustbin', 'sanitation',
    'light', 'pole', 'wire', 'lamp', 'dark', 'electricity', 'power', 'bulb', 'streetlight',
    'hospital', 'clinic', 'doctor', 'patient', 'health', 'ambulance', 'medicine', 'ward',
    'building', 'infrastructure', 'lift', 'elevator', 'facility', 'premises', 'gate', 'wall',
    'accident', 'danger', 'hazard', 'problem', 'issue', 'repair', 'urgent', 'safety', 'condition',
    'सड़क', 'गड्ढा', 'गड्ढे', 'टूटा', 'टूटी', 'डामर', 'फुटपाथ', 'पुल',
    'पानी', 'जल', 'नल', 'पाइप', 'लीक', 'लीकेज', 'रिसाव', 'सीवर', 'सीवेज', 'नाली', 'नाला', 'गटर', 'मैनहोल', 'जलभराव', 'पेयजल',
    'कचरा', 'कूड़ा', 'डंप', 'गंदगी', 'बदबू', 'सफाई', 'दुर्गंध', 'कूड़ेदान',
    'लाइट', 'बत्ती', 'खंभा', 'तार', 'अंधेरा', 'बिजली', 'करंट', 'स्ट्रीट', 'पोल',
    'अस्पताल', 'हॉस्पिटल', 'डॉक्टर', 'मरीज', 'स्वास्थ्य', 'दवा',
    'भवन', 'इमारत', 'लिफ्ट', 'अवसंरचना', 'परिसर', 'दीवार', 'शौचालय',
    'खतरा', 'दुर्घटना', 'सुरक्षा', 'समस्या', 'शिकायत', 'मरम्मत', 'असुविधा', 'खराब'
  ];

  const lower = cleaned.toLowerCase();
  const hasCivicTerm = civicKeywords.some((term) => lower.includes(term));
  if (!hasCivicTerm) {
    return {
      isValid: false,
      error: 'कृपया प्रभावित सार्वजनिक सेवा अथवा अवसंरचना का उल्लेख करें (उदा: सड़क, गड्ढा, जल आपूर्ति, पाइप लीकेज, कचरा, स्ट्रीट लाइट, अस्पताल या लिफ्ट)।'
    };
  }

  return { isValid: true };
}

