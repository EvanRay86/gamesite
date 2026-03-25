// GeoGuess — daily geography guessing game data layer

export interface GeoCountry {
  name: string;
  flag: string;
  capital: string;
  continent: string;
  population: string;
  funFact: string;
  neighbors: string[];
}

export interface GeoPuzzle {
  date: string;
  country: GeoCountry;
}

// ---------------------------------------------------------------------------
// Country bank (~60 countries, diverse continents)
// ---------------------------------------------------------------------------

export const countries: GeoCountry[] = [
  // ── Africa ────────────────────────────────────────────────────────────────
  {
    name: "Nigeria",
    flag: "\u{1F1F3}\u{1F1EC}",
    capital: "Abuja",
    continent: "Africa",
    population: "200-250 million",
    funFact: "Has the largest economy in Africa and is called the 'Giant of Africa'.",
    neighbors: ["Benin", "Chad", "Cameroon", "Niger"],
  },
  {
    name: "Kenya",
    flag: "\u{1F1F0}\u{1F1EA}",
    capital: "Nairobi",
    continent: "Africa",
    population: "50-60 million",
    funFact: "Home to the Great Wildebeest Migration across the Masai Mara.",
    neighbors: ["Tanzania", "Uganda", "Somalia", "Ethiopia"],
  },
  {
    name: "Egypt",
    flag: "\u{1F1EA}\u{1F1EC}",
    capital: "Cairo",
    continent: "Africa",
    population: "100-110 million",
    funFact: "The Great Pyramid of Giza is the only surviving ancient wonder of the world.",
    neighbors: ["Libya", "Sudan", "Israel", "Palestine"],
  },
  {
    name: "South Africa",
    flag: "\u{1F1FF}\u{1F1E6}",
    capital: "Pretoria",
    continent: "Africa",
    population: "55-65 million",
    funFact: "Has three capital cities: Pretoria, Cape Town, and Bloemfontein.",
    neighbors: ["Namibia", "Botswana", "Zimbabwe", "Mozambique"],
  },
  {
    name: "Morocco",
    flag: "\u{1F1F2}\u{1F1E6}",
    capital: "Rabat",
    continent: "Africa",
    population: "35-40 million",
    funFact: "Home to the oldest continuously operating university in the world (University of al-Qarawiyyin).",
    neighbors: ["Algeria", "Mauritania", "Spain"],
  },
  {
    name: "Ethiopia",
    flag: "\u{1F1EA}\u{1F1F9}",
    capital: "Addis Ababa",
    continent: "Africa",
    population: "110-125 million",
    funFact: "Uses its own calendar that is 7-8 years behind the Gregorian calendar.",
    neighbors: ["Eritrea", "Djibouti", "Somalia", "Kenya", "Sudan"],
  },
  {
    name: "Ghana",
    flag: "\u{1F1EC}\u{1F1ED}",
    capital: "Accra",
    continent: "Africa",
    population: "30-35 million",
    funFact: "Was the first sub-Saharan African country to gain independence from colonial rule (1957).",
    neighbors: ["Ivory Coast", "Togo", "Burkina Faso"],
  },
  {
    name: "Madagascar",
    flag: "\u{1F1F2}\u{1F1EC}",
    capital: "Antananarivo",
    continent: "Africa",
    population: "25-30 million",
    funFact: "About 90% of its wildlife is found nowhere else on Earth.",
    neighbors: ["Mozambique", "Comoros"],
  },

  // ── Asia ───────────────────────────────────────────────────────────────────
  {
    name: "Japan",
    flag: "\u{1F1EF}\u{1F1F5}",
    capital: "Tokyo",
    continent: "Asia",
    population: "125-130 million",
    funFact: "Has over 6,800 islands and more than 100 active volcanoes.",
    neighbors: ["South Korea", "China", "Russia"],
  },
  {
    name: "India",
    flag: "\u{1F1EE}\u{1F1F3}",
    capital: "New Delhi",
    continent: "Asia",
    population: "1.4-1.5 billion",
    funFact: "Has the most languages spoken of any country — over 780 languages.",
    neighbors: ["Pakistan", "China", "Nepal", "Bangladesh", "Myanmar"],
  },
  {
    name: "South Korea",
    flag: "\u{1F1F0}\u{1F1F7}",
    capital: "Seoul",
    continent: "Asia",
    population: "50-55 million",
    funFact: "Has the fastest average internet speed in the world.",
    neighbors: ["North Korea", "Japan", "China"],
  },
  {
    name: "Thailand",
    flag: "\u{1F1F9}\u{1F1ED}",
    capital: "Bangkok",
    continent: "Asia",
    population: "70-75 million",
    funFact: "Bangkok's full ceremonial name has 168 characters, making it one of the longest place names.",
    neighbors: ["Myanmar", "Laos", "Cambodia", "Malaysia"],
  },
  {
    name: "Vietnam",
    flag: "\u{1F1FB}\u{1F1F3}",
    capital: "Hanoi",
    continent: "Asia",
    population: "95-100 million",
    funFact: "Is the world's second-largest coffee exporter after Brazil.",
    neighbors: ["China", "Laos", "Cambodia"],
  },
  {
    name: "Turkey",
    flag: "\u{1F1F9}\u{1F1F7}",
    capital: "Ankara",
    continent: "Asia",
    population: "85-90 million",
    funFact: "Spans two continents — Europe and Asia — split by the Bosphorus strait.",
    neighbors: ["Greece", "Bulgaria", "Georgia", "Armenia", "Iran", "Iraq", "Syria"],
  },
  {
    name: "Philippines",
    flag: "\u{1F1F5}\u{1F1ED}",
    capital: "Manila",
    continent: "Asia",
    population: "110-115 million",
    funFact: "Made up of over 7,600 islands and sends the most text messages per capita in the world.",
    neighbors: ["Taiwan", "Vietnam", "Malaysia", "Indonesia"],
  },
  {
    name: "Indonesia",
    flag: "\u{1F1EE}\u{1F1E9}",
    capital: "Jakarta",
    continent: "Asia",
    population: "270-280 million",
    funFact: "Is the world's largest archipelago with over 17,000 islands.",
    neighbors: ["Malaysia", "Papua New Guinea", "East Timor", "Australia"],
  },
  {
    name: "Mongolia",
    flag: "\u{1F1F2}\u{1F1F3}",
    capital: "Ulaanbaatar",
    continent: "Asia",
    population: "3-4 million",
    funFact: "Is the most sparsely populated country in the world.",
    neighbors: ["Russia", "China"],
  },
  {
    name: "Nepal",
    flag: "\u{1F1F3}\u{1F1F5}",
    capital: "Kathmandu",
    continent: "Asia",
    population: "30-35 million",
    funFact: "Has the only non-rectangular national flag in the world — it's two stacked triangles.",
    neighbors: ["India", "China"],
  },
  {
    name: "Saudi Arabia",
    flag: "\u{1F1F8}\u{1F1E6}",
    capital: "Riyadh",
    continent: "Asia",
    population: "35-40 million",
    funFact: "Has no rivers and is one of the driest countries on Earth.",
    neighbors: ["Jordan", "Iraq", "Kuwait", "Bahrain", "Qatar", "UAE", "Oman", "Yemen"],
  },
  {
    name: "Israel",
    flag: "\u{1F1EE}\u{1F1F1}",
    capital: "Jerusalem",
    continent: "Asia",
    population: "9-10 million",
    funFact: "The Dead Sea, shared with Jordan, is the lowest point on Earth's surface.",
    neighbors: ["Lebanon", "Syria", "Jordan", "Egypt", "Palestine"],
  },

  // ── Europe ─────────────────────────────────────────────────────────────────
  {
    name: "France",
    flag: "\u{1F1EB}\u{1F1F7}",
    capital: "Paris",
    continent: "Europe",
    population: "65-70 million",
    funFact: "Is the most visited country in the world with ~90 million tourists per year.",
    neighbors: ["Germany", "Spain", "Italy", "Belgium", "Switzerland"],
  },
  {
    name: "Germany",
    flag: "\u{1F1E9}\u{1F1EA}",
    capital: "Berlin",
    continent: "Europe",
    population: "83-85 million",
    funFact: "Has over 1,500 different types of beer and the world's oldest beer purity law (Reinheitsgebot, 1516).",
    neighbors: ["France", "Poland", "Czech Republic", "Austria", "Netherlands", "Denmark"],
  },
  {
    name: "Italy",
    flag: "\u{1F1EE}\u{1F1F9}",
    capital: "Rome",
    continent: "Europe",
    population: "60-65 million",
    funFact: "Contains two entirely independent countries within its borders: Vatican City and San Marino.",
    neighbors: ["France", "Switzerland", "Austria", "Slovenia"],
  },
  {
    name: "Spain",
    flag: "\u{1F1EA}\u{1F1F8}",
    capital: "Madrid",
    continent: "Europe",
    population: "47-50 million",
    funFact: "Has more bars per capita than any other European country.",
    neighbors: ["France", "Portugal", "Andorra", "Morocco"],
  },
  {
    name: "Portugal",
    flag: "\u{1F1F5}\u{1F1F9}",
    capital: "Lisbon",
    continent: "Europe",
    population: "10-11 million",
    funFact: "Is home to the world's oldest bookstore, Livraria Bertrand, open since 1732.",
    neighbors: ["Spain"],
  },
  {
    name: "Norway",
    flag: "\u{1F1F3}\u{1F1F4}",
    capital: "Oslo",
    continent: "Europe",
    population: "5-6 million",
    funFact: "Has more than 1,000 fjords carved by glaciers over millions of years.",
    neighbors: ["Sweden", "Finland", "Russia"],
  },
  {
    name: "Sweden",
    flag: "\u{1F1F8}\u{1F1EA}",
    capital: "Stockholm",
    continent: "Europe",
    population: "10-11 million",
    funFact: "Has an Ice Hotel that is rebuilt from scratch every winter.",
    neighbors: ["Norway", "Finland", "Denmark"],
  },
  {
    name: "Greece",
    flag: "\u{1F1EC}\u{1F1F7}",
    capital: "Athens",
    continent: "Europe",
    population: "10-11 million",
    funFact: "Athens is one of the oldest cities in the world, inhabited for over 3,400 years.",
    neighbors: ["Turkey", "Bulgaria", "North Macedonia", "Albania"],
  },
  {
    name: "Poland",
    flag: "\u{1F1F5}\u{1F1F1}",
    capital: "Warsaw",
    continent: "Europe",
    population: "38-40 million",
    funFact: "Is home to the Wieliczka Salt Mine, an underground cathedral carved entirely from salt.",
    neighbors: ["Germany", "Czech Republic", "Slovakia", "Ukraine", "Belarus", "Lithuania"],
  },
  {
    name: "Ireland",
    flag: "\u{1F1EE}\u{1F1EA}",
    capital: "Dublin",
    continent: "Europe",
    population: "5-6 million",
    funFact: "Has no native snakes — legend says St. Patrick drove them all out.",
    neighbors: ["United Kingdom"],
  },
  {
    name: "Switzerland",
    flag: "\u{1F1E8}\u{1F1ED}",
    capital: "Bern",
    continent: "Europe",
    population: "8-9 million",
    funFact: "Has four official languages: German, French, Italian, and Romansh.",
    neighbors: ["Germany", "France", "Italy", "Austria", "Liechtenstein"],
  },
  {
    name: "Croatia",
    flag: "\u{1F1ED}\u{1F1F7}",
    capital: "Zagreb",
    continent: "Europe",
    population: "3-4 million",
    funFact: "The necktie (cravat) was invented here — named after Croatian soldiers.",
    neighbors: ["Slovenia", "Hungary", "Serbia", "Bosnia and Herzegovina", "Montenegro"],
  },
  {
    name: "Iceland",
    flag: "\u{1F1EE}\u{1F1F8}",
    capital: "Reykjavik",
    continent: "Europe",
    population: "350-400 thousand",
    funFact: "Has no army, navy, or air force and is home to the world's oldest parliament (Althing, 930 AD).",
    neighbors: ["Greenland", "United Kingdom"],
  },

  // ── North America ──────────────────────────────────────────────────────────
  {
    name: "Mexico",
    flag: "\u{1F1F2}\u{1F1FD}",
    capital: "Mexico City",
    continent: "North America",
    population: "125-135 million",
    funFact: "Mexico City was built on top of the ancient Aztec capital Tenochtitlan.",
    neighbors: ["United States", "Guatemala", "Belize"],
  },
  {
    name: "Canada",
    flag: "\u{1F1E8}\u{1F1E6}",
    capital: "Ottawa",
    continent: "North America",
    population: "38-40 million",
    funFact: "Has more lakes than all other countries combined — over 2 million.",
    neighbors: ["United States"],
  },
  {
    name: "Cuba",
    flag: "\u{1F1E8}\u{1F1FA}",
    capital: "Havana",
    continent: "North America",
    population: "11-12 million",
    funFact: "Classic American cars from the 1950s are still widely used as daily transport.",
    neighbors: ["United States", "Jamaica", "Haiti", "Mexico"],
  },
  {
    name: "Jamaica",
    flag: "\u{1F1EF}\u{1F1F2}",
    capital: "Kingston",
    continent: "North America",
    population: "2-3 million",
    funFact: "Birthplace of reggae music and home of Bob Marley.",
    neighbors: ["Cuba", "Haiti", "Colombia"],
  },
  {
    name: "Costa Rica",
    flag: "\u{1F1E8}\u{1F1F7}",
    capital: "San José",
    continent: "North America",
    population: "5-6 million",
    funFact: "Has no army — it was abolished in 1948 and the budget goes to education.",
    neighbors: ["Nicaragua", "Panama"],
  },
  {
    name: "Panama",
    flag: "\u{1F1F5}\u{1F1E6}",
    capital: "Panama City",
    continent: "North America",
    population: "4-5 million",
    funFact: "The Panama Canal connects the Atlantic and Pacific oceans across just 82 km.",
    neighbors: ["Costa Rica", "Colombia"],
  },
  {
    name: "Guatemala",
    flag: "\u{1F1EC}\u{1F1F9}",
    capital: "Guatemala City",
    continent: "North America",
    population: "17-18 million",
    funFact: "Was the heartland of the ancient Maya civilization.",
    neighbors: ["Mexico", "Belize", "Honduras", "El Salvador"],
  },

  // ── South America ──────────────────────────────────────────────────────────
  {
    name: "Brazil",
    flag: "\u{1F1E7}\u{1F1F7}",
    capital: "Brasília",
    continent: "South America",
    population: "210-215 million",
    funFact: "The Amazon Rainforest produces about 20% of the world's oxygen.",
    neighbors: ["Argentina", "Colombia", "Peru", "Venezuela", "Uruguay", "Paraguay"],
  },
  {
    name: "Argentina",
    flag: "\u{1F1E6}\u{1F1F7}",
    capital: "Buenos Aires",
    continent: "South America",
    population: "45-50 million",
    funFact: "Invented the tango dance and has the widest avenue in the world (Avenida 9 de Julio).",
    neighbors: ["Chile", "Brazil", "Uruguay", "Paraguay", "Bolivia"],
  },
  {
    name: "Chile",
    flag: "\u{1F1E8}\u{1F1F1}",
    capital: "Santiago",
    continent: "South America",
    population: "19-20 million",
    funFact: "Is the longest north-south country in the world, stretching 4,300 km.",
    neighbors: ["Argentina", "Bolivia", "Peru"],
  },
  {
    name: "Colombia",
    flag: "\u{1F1E8}\u{1F1F4}",
    capital: "Bogotá",
    continent: "South America",
    population: "50-55 million",
    funFact: "Is the world's leading producer of emeralds.",
    neighbors: ["Venezuela", "Brazil", "Peru", "Ecuador", "Panama"],
  },
  {
    name: "Peru",
    flag: "\u{1F1F5}\u{1F1EA}",
    capital: "Lima",
    continent: "South America",
    population: "33-35 million",
    funFact: "Home to Machu Picchu, the 'Lost City of the Incas', at 2,430 meters above sea level.",
    neighbors: ["Ecuador", "Colombia", "Brazil", "Bolivia", "Chile"],
  },
  {
    name: "Uruguay",
    flag: "\u{1F1FA}\u{1F1FE}",
    capital: "Montevideo",
    continent: "South America",
    population: "3-4 million",
    funFact: "Was the first country to legalize cannabis nationwide and hosted the first FIFA World Cup in 1930.",
    neighbors: ["Argentina", "Brazil"],
  },
  {
    name: "Ecuador",
    flag: "\u{1F1EA}\u{1F1E8}",
    capital: "Quito",
    continent: "South America",
    population: "17-18 million",
    funFact: "Named after the equator — Quito sits just 25 km south of latitude 0°.",
    neighbors: ["Colombia", "Peru"],
  },

  // ── Oceania ────────────────────────────────────────────────────────────────
  {
    name: "Australia",
    flag: "\u{1F1E6}\u{1F1FA}",
    capital: "Canberra",
    continent: "Oceania",
    population: "25-27 million",
    funFact: "Has more kangaroos than people — roughly 50 million kangaroos.",
    neighbors: ["New Zealand", "Indonesia", "Papua New Guinea"],
  },
  {
    name: "New Zealand",
    flag: "\u{1F1F3}\u{1F1FF}",
    capital: "Wellington",
    continent: "Oceania",
    population: "5-6 million",
    funFact: "Was the first country to give women the right to vote (1893) and has more sheep than people.",
    neighbors: ["Australia", "Fiji", "Tonga"],
  },
  {
    name: "Fiji",
    flag: "\u{1F1EB}\u{1F1EF}",
    capital: "Suva",
    continent: "Oceania",
    population: "900 thousand - 1 million",
    funFact: "Made up of 333 islands but only about 110 are permanently inhabited.",
    neighbors: ["Tonga", "Vanuatu", "New Zealand"],
  },
  {
    name: "Papua New Guinea",
    flag: "\u{1F1F5}\u{1F1EC}",
    capital: "Port Moresby",
    continent: "Oceania",
    population: "9-10 million",
    funFact: "Has over 840 languages — more than any other country on Earth.",
    neighbors: ["Indonesia", "Australia", "Solomon Islands"],
  },

  // ── More Asia ──────────────────────────────────────────────────────────────
  {
    name: "Bangladesh",
    flag: "\u{1F1E7}\u{1F1E9}",
    capital: "Dhaka",
    continent: "Asia",
    population: "165-175 million",
    funFact: "Has the world's largest river delta — the Ganges-Brahmaputra Delta.",
    neighbors: ["India", "Myanmar"],
  },
  {
    name: "Pakistan",
    flag: "\u{1F1F5}\u{1F1F0}",
    capital: "Islamabad",
    continent: "Asia",
    population: "220-230 million",
    funFact: "K2, the world's second-highest mountain, is on its border with China.",
    neighbors: ["India", "China", "Afghanistan", "Iran"],
  },
  {
    name: "Sri Lanka",
    flag: "\u{1F1F1}\u{1F1F0}",
    capital: "Sri Jayawardenepura Kotte",
    continent: "Asia",
    population: "21-23 million",
    funFact: "Known as the 'Pearl of the Indian Ocean' and is one of the world's top tea producers.",
    neighbors: ["India", "Maldives"],
  },

  // ── More Europe ────────────────────────────────────────────────────────────
  {
    name: "Finland",
    flag: "\u{1F1EB}\u{1F1EE}",
    capital: "Helsinki",
    continent: "Europe",
    population: "5-6 million",
    funFact: "Has about 3 million saunas for 5.5 million people — nearly one per household.",
    neighbors: ["Sweden", "Norway", "Russia"],
  },
  {
    name: "Romania",
    flag: "\u{1F1F7}\u{1F1F4}",
    capital: "Bucharest",
    continent: "Europe",
    population: "19-20 million",
    funFact: "Home to Bran Castle, popularly associated with the legend of Count Dracula.",
    neighbors: ["Hungary", "Serbia", "Bulgaria", "Moldova", "Ukraine"],
  },
  {
    name: "Czech Republic",
    flag: "\u{1F1E8}\u{1F1FF}",
    capital: "Prague",
    continent: "Europe",
    population: "10-11 million",
    funFact: "Consumes the most beer per capita of any country in the world.",
    neighbors: ["Germany", "Poland", "Slovakia", "Austria"],
  },
  {
    name: "Denmark",
    flag: "\u{1F1E9}\u{1F1F0}",
    capital: "Copenhagen",
    continent: "Europe",
    population: "5-6 million",
    funFact: "LEGO was invented here — the name comes from the Danish phrase 'leg godt' meaning 'play well'.",
    neighbors: ["Germany", "Sweden", "Norway"],
  },

  // ── More Africa ────────────────────────────────────────────────────────────
  {
    name: "Tanzania",
    flag: "\u{1F1F9}\u{1F1FF}",
    capital: "Dodoma",
    continent: "Africa",
    population: "60-65 million",
    funFact: "Home to Mount Kilimanjaro, Africa's tallest peak at 5,895 meters.",
    neighbors: ["Kenya", "Uganda", "Rwanda", "Burundi", "Congo", "Zambia", "Malawi", "Mozambique"],
  },
  {
    name: "Senegal",
    flag: "\u{1F1F8}\u{1F1F3}",
    capital: "Dakar",
    continent: "Africa",
    population: "16-18 million",
    funFact: "Dakar was the finish line of the famous Paris-Dakar Rally for decades.",
    neighbors: ["Mauritania", "Mali", "Guinea", "Guinea-Bissau", "Gambia"],
  },
];

/** All country names (sorted) for the autocomplete dropdown. */
export const countryNames: string[] = countries.map((c) => c.name).sort();

// ---------------------------------------------------------------------------
// Deterministic puzzle selection — hash the date string
// ---------------------------------------------------------------------------

function hashDate(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const ch = date.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/** Pick today's country deterministically from the date string. */
export function getGeoPuzzle(date: string): GeoPuzzle {
  const index = hashDate(date) % countries.length;
  return {
    date,
    country: countries[index],
  };
}
