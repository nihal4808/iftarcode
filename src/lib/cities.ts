export interface City {
    name: string;
    country: string;
    countryCode: string;
}

export const cities: City[] = [
    // Kerala Districts (Prioritized)
    { name: "Kozhikode", country: "India", countryCode: "IN" },
    { name: "Malappuram", country: "India", countryCode: "IN" },
    { name: "Ernakulam", country: "India", countryCode: "IN" },
    { name: "Kannur", country: "India", countryCode: "IN" },
    { name: "Kasaragod", country: "India", countryCode: "IN" },
    { name: "Wayanad", country: "India", countryCode: "IN" },
    { name: "Palakkad", country: "India", countryCode: "IN" },
    { name: "Thrissur", country: "India", countryCode: "IN" },
    { name: "Thiruvananthapuram", country: "India", countryCode: "IN" },
    { name: "Kollam", country: "India", countryCode: "IN" },
    { name: "Alappuzha", country: "India", countryCode: "IN" },
    { name: "Kottayam", country: "India", countryCode: "IN" },
    { name: "Pathanamthitta", country: "India", countryCode: "IN" },
    { name: "Idukki", country: "India", countryCode: "IN" },

    // Middle East & Global
    { name: "Mecca", country: "Saudi Arabia", countryCode: "SA" },
    { name: "Medina", country: "Saudi Arabia", countryCode: "SA" },
    { name: "Riyadh", country: "Saudi Arabia", countryCode: "SA" },
    { name: "Jeddah", country: "Saudi Arabia", countryCode: "SA" },
    { name: "Dubai", country: "UAE", countryCode: "AE" },
    { name: "Abu Dhabi", country: "UAE", countryCode: "AE" },
    { name: "Istanbul", country: "Turkey", countryCode: "TR" },
    { name: "Ankara", country: "Turkey", countryCode: "TR" },
    { name: "Cairo", country: "Egypt", countryCode: "EG" },
    { name: "Karachi", country: "Pakistan", countryCode: "PK" },
    { name: "Lahore", country: "Pakistan", countryCode: "PK" },
    { name: "Islamabad", country: "Pakistan", countryCode: "PK" },
    { name: "Dhaka", country: "Bangladesh", countryCode: "BD" },
    { name: "Jakarta", country: "Indonesia", countryCode: "ID" },
    { name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY" },
    { name: "Tehran", country: "Iran", countryCode: "IR" },
    { name: "Baghdad", country: "Iraq", countryCode: "IQ" },
    { name: "Amman", country: "Jordan", countryCode: "JO" },
    { name: "Beirut", country: "Lebanon", countryCode: "LB" },
    { name: "Casablanca", country: "Morocco", countryCode: "MA" },
    { name: "Tunis", country: "Tunisia", countryCode: "TN" },
    { name: "Doha", country: "Qatar", countryCode: "QA" },
    { name: "Kuwait City", country: "Kuwait", countryCode: "KW" },
    { name: "Muscat", country: "Oman", countryCode: "OM" },
    { name: "Mumbai", country: "India", countryCode: "IN" },
    { name: "Delhi", country: "India", countryCode: "IN" },
    { name: "Hyderabad", country: "India", countryCode: "IN" },
    { name: "Lucknow", country: "India", countryCode: "IN" },
    { name: "London", country: "United Kingdom", countryCode: "GB" },
    { name: "Paris", country: "France", countryCode: "FR" },
    { name: "Berlin", country: "Germany", countryCode: "DE" },
    { name: "New York", country: "United States", countryCode: "US" },
    { name: "Los Angeles", country: "United States", countryCode: "US" },
    { name: "Chicago", country: "United States", countryCode: "US" },
    { name: "Toronto", country: "Canada", countryCode: "CA" },
    { name: "Sydney", country: "Australia", countryCode: "AU" },
    { name: "Melbourne", country: "Australia", countryCode: "AU" },
    { name: "Nairobi", country: "Kenya", countryCode: "KE" },
    { name: "Lagos", country: "Nigeria", countryCode: "NG" },
    { name: "Dakar", country: "Senegal", countryCode: "SN" },
];

export function getCityByName(name: string): City | undefined {
    return cities.find(c => c.name === name);
}
