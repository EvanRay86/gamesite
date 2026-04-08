// Globle — country centroids (lat/lng) for distance calculation & globe rendering
// Coordinates are approximate geographic centroids.

export interface GlobleCountry {
  name: string;
  code: string;
  lat: number;
  lng: number;
  flag: string;
}

export const globleCountries: GlobleCountry[] = [
  // ── Africa ────────────────────────────────────────────────────────────────
  { name: "Algeria", code: "dz", lat: 28.03, lng: 1.66, flag: "🇩🇿" },
  { name: "Angola", code: "ao", lat: -11.2, lng: 17.87, flag: "🇦🇴" },
  { name: "Benin", code: "bj", lat: 9.31, lng: 2.32, flag: "🇧🇯" },
  { name: "Botswana", code: "bw", lat: -22.33, lng: 24.68, flag: "🇧🇼" },
  { name: "Burkina Faso", code: "bf", lat: 12.24, lng: -1.56, flag: "🇧🇫" },
  { name: "Burundi", code: "bi", lat: -3.37, lng: 29.92, flag: "🇧🇮" },
  { name: "Cameroon", code: "cm", lat: 7.37, lng: 12.35, flag: "🇨🇲" },
  { name: "Cape Verde", code: "cv", lat: 16.0, lng: -24.01, flag: "🇨🇻" },
  { name: "Central African Republic", code: "cf", lat: 6.61, lng: 20.94, flag: "🇨🇫" },
  { name: "Chad", code: "td", lat: 15.45, lng: 18.73, flag: "🇹🇩" },
  { name: "Comoros", code: "km", lat: -11.88, lng: 43.87, flag: "🇰🇲" },
  { name: "Congo", code: "cg", lat: -0.23, lng: 15.83, flag: "🇨🇬" },
  { name: "Democratic Republic of the Congo", code: "cd", lat: -4.04, lng: 21.76, flag: "🇨🇩" },
  { name: "Djibouti", code: "dj", lat: 11.59, lng: 43.15, flag: "🇩🇯" },
  { name: "Egypt", code: "eg", lat: 26.82, lng: 30.8, flag: "🇪🇬" },
  { name: "Equatorial Guinea", code: "gq", lat: 1.65, lng: 10.27, flag: "🇬🇶" },
  { name: "Eritrea", code: "er", lat: 15.18, lng: 39.78, flag: "🇪🇷" },
  { name: "Eswatini", code: "sz", lat: -26.52, lng: 31.47, flag: "🇸🇿" },
  { name: "Ethiopia", code: "et", lat: 9.15, lng: 40.49, flag: "🇪🇹" },
  { name: "Gabon", code: "ga", lat: -0.8, lng: 11.61, flag: "🇬🇦" },
  { name: "Gambia", code: "gm", lat: 13.44, lng: -15.31, flag: "🇬🇲" },
  { name: "Ghana", code: "gh", lat: 7.95, lng: -1.02, flag: "🇬🇭" },
  { name: "Guinea", code: "gn", lat: 9.95, lng: -9.7, flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "gw", lat: 11.8, lng: -15.18, flag: "🇬🇼" },
  { name: "Ivory Coast", code: "ci", lat: 7.54, lng: -5.55, flag: "🇨🇮" },
  { name: "Kenya", code: "ke", lat: -0.02, lng: 37.91, flag: "🇰🇪" },
  { name: "Lesotho", code: "ls", lat: -29.61, lng: 28.23, flag: "🇱🇸" },
  { name: "Liberia", code: "lr", lat: 6.43, lng: -9.43, flag: "🇱🇷" },
  { name: "Libya", code: "ly", lat: 26.34, lng: 17.23, flag: "🇱🇾" },
  { name: "Madagascar", code: "mg", lat: -18.77, lng: 46.87, flag: "🇲🇬" },
  { name: "Malawi", code: "mw", lat: -13.25, lng: 34.3, flag: "🇲🇼" },
  { name: "Mali", code: "ml", lat: 17.57, lng: -4.0, flag: "🇲🇱" },
  { name: "Mauritania", code: "mr", lat: 21.01, lng: -10.94, flag: "🇲🇷" },
  { name: "Mauritius", code: "mu", lat: -20.35, lng: 57.55, flag: "🇲🇺" },
  { name: "Morocco", code: "ma", lat: 31.79, lng: -7.09, flag: "🇲🇦" },
  { name: "Mozambique", code: "mz", lat: -18.67, lng: 35.53, flag: "🇲🇿" },
  { name: "Namibia", code: "na", lat: -22.96, lng: 18.49, flag: "🇳🇦" },
  { name: "Niger", code: "ne", lat: 17.61, lng: 8.08, flag: "🇳🇪" },
  { name: "Nigeria", code: "ng", lat: 9.08, lng: 8.68, flag: "🇳🇬" },
  { name: "Rwanda", code: "rw", lat: -1.94, lng: 29.87, flag: "🇷🇼" },
  { name: "Sao Tome and Principe", code: "st", lat: 0.19, lng: 6.61, flag: "🇸🇹" },
  { name: "Senegal", code: "sn", lat: 14.5, lng: -14.45, flag: "🇸🇳" },
  { name: "Seychelles", code: "sc", lat: -4.68, lng: 55.49, flag: "🇸🇨" },
  { name: "Sierra Leone", code: "sl", lat: 8.46, lng: -11.78, flag: "🇸🇱" },
  { name: "Somalia", code: "so", lat: 5.15, lng: 46.2, flag: "🇸🇴" },
  { name: "South Africa", code: "za", lat: -30.56, lng: 22.94, flag: "🇿🇦" },
  { name: "South Sudan", code: "ss", lat: 6.88, lng: 31.31, flag: "🇸🇸" },
  { name: "Sudan", code: "sd", lat: 12.86, lng: 30.22, flag: "🇸🇩" },
  { name: "Tanzania", code: "tz", lat: -6.37, lng: 34.89, flag: "🇹🇿" },
  { name: "Togo", code: "tg", lat: 8.62, lng: 0.82, flag: "🇹🇬" },
  { name: "Tunisia", code: "tn", lat: 33.89, lng: 9.54, flag: "🇹🇳" },
  { name: "Uganda", code: "ug", lat: 1.37, lng: 32.29, flag: "🇺🇬" },
  { name: "Zambia", code: "zm", lat: -13.13, lng: 27.85, flag: "🇿🇲" },
  { name: "Zimbabwe", code: "zw", lat: -19.02, lng: 29.15, flag: "🇿🇼" },

  // ── Asia ──────────────────────────────────────────────────────────────────
  { name: "Afghanistan", code: "af", lat: 33.94, lng: 67.71, flag: "🇦🇫" },
  { name: "Armenia", code: "am", lat: 40.07, lng: 45.04, flag: "🇦🇲" },
  { name: "Azerbaijan", code: "az", lat: 40.14, lng: 47.58, flag: "🇦🇿" },
  { name: "Bahrain", code: "bh", lat: 25.93, lng: 50.64, flag: "🇧🇭" },
  { name: "Bangladesh", code: "bd", lat: 23.68, lng: 90.36, flag: "🇧🇩" },
  { name: "Bhutan", code: "bt", lat: 27.51, lng: 90.43, flag: "🇧🇹" },
  { name: "Brunei", code: "bn", lat: 4.54, lng: 114.73, flag: "🇧🇳" },
  { name: "Cambodia", code: "kh", lat: 12.57, lng: 104.99, flag: "🇰🇭" },
  { name: "China", code: "cn", lat: 35.86, lng: 104.2, flag: "🇨🇳" },
  { name: "Cyprus", code: "cy", lat: 35.13, lng: 33.43, flag: "🇨🇾" },
  { name: "Georgia", code: "ge", lat: 42.32, lng: 43.36, flag: "🇬🇪" },
  { name: "India", code: "in", lat: 20.59, lng: 78.96, flag: "🇮🇳" },
  { name: "Indonesia", code: "id", lat: -0.79, lng: 113.92, flag: "🇮🇩" },
  { name: "Iran", code: "ir", lat: 32.43, lng: 53.69, flag: "🇮🇷" },
  { name: "Iraq", code: "iq", lat: 33.22, lng: 43.68, flag: "🇮🇶" },
  { name: "Israel", code: "il", lat: 31.05, lng: 34.85, flag: "🇮🇱" },
  { name: "Japan", code: "jp", lat: 36.2, lng: 138.25, flag: "🇯🇵" },
  { name: "Jordan", code: "jo", lat: 30.59, lng: 36.24, flag: "🇯🇴" },
  { name: "Kazakhstan", code: "kz", lat: 48.02, lng: 66.92, flag: "🇰🇿" },
  { name: "Kuwait", code: "kw", lat: 29.31, lng: 47.48, flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "kg", lat: 41.2, lng: 74.77, flag: "🇰🇬" },
  { name: "Laos", code: "la", lat: 19.86, lng: 102.5, flag: "🇱🇦" },
  { name: "Lebanon", code: "lb", lat: 33.85, lng: 35.86, flag: "🇱🇧" },
  { name: "Malaysia", code: "my", lat: 4.21, lng: 101.98, flag: "🇲🇾" },
  { name: "Maldives", code: "mv", lat: 3.2, lng: 73.22, flag: "🇲🇻" },
  { name: "Mongolia", code: "mn", lat: 46.86, lng: 103.85, flag: "🇲🇳" },
  { name: "Myanmar", code: "mm", lat: 21.91, lng: 95.96, flag: "🇲🇲" },
  { name: "Nepal", code: "np", lat: 28.39, lng: 84.12, flag: "🇳🇵" },
  { name: "North Korea", code: "kp", lat: 40.34, lng: 127.51, flag: "🇰🇵" },
  { name: "Oman", code: "om", lat: 21.47, lng: 55.98, flag: "🇴🇲" },
  { name: "Pakistan", code: "pk", lat: 30.38, lng: 69.35, flag: "🇵🇰" },
  { name: "Palestine", code: "ps", lat: 31.95, lng: 35.23, flag: "🇵🇸" },
  { name: "Philippines", code: "ph", lat: 12.88, lng: 121.77, flag: "🇵🇭" },
  { name: "Qatar", code: "qa", lat: 25.35, lng: 51.18, flag: "🇶🇦" },
  { name: "Saudi Arabia", code: "sa", lat: 23.89, lng: 45.08, flag: "🇸🇦" },
  { name: "Singapore", code: "sg", lat: 1.35, lng: 103.82, flag: "🇸🇬" },
  { name: "South Korea", code: "kr", lat: 35.91, lng: 127.77, flag: "🇰🇷" },
  { name: "Sri Lanka", code: "lk", lat: 7.87, lng: 80.77, flag: "🇱🇰" },
  { name: "Syria", code: "sy", lat: 34.8, lng: 38.99, flag: "🇸🇾" },
  { name: "Taiwan", code: "tw", lat: 23.7, lng: 120.96, flag: "🇹🇼" },
  { name: "Tajikistan", code: "tj", lat: 38.86, lng: 71.28, flag: "🇹🇯" },
  { name: "Thailand", code: "th", lat: 15.87, lng: 100.99, flag: "🇹🇭" },
  { name: "Timor-Leste", code: "tl", lat: -8.87, lng: 125.73, flag: "🇹🇱" },
  { name: "Turkey", code: "tr", lat: 38.96, lng: 35.24, flag: "🇹🇷" },
  { name: "Turkmenistan", code: "tm", lat: 38.97, lng: 59.56, flag: "🇹🇲" },
  { name: "United Arab Emirates", code: "ae", lat: 23.42, lng: 53.85, flag: "🇦🇪" },
  { name: "Uzbekistan", code: "uz", lat: 41.38, lng: 64.59, flag: "🇺🇿" },
  { name: "Vietnam", code: "vn", lat: 14.06, lng: 108.28, flag: "🇻🇳" },
  { name: "Yemen", code: "ye", lat: 15.55, lng: 48.52, flag: "🇾🇪" },

  // ── Europe ────────────────────────────────────────────────────────────────
  { name: "Albania", code: "al", lat: 41.15, lng: 20.17, flag: "🇦🇱" },
  { name: "Andorra", code: "ad", lat: 42.51, lng: 1.52, flag: "🇦🇩" },
  { name: "Austria", code: "at", lat: 47.52, lng: 14.55, flag: "🇦🇹" },
  { name: "Belarus", code: "by", lat: 53.71, lng: 27.95, flag: "🇧🇾" },
  { name: "Belgium", code: "be", lat: 50.5, lng: 4.47, flag: "🇧🇪" },
  { name: "Bosnia and Herzegovina", code: "ba", lat: 43.92, lng: 17.68, flag: "🇧🇦" },
  { name: "Bulgaria", code: "bg", lat: 42.73, lng: 25.49, flag: "🇧🇬" },
  { name: "Croatia", code: "hr", lat: 45.1, lng: 15.2, flag: "🇭🇷" },
  { name: "Czech Republic", code: "cz", lat: 49.82, lng: 15.47, flag: "🇨🇿" },
  { name: "Denmark", code: "dk", lat: 56.26, lng: 9.5, flag: "🇩🇰" },
  { name: "Estonia", code: "ee", lat: 58.6, lng: 25.01, flag: "🇪🇪" },
  { name: "Finland", code: "fi", lat: 61.92, lng: 25.75, flag: "🇫🇮" },
  { name: "France", code: "fr", lat: 46.23, lng: 2.21, flag: "🇫🇷" },
  { name: "Germany", code: "de", lat: 51.17, lng: 10.45, flag: "🇩🇪" },
  { name: "Greece", code: "gr", lat: 39.07, lng: 21.82, flag: "🇬🇷" },
  { name: "Hungary", code: "hu", lat: 47.16, lng: 19.5, flag: "🇭🇺" },
  { name: "Iceland", code: "is", lat: 64.96, lng: -19.02, flag: "🇮🇸" },
  { name: "Ireland", code: "ie", lat: 53.14, lng: -7.69, flag: "🇮🇪" },
  { name: "Italy", code: "it", lat: 41.87, lng: 12.57, flag: "🇮🇹" },
  { name: "Kosovo", code: "xk", lat: 42.6, lng: 20.9, flag: "🇽🇰" },
  { name: "Latvia", code: "lv", lat: 56.88, lng: 24.6, flag: "🇱🇻" },
  { name: "Liechtenstein", code: "li", lat: 47.17, lng: 9.56, flag: "🇱🇮" },
  { name: "Lithuania", code: "lt", lat: 55.17, lng: 23.88, flag: "🇱🇹" },
  { name: "Luxembourg", code: "lu", lat: 49.82, lng: 6.13, flag: "🇱🇺" },
  { name: "Malta", code: "mt", lat: 35.94, lng: 14.38, flag: "🇲🇹" },
  { name: "Moldova", code: "md", lat: 47.41, lng: 28.37, flag: "🇲🇩" },
  { name: "Monaco", code: "mc", lat: 43.74, lng: 7.42, flag: "🇲🇨" },
  { name: "Montenegro", code: "me", lat: 42.71, lng: 19.37, flag: "🇲🇪" },
  { name: "Netherlands", code: "nl", lat: 52.13, lng: 5.29, flag: "🇳🇱" },
  { name: "North Macedonia", code: "mk", lat: 41.51, lng: 21.75, flag: "🇲🇰" },
  { name: "Norway", code: "no", lat: 60.47, lng: 8.47, flag: "🇳🇴" },
  { name: "Poland", code: "pl", lat: 51.92, lng: 19.15, flag: "🇵🇱" },
  { name: "Portugal", code: "pt", lat: 39.4, lng: -8.22, flag: "🇵🇹" },
  { name: "Romania", code: "ro", lat: 45.94, lng: 24.97, flag: "🇷🇴" },
  { name: "Russia", code: "ru", lat: 61.52, lng: 105.32, flag: "🇷🇺" },
  { name: "San Marino", code: "sm", lat: 43.94, lng: 12.46, flag: "🇸🇲" },
  { name: "Serbia", code: "rs", lat: 44.02, lng: 21.01, flag: "🇷🇸" },
  { name: "Slovakia", code: "sk", lat: 48.67, lng: 19.7, flag: "🇸🇰" },
  { name: "Slovenia", code: "si", lat: 46.15, lng: 14.99, flag: "🇸🇮" },
  { name: "Spain", code: "es", lat: 40.46, lng: -3.75, flag: "🇪🇸" },
  { name: "Sweden", code: "se", lat: 60.13, lng: 18.64, flag: "🇸🇪" },
  { name: "Switzerland", code: "ch", lat: 46.82, lng: 8.23, flag: "🇨🇭" },
  { name: "Ukraine", code: "ua", lat: 48.38, lng: 31.17, flag: "🇺🇦" },
  { name: "United Kingdom", code: "gb", lat: 55.38, lng: -3.44, flag: "🇬🇧" },
  { name: "Vatican City", code: "va", lat: 41.9, lng: 12.45, flag: "🇻🇦" },

  // ── North America ─────────────────────────────────────────────────────────
  { name: "Antigua and Barbuda", code: "ag", lat: 17.06, lng: -61.8, flag: "🇦🇬" },
  { name: "Bahamas", code: "bs", lat: 25.03, lng: -77.4, flag: "🇧🇸" },
  { name: "Barbados", code: "bb", lat: 13.19, lng: -59.54, flag: "🇧🇧" },
  { name: "Belize", code: "bz", lat: 17.19, lng: -88.5, flag: "🇧🇿" },
  { name: "Canada", code: "ca", lat: 56.13, lng: -106.35, flag: "🇨🇦" },
  { name: "Costa Rica", code: "cr", lat: 9.75, lng: -83.75, flag: "🇨🇷" },
  { name: "Cuba", code: "cu", lat: 21.52, lng: -77.78, flag: "🇨🇺" },
  { name: "Dominica", code: "dm", lat: 15.41, lng: -61.37, flag: "🇩🇲" },
  { name: "Dominican Republic", code: "do", lat: 18.74, lng: -70.16, flag: "🇩🇴" },
  { name: "El Salvador", code: "sv", lat: 13.79, lng: -88.9, flag: "🇸🇻" },
  { name: "Grenada", code: "gd", lat: 12.26, lng: -61.6, flag: "🇬🇩" },
  { name: "Guatemala", code: "gt", lat: 15.78, lng: -90.23, flag: "🇬🇹" },
  { name: "Haiti", code: "ht", lat: 18.97, lng: -72.29, flag: "🇭🇹" },
  { name: "Honduras", code: "hn", lat: 15.2, lng: -86.24, flag: "🇭🇳" },
  { name: "Jamaica", code: "jm", lat: 18.11, lng: -77.3, flag: "🇯🇲" },
  { name: "Mexico", code: "mx", lat: 23.63, lng: -102.55, flag: "🇲🇽" },
  { name: "Nicaragua", code: "ni", lat: 12.87, lng: -85.21, flag: "🇳🇮" },
  { name: "Panama", code: "pa", lat: 8.54, lng: -80.78, flag: "🇵🇦" },
  { name: "Saint Kitts and Nevis", code: "kn", lat: 17.36, lng: -62.78, flag: "🇰🇳" },
  { name: "Saint Lucia", code: "lc", lat: 13.91, lng: -60.98, flag: "🇱🇨" },
  { name: "Saint Vincent and the Grenadines", code: "vc", lat: 12.98, lng: -61.29, flag: "🇻🇨" },
  { name: "Trinidad and Tobago", code: "tt", lat: 10.69, lng: -61.22, flag: "🇹🇹" },
  { name: "United States", code: "us", lat: 37.09, lng: -95.71, flag: "🇺🇸" },

  // ── South America ─────────────────────────────────────────────────────────
  { name: "Argentina", code: "ar", lat: -38.42, lng: -63.62, flag: "🇦🇷" },
  { name: "Bolivia", code: "bo", lat: -16.29, lng: -63.59, flag: "🇧🇴" },
  { name: "Brazil", code: "br", lat: -14.24, lng: -51.93, flag: "🇧🇷" },
  { name: "Chile", code: "cl", lat: -35.68, lng: -71.54, flag: "🇨🇱" },
  { name: "Colombia", code: "co", lat: 4.57, lng: -74.3, flag: "🇨🇴" },
  { name: "Ecuador", code: "ec", lat: -1.83, lng: -78.18, flag: "🇪🇨" },
  { name: "Guyana", code: "gy", lat: 4.86, lng: -58.93, flag: "🇬🇾" },
  { name: "Paraguay", code: "py", lat: -23.44, lng: -58.44, flag: "🇵🇾" },
  { name: "Peru", code: "pe", lat: -9.19, lng: -75.02, flag: "🇵🇪" },
  { name: "Suriname", code: "sr", lat: 3.92, lng: -56.03, flag: "🇸🇷" },
  { name: "Uruguay", code: "uy", lat: -32.52, lng: -55.77, flag: "🇺🇾" },
  { name: "Venezuela", code: "ve", lat: 6.42, lng: -66.59, flag: "🇻🇪" },

  // ── Oceania ───────────────────────────────────────────────────────────────
  { name: "Australia", code: "au", lat: -25.27, lng: 133.78, flag: "🇦🇺" },
  { name: "Fiji", code: "fj", lat: -17.71, lng: 178.07, flag: "🇫🇯" },
  { name: "Kiribati", code: "ki", lat: 1.87, lng: -157.36, flag: "🇰🇮" },
  { name: "Marshall Islands", code: "mh", lat: 7.13, lng: 171.18, flag: "🇲🇭" },
  { name: "Micronesia", code: "fm", lat: 7.43, lng: 150.55, flag: "🇫🇲" },
  { name: "Nauru", code: "nr", lat: -0.52, lng: 166.93, flag: "🇳🇷" },
  { name: "New Zealand", code: "nz", lat: -40.9, lng: 174.89, flag: "🇳🇿" },
  { name: "Palau", code: "pw", lat: 7.51, lng: 134.58, flag: "🇵🇼" },
  { name: "Papua New Guinea", code: "pg", lat: -6.31, lng: 143.96, flag: "🇵🇬" },
  { name: "Samoa", code: "ws", lat: -13.76, lng: -172.1, flag: "🇼🇸" },
  { name: "Solomon Islands", code: "sb", lat: -9.65, lng: 160.16, flag: "🇸🇧" },
  { name: "Tonga", code: "to", lat: -21.18, lng: -175.2, flag: "🇹🇴" },
  { name: "Tuvalu", code: "tv", lat: -7.11, lng: 177.65, flag: "🇹🇻" },
  { name: "Vanuatu", code: "vu", lat: -15.38, lng: 166.96, flag: "🇻🇺" },
];

/** All country names sorted alphabetically for autocomplete. */
export const globleCountryNames: string[] = globleCountries
  .map((c) => c.name)
  .sort();

// ---------------------------------------------------------------------------
// Distance helpers
// ---------------------------------------------------------------------------

const DEG_TO_RAD = Math.PI / 180;

/** Haversine distance in km between two lat/lng points. */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Max possible distance on Earth in km (half circumference). */
export const MAX_DISTANCE = 20015;

/**
 * Returns a proximity percentage (0–100).
 * 100 = same spot, 0 = antipodal.
 */
export function proximityPct(distKm: number): number {
  return Math.max(0, Math.min(100, ((MAX_DISTANCE - distKm) / MAX_DISTANCE) * 100));
}

/**
 * Returns a CSS color for the given proximity percentage.
 * 0 = farthest (cool / light), 100 = closest (hot / dark red).
 */
export function proximityColor(pct: number): string {
  if (pct >= 95) return "#dc2626"; // red-600 — very close
  if (pct >= 85) return "#ef4444"; // red-500
  if (pct >= 75) return "#f97316"; // orange-500
  if (pct >= 65) return "#fb923c"; // orange-400
  if (pct >= 55) return "#fbbf24"; // amber-400
  if (pct >= 45) return "#facc15"; // yellow-400
  if (pct >= 35) return "#a3e635"; // lime-400
  if (pct >= 25) return "#4ade80"; // green-400
  if (pct >= 15) return "#2dd4bf"; // teal-400
  return "#67e8f9"; // cyan-300 — farthest
}

/**
 * Bearing from point1 to point2 in degrees (0 = N, 90 = E, 180 = S, 270 = W).
 */
export function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const y = Math.sin(dLng) * Math.cos(lat2 * DEG_TO_RAD);
  const x =
    Math.cos(lat1 * DEG_TO_RAD) * Math.sin(lat2 * DEG_TO_RAD) -
    Math.sin(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.cos(dLng);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

/** Direction arrow from bearing degrees. */
export function directionArrow(deg: number): string {
  const arrows = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
  const index = Math.round(deg / 45) % 8;
  return arrows[index];
}

// ---------------------------------------------------------------------------
// Deterministic daily puzzle
// ---------------------------------------------------------------------------

function hashDate(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const ch = date.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Pick today's mystery country deterministically. */
export function getGloblePuzzle(date: string): GlobleCountry {
  const index = hashDate(date) % globleCountries.length;
  return globleCountries[index];
}
