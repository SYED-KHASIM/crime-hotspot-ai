/**
 * script.js — CrimeHotspotAI India Frontend
 * ==========================================
 * Features:
 *  - Auth (login/logout via localStorage token)
 *  - State → District cascading dropdowns (India districts)
 *  - API connectivity check
 *  - Prediction form + validation
 *  - High Risk alert banner
 *  - Result rendering (risk badge, probability bars, patrol suggestion)
 *  - India Leaflet map with markers + heatmap
 *  - Prediction history
 */

"use strict";

const API_BASE = "http://localhost:5000";

// ─── India State → Districts mapping ──────────────────────────────────────────
// Full coverage: 28 States + 8 UTs → 700+ districts
//
// Each district entry: { id, name }
//   id   → backend district ID (1–25). Districts without a direct model
//           equivalent are mapped to the nearest/most-representative model
//           district so the prediction API always receives a valid 1-25 value.
//   name → real district name shown in the UI dropdown.
//
// Mapping legend for unmapped districts:
//   Model IDs used as proxies
//   1=Mumbai  2=New Delhi  3=Bengaluru  4=Hyderabad  5=Chennai
//   6=Kolkata  7=Ahmedabad  8=Pune  9=Lucknow  10=Patna
//   11=Nagpur  12=Goa  13=Jaipur  14=Chandigarh  15=Agra
//   16=Indore  17=Raipur  18=Bhubaneswar  19=Thiruvananthapuram
//   20=Coimbatore  21=Varanasi  22=Bhopal  23=Shimla
//   24=Srinagar  25=Puducherry

const INDIA_DISTRICTS = {

  // ── Andhra Pradesh (26 districts) ──────────────────────────────────────────
  "Andhra Pradesh": [
    { id: 4,  name: "Anantapur" },
    { id: 4,  name: "Chittoor" },
    { id: 4,  name: "East Godavari" },
    { id: 4,  name: "Eluru (West Godavari)" },
    { id: 4,  name: "Guntur" },
    { id: 4,  name: "Kadapa (YSR)" },
    { id: 4,  name: "Kakinada" },
    { id: 4,  name: "Konaseema" },
    { id: 4,  name: "Krishna" },
    { id: 4,  name: "Kurnool" },
    { id: 4,  name: "Manyam (Parvathipuram)" },
    { id: 4,  name: "Nandyal" },
    { id: 4,  name: "NTR (Vijayawada)" },
    { id: 4,  name: "Palnadu" },
    { id: 4,  name: "Prakasam" },
    { id: 4,  name: "Sri Balaji (Tirupati)" },
    { id: 4,  name: "Sri Satya Sai" },
    { id: 4,  name: "Srikakulam" },
    { id: 4,  name: "Visakhapatnam" },
    { id: 4,  name: "Vizianagaram" },
    { id: 4,  name: "West Godavari" },
  ],

  // ── Arunachal Pradesh (26 districts) ───────────────────────────────────────
  "Arunachal Pradesh": [
    { id: 23, name: "Anjaw" },
    { id: 23, name: "Capital Complex Itanagar" },
    { id: 23, name: "Changlang" },
    { id: 23, name: "Dibang Valley" },
    { id: 23, name: "East Kameng" },
    { id: 23, name: "East Siang" },
    { id: 23, name: "Kamle" },
    { id: 23, name: "Kra Daadi" },
    { id: 23, name: "Kurung Kumey" },
    { id: 23, name: "Lepa Rada" },
    { id: 23, name: "Lohit" },
    { id: 23, name: "Longding" },
    { id: 23, name: "Lower Dibang Valley" },
    { id: 23, name: "Lower Siang" },
    { id: 23, name: "Lower Subansiri" },
    { id: 23, name: "Namsai" },
    { id: 23, name: "Pakke-Kessang" },
    { id: 23, name: "Papum Pare" },
    { id: 23, name: "Shi Yomi" },
    { id: 23, name: "Siang" },
    { id: 23, name: "Tawang" },
    { id: 23, name: "Tirap" },
    { id: 23, name: "Upper Dibang Valley" },
    { id: 23, name: "Upper Siang" },
    { id: 23, name: "Upper Subansiri" },
    { id: 23, name: "West Kameng" },
    { id: 23, name: "West Siang" },
  ],

  // ── Assam (35 districts) ───────────────────────────────────────────────────
  "Assam": [
    { id: 6,  name: "Bajali" },
    { id: 6,  name: "Baksa" },
    { id: 6,  name: "Barpeta" },
    { id: 6,  name: "Biswanath" },
    { id: 6,  name: "Bongaigaon" },
    { id: 6,  name: "Cachar" },
    { id: 6,  name: "Charaideo" },
    { id: 6,  name: "Chirang" },
    { id: 6,  name: "Darrang" },
    { id: 6,  name: "Dhemaji" },
    { id: 6,  name: "Dhubri" },
    { id: 6,  name: "Dibrugarh" },
    { id: 6,  name: "Dima Hasao" },
    { id: 6,  name: "Goalpara" },
    { id: 6,  name: "Golaghat" },
    { id: 6,  name: "Hailakandi" },
    { id: 6,  name: "Hojai" },
    { id: 6,  name: "Jorhat" },
    { id: 6,  name: "Kamrup" },
    { id: 6,  name: "Kamrup Metropolitan (Guwahati)" },
    { id: 6,  name: "Karbi Anglong" },
    { id: 6,  name: "Karimganj" },
    { id: 6,  name: "Kokrajhar" },
    { id: 6,  name: "Lakhimpur" },
    { id: 6,  name: "Majuli" },
    { id: 6,  name: "Morigaon" },
    { id: 6,  name: "Nagaon" },
    { id: 6,  name: "Nalbari" },
    { id: 6,  name: "Sivasagar" },
    { id: 6,  name: "Sonitpur" },
    { id: 6,  name: "South Salmara-Mankachar" },
    { id: 6,  name: "Tamulpur" },
    { id: 6,  name: "Tinsukia" },
    { id: 6,  name: "Udalguri" },
    { id: 6,  name: "West Karbi Anglong" },
  ],

  // ── Bihar (38 districts) ───────────────────────────────────────────────────
  "Bihar": [
    { id: 10, name: "Araria" },
    { id: 10, name: "Arwal" },
    { id: 10, name: "Aurangabad" },
    { id: 10, name: "Banka" },
    { id: 10, name: "Begusarai" },
    { id: 10, name: "Bhagalpur" },
    { id: 10, name: "Bhojpur" },
    { id: 10, name: "Buxar" },
    { id: 10, name: "Darbhanga" },
    { id: 10, name: "East Champaran" },
    { id: 10, name: "Gaya" },
    { id: 10, name: "Gopalganj" },
    { id: 10, name: "Jamui" },
    { id: 10, name: "Jehanabad" },
    { id: 10, name: "Kaimur" },
    { id: 10, name: "Katihar" },
    { id: 10, name: "Khagaria" },
    { id: 10, name: "Kishanganj" },
    { id: 10, name: "Lakhisarai" },
    { id: 10, name: "Madhepura" },
    { id: 10, name: "Madhubani" },
    { id: 10, name: "Munger" },
    { id: 10, name: "Muzaffarpur" },
    { id: 10, name: "Nalanda" },
    { id: 10, name: "Nawada" },
    { id: 10, name: "Patna" },
    { id: 10, name: "Purnia" },
    { id: 10, name: "Rohtas" },
    { id: 10, name: "Saharsa" },
    { id: 10, name: "Samastipur" },
    { id: 10, name: "Saran" },
    { id: 10, name: "Sheikhpura" },
    { id: 10, name: "Sheohar" },
    { id: 10, name: "Sitamarhi" },
    { id: 10, name: "Siwan" },
    { id: 10, name: "Supaul" },
    { id: 10, name: "Vaishali" },
    { id: 10, name: "West Champaran" },
  ],

  // ── Chhattisgarh (33 districts) ────────────────────────────────────────────
  "Chhattisgarh": [
    { id: 17, name: "Balod" },
    { id: 17, name: "Baloda Bazar" },
    { id: 17, name: "Balrampur" },
    { id: 17, name: "Bastar" },
    { id: 17, name: "Bemetara" },
    { id: 17, name: "Bijapur" },
    { id: 17, name: "Bilaspur" },
    { id: 17, name: "Dantewada" },
    { id: 17, name: "Dhamtari" },
    { id: 17, name: "Durg" },
    { id: 17, name: "Gariaband" },
    { id: 17, name: "Gaurela-Pendra-Marwahi" },
    { id: 17, name: "Janjgir-Champa" },
    { id: 17, name: "Jashpur" },
    { id: 17, name: "Kabirdham" },
    { id: 17, name: "Kanker" },
    { id: 17, name: "Khairagarh" },
    { id: 17, name: "Kondagaon" },
    { id: 17, name: "Korba" },
    { id: 17, name: "Koriya" },
    { id: 17, name: "Mahasamund" },
    { id: 17, name: "Manendragarh" },
    { id: 17, name: "Mohla-Manpur" },
    { id: 17, name: "Mungeli" },
    { id: 17, name: "Narayanpur" },
    { id: 17, name: "Raigarh" },
    { id: 17, name: "Raipur" },
    { id: 17, name: "Rajnandgaon" },
    { id: 17, name: "Sakti" },
    { id: 17, name: "Sarangarh-Bilaigarh" },
    { id: 17, name: "Sukma" },
    { id: 17, name: "Surajpur" },
    { id: 17, name: "Surguja" },
  ],

  // ── Goa (2 districts) ──────────────────────────────────────────────────────
  "Goa": [
    { id: 12, name: "North Goa (Panaji)" },
    { id: 12, name: "South Goa (Margao)" },
  ],

  // ── Gujarat (33 districts) ─────────────────────────────────────────────────
  "Gujarat": [
    { id: 7,  name: "Ahmedabad" },
    { id: 7,  name: "Amreli" },
    { id: 7,  name: "Anand" },
    { id: 7,  name: "Aravalli" },
    { id: 7,  name: "Banaskantha" },
    { id: 7,  name: "Bharuch" },
    { id: 7,  name: "Bhavnagar" },
    { id: 7,  name: "Botad" },
    { id: 7,  name: "Chhota Udaipur" },
    { id: 7,  name: "Dahod" },
    { id: 7,  name: "Dang" },
    { id: 7,  name: "Devbhoomi Dwarka" },
    { id: 7,  name: "Gandhinagar" },
    { id: 7,  name: "Gir Somnath" },
    { id: 7,  name: "Jamnagar" },
    { id: 7,  name: "Junagadh" },
    { id: 7,  name: "Kheda" },
    { id: 7,  name: "Kutch" },
    { id: 7,  name: "Mahisagar" },
    { id: 7,  name: "Mehsana" },
    { id: 7,  name: "Morbi" },
    { id: 7,  name: "Narmada" },
    { id: 7,  name: "Navsari" },
    { id: 7,  name: "Panchmahal" },
    { id: 7,  name: "Patan" },
    { id: 7,  name: "Porbandar" },
    { id: 7,  name: "Rajkot" },
    { id: 7,  name: "Sabarkantha" },
    { id: 7,  name: "Surat" },
    { id: 7,  name: "Surendranagar" },
    { id: 7,  name: "Tapi" },
    { id: 7,  name: "Vadodara" },
    { id: 7,  name: "Valsad" },
  ],

  // ── Haryana (22 districts) ─────────────────────────────────────────────────
  "Haryana": [
    { id: 14, name: "Ambala" },
    { id: 14, name: "Bhiwani" },
    { id: 14, name: "Charkhi Dadri" },
    { id: 14, name: "Faridabad" },
    { id: 14, name: "Fatehabad" },
    { id: 14, name: "Gurugram" },
    { id: 14, name: "Hisar" },
    { id: 14, name: "Jhajjar" },
    { id: 14, name: "Jind" },
    { id: 14, name: "Kaithal" },
    { id: 14, name: "Karnal" },
    { id: 14, name: "Kurukshetra" },
    { id: 14, name: "Mahendragarh" },
    { id: 14, name: "Nuh" },
    { id: 14, name: "Palwal" },
    { id: 14, name: "Panchkula" },
    { id: 14, name: "Panipat" },
    { id: 14, name: "Rewari" },
    { id: 14, name: "Rohtak" },
    { id: 14, name: "Sirsa" },
    { id: 14, name: "Sonipat" },
    { id: 14, name: "Yamunanagar" },
  ],

  // ── Himachal Pradesh (12 districts) ───────────────────────────────────────
  "Himachal Pradesh": [
    { id: 23, name: "Bilaspur" },
    { id: 23, name: "Chamba" },
    { id: 23, name: "Hamirpur" },
    { id: 23, name: "Kangra" },
    { id: 23, name: "Kinnaur" },
    { id: 23, name: "Kullu" },
    { id: 23, name: "Lahaul & Spiti" },
    { id: 23, name: "Mandi" },
    { id: 23, name: "Shimla" },
    { id: 23, name: "Sirmaur" },
    { id: 23, name: "Solan" },
    { id: 23, name: "Una" },
  ],

  // ── Jharkhand (24 districts) ───────────────────────────────────────────────
  "Jharkhand": [
    { id: 10, name: "Bokaro" },
    { id: 10, name: "Chatra" },
    { id: 10, name: "Deoghar" },
    { id: 10, name: "Dhanbad" },
    { id: 10, name: "Dumka" },
    { id: 10, name: "East Singhbhum" },
    { id: 10, name: "Garhwa" },
    { id: 10, name: "Giridih" },
    { id: 10, name: "Godda" },
    { id: 10, name: "Gumla" },
    { id: 10, name: "Hazaribagh" },
    { id: 10, name: "Jamtara" },
    { id: 10, name: "Khunti" },
    { id: 10, name: "Koderma" },
    { id: 10, name: "Latehar" },
    { id: 10, name: "Lohardaga" },
    { id: 10, name: "Pakur" },
    { id: 10, name: "Palamu" },
    { id: 10, name: "Ramgarh" },
    { id: 10, name: "Ranchi" },
    { id: 10, name: "Sahebganj" },
    { id: 10, name: "Seraikela Kharsawan" },
    { id: 10, name: "Simdega" },
    { id: 10, name: "West Singhbhum" },
  ],

  // ── Karnataka (31 districts) ──────────────────────────────────────────────
  "Karnataka": [
    { id: 3,  name: "Bagalkot" },
    { id: 3,  name: "Ballari" },
    { id: 3,  name: "Belagavi" },
    { id: 3,  name: "Bengaluru Rural" },
    { id: 3,  name: "Bengaluru Urban" },
    { id: 3,  name: "Bidar" },
    { id: 3,  name: "Chamarajanagar" },
    { id: 3,  name: "Chikkaballapur" },
    { id: 3,  name: "Chikkamagaluru" },
    { id: 3,  name: "Chitradurga" },
    { id: 3,  name: "Dakshina Kannada" },
    { id: 3,  name: "Davanagere" },
    { id: 3,  name: "Dharwad" },
    { id: 3,  name: "Gadag" },
    { id: 3,  name: "Hassan" },
    { id: 3,  name: "Haveri" },
    { id: 3,  name: "Kalaburagi" },
    { id: 3,  name: "Kodagu" },
    { id: 3,  name: "Kolar" },
    { id: 3,  name: "Koppal" },
    { id: 3,  name: "Mandya" },
    { id: 3,  name: "Mysuru" },
    { id: 3,  name: "Raichur" },
    { id: 3,  name: "Ramanagara" },
    { id: 3,  name: "Shivamogga" },
    { id: 3,  name: "Tumakuru" },
    { id: 3,  name: "Udupi" },
    { id: 3,  name: "Uttara Kannada" },
    { id: 3,  name: "Vijayanagara" },
    { id: 3,  name: "Vijayapura" },
    { id: 3,  name: "Yadgir" },
  ],

  // ── Kerala (14 districts) ──────────────────────────────────────────────────
  "Kerala": [
    { id: 19, name: "Alappuzha" },
    { id: 19, name: "Ernakulam" },
    { id: 19, name: "Idukki" },
    { id: 19, name: "Kannur" },
    { id: 19, name: "Kasaragod" },
    { id: 19, name: "Kollam" },
    { id: 19, name: "Kottayam" },
    { id: 19, name: "Kozhikode" },
    { id: 19, name: "Malappuram" },
    { id: 19, name: "Palakkad" },
    { id: 19, name: "Pathanamthitta" },
    { id: 19, name: "Thiruvananthapuram" },
    { id: 19, name: "Thrissur" },
    { id: 19, name: "Wayanad" },
  ],

  // ── Madhya Pradesh (55 districts) ─────────────────────────────────────────
  "Madhya Pradesh": [
    { id: 22, name: "Agar Malwa" },
    { id: 22, name: "Alirajpur" },
    { id: 22, name: "Anuppur" },
    { id: 22, name: "Ashoknagar" },
    { id: 22, name: "Balaghat" },
    { id: 22, name: "Barwani" },
    { id: 22, name: "Betul" },
    { id: 22, name: "Bhind" },
    { id: 22, name: "Bhopal" },
    { id: 22, name: "Burhanpur" },
    { id: 22, name: "Chhatarpur" },
    { id: 22, name: "Chhindwara" },
    { id: 22, name: "Damoh" },
    { id: 22, name: "Datia" },
    { id: 22, name: "Dewas" },
    { id: 22, name: "Dhar" },
    { id: 22, name: "Dindori" },
    { id: 22, name: "Guna" },
    { id: 22, name: "Gwalior" },
    { id: 16, name: "Harda" },
    { id: 22, name: "Hoshangabad (Narmadapuram)" },
    { id: 16, name: "Indore" },
    { id: 22, name: "Jabalpur" },
    { id: 22, name: "Jhabua" },
    { id: 22, name: "Katni" },
    { id: 22, name: "Khandwa" },
    { id: 22, name: "Khargone" },
    { id: 22, name: "Maihar" },
    { id: 22, name: "Mandla" },
    { id: 22, name: "Mandsaur" },
    { id: 22, name: "Mauganj" },
    { id: 16, name: "Morena" },
    { id: 22, name: "Narsimhapur" },
    { id: 22, name: "Neemuch" },
    { id: 22, name: "Niwari" },
    { id: 22, name: "Pandhurna" },
    { id: 22, name: "Panna" },
    { id: 22, name: "Raisen" },
    { id: 22, name: "Rajgarh" },
    { id: 22, name: "Ratlam" },
    { id: 22, name: "Rewa" },
    { id: 22, name: "Sagar" },
    { id: 22, name: "Satna" },
    { id: 22, name: "Sehore" },
    { id: 22, name: "Seoni" },
    { id: 22, name: "Shahdol" },
    { id: 22, name: "Shajapur" },
    { id: 22, name: "Sheopur" },
    { id: 22, name: "Shivpuri" },
    { id: 22, name: "Sidhi" },
    { id: 22, name: "Singrauli" },
    { id: 22, name: "Tikamgarh" },
    { id: 22, name: "Ujjain" },
    { id: 22, name: "Umaria" },
    { id: 22, name: "Vidisha" },
  ],

  // ── Maharashtra (36 districts) ────────────────────────────────────────────
  "Maharashtra": [
    { id: 1,  name: "Ahmednagar" },
    { id: 7,  name: "Akola" },
    { id: 7,  name: "Amravati" },
    { id: 11, name: "Aurangabad (Chhatrapati Sambhajinagar)" },
    { id: 1,  name: "Beed" },
    { id: 11, name: "Bhandara" },
    { id: 1,  name: "Buldhana" },
    { id: 11, name: "Chandrapur" },
    { id: 8,  name: "Dhule" },
    { id: 11, name: "Gadchiroli" },
    { id: 11, name: "Gondia" },
    { id: 8,  name: "Hingoli" },
    { id: 8,  name: "Jalgaon" },
    { id: 8,  name: "Jalna" },
    { id: 8,  name: "Kolhapur" },
    { id: 1,  name: "Latur" },
    { id: 1,  name: "Mumbai City" },
    { id: 1,  name: "Mumbai Suburban" },
    { id: 8,  name: "Nagpur" },
    { id: 8,  name: "Nanded" },
    { id: 11, name: "Nandurbar" },
    { id: 1,  name: "Nashik" },
    { id: 1,  name: "Osmanabad (Dharashiv)" },
    { id: 8,  name: "Palghar" },
    { id: 1,  name: "Parbhani" },
    { id: 8,  name: "Pune" },
    { id: 1,  name: "Raigad" },
    { id: 1,  name: "Ratnagiri" },
    { id: 1,  name: "Sangli" },
    { id: 1,  name: "Satara" },
    { id: 1,  name: "Sindhudurg" },
    { id: 8,  name: "Solapur" },
    { id: 1,  name: "Thane" },
    { id: 8,  name: "Wardha" },
    { id: 11, name: "Washim" },
    { id: 8,  name: "Yavatmal" },
  ],

  // ── Manipur (16 districts) ─────────────────────────────────────────────────
  "Manipur": [
    { id: 6,  name: "Bishnupur" },
    { id: 6,  name: "Chandel" },
    { id: 6,  name: "Churachandpur" },
    { id: 6,  name: "Imphal East" },
    { id: 6,  name: "Imphal West" },
    { id: 6,  name: "Jiribam" },
    { id: 6,  name: "Kakching" },
    { id: 6,  name: "Kamjong" },
    { id: 6,  name: "Kangpokpi" },
    { id: 6,  name: "Noney" },
    { id: 6,  name: "Pherzawl" },
    { id: 6,  name: "Senapati" },
    { id: 6,  name: "Tamenglong" },
    { id: 6,  name: "Tengnoupal" },
    { id: 6,  name: "Thoubal" },
    { id: 6,  name: "Ukhrul" },
  ],

  // ── Meghalaya (12 districts) ───────────────────────────────────────────────
  "Meghalaya": [
    { id: 6,  name: "East Garo Hills" },
    { id: 6,  name: "East Jaintia Hills" },
    { id: 6,  name: "East Khasi Hills (Shillong)" },
    { id: 6,  name: "Eastern West Khasi Hills" },
    { id: 6,  name: "North Garo Hills" },
    { id: 6,  name: "Ri Bhoi" },
    { id: 6,  name: "South Garo Hills" },
    { id: 6,  name: "South West Garo Hills" },
    { id: 6,  name: "South West Khasi Hills" },
    { id: 6,  name: "West Garo Hills" },
    { id: 6,  name: "West Jaintia Hills" },
    { id: 6,  name: "West Khasi Hills" },
  ],

  // ── Mizoram (11 districts) ─────────────────────────────────────────────────
  "Mizoram": [
    { id: 6,  name: "Aizawl" },
    { id: 6,  name: "Champhai" },
    { id: 6,  name: "Hnahthial" },
    { id: 6,  name: "Khawzawl" },
    { id: 6,  name: "Kolasib" },
    { id: 6,  name: "Lawngtlai" },
    { id: 6,  name: "Lunglei" },
    { id: 6,  name: "Mamit" },
    { id: 6,  name: "Saiha" },
    { id: 6,  name: "Saitual" },
    { id: 6,  name: "Serchhip" },
  ],

  // ── Nagaland (16 districts) ────────────────────────────────────────────────
  "Nagaland": [
    { id: 6,  name: "Chumoukedima" },
    { id: 6,  name: "Dimapur" },
    { id: 6,  name: "Kiphire" },
    { id: 6,  name: "Kohima" },
    { id: 6,  name: "Longleng" },
    { id: 6,  name: "Mokokchung" },
    { id: 6,  name: "Mon" },
    { id: 6,  name: "Niuland" },
    { id: 6,  name: "Noklak" },
    { id: 6,  name: "Peren" },
    { id: 6,  name: "Phek" },
    { id: 6,  name: "Shamator" },
    { id: 6,  name: "Tseminyu" },
    { id: 6,  name: "Tuensang" },
    { id: 6,  name: "Wokha" },
    { id: 6,  name: "Zunheboto" },
  ],

  // ── Odisha (30 districts) ──────────────────────────────────────────────────
  "Odisha": [
    { id: 18, name: "Angul" },
    { id: 18, name: "Balangir" },
    { id: 18, name: "Balasore" },
    { id: 18, name: "Bargarh" },
    { id: 18, name: "Bhadrak" },
    { id: 18, name: "Bhubaneswar (Khordha)" },
    { id: 18, name: "Boudh" },
    { id: 18, name: "Cuttack" },
    { id: 18, name: "Deogarh" },
    { id: 18, name: "Dhenkanal" },
    { id: 18, name: "Gajapati" },
    { id: 18, name: "Ganjam" },
    { id: 18, name: "Jagatsinghpur" },
    { id: 18, name: "Jajpur" },
    { id: 18, name: "Jharsuguda" },
    { id: 18, name: "Kalahandi" },
    { id: 18, name: "Kandhamal" },
    { id: 18, name: "Kendrapara" },
    { id: 18, name: "Kendujhar" },
    { id: 18, name: "Koraput" },
    { id: 18, name: "Malkangiri" },
    { id: 18, name: "Mayurbhanj" },
    { id: 18, name: "Nabarangapur" },
    { id: 18, name: "Nayagarh" },
    { id: 18, name: "Nuapada" },
    { id: 18, name: "Puri" },
    { id: 18, name: "Rayagada" },
    { id: 18, name: "Sambalpur" },
    { id: 18, name: "Subarnapur" },
    { id: 18, name: "Sundargarh" },
  ],

  // ── Punjab (23 districts) ──────────────────────────────────────────────────
  "Punjab": [
    { id: 14, name: "Amritsar" },
    { id: 14, name: "Barnala" },
    { id: 14, name: "Bathinda" },
    { id: 14, name: "Faridkot" },
    { id: 14, name: "Fatehgarh Sahib" },
    { id: 14, name: "Fazilka" },
    { id: 14, name: "Ferozepur" },
    { id: 14, name: "Gurdaspur" },
    { id: 14, name: "Hoshiarpur" },
    { id: 14, name: "Jalandhar" },
    { id: 14, name: "Kapurthala" },
    { id: 14, name: "Ludhiana" },
    { id: 14, name: "Malerkotla" },
    { id: 14, name: "Mansa" },
    { id: 14, name: "Moga" },
    { id: 14, name: "Mohali (SAS Nagar)" },
    { id: 14, name: "Muktsar" },
    { id: 14, name: "Pathankot" },
    { id: 14, name: "Patiala" },
    { id: 14, name: "Rupnagar" },
    { id: 14, name: "Sangrur" },
    { id: 14, name: "Shaheed Bhagat Singh Nagar" },
    { id: 14, name: "Tarn Taran" },
  ],

  // ── Rajasthan (50 districts) ───────────────────────────────────────────────
  "Rajasthan": [
    { id: 13, name: "Ajmer" },
    { id: 13, name: "Alwar" },
    { id: 13, name: "Anupgarh" },
    { id: 13, name: "Balotra" },
    { id: 13, name: "Banswara" },
    { id: 13, name: "Baran" },
    { id: 13, name: "Barmer" },
    { id: 13, name: "Beawar" },
    { id: 13, name: "Bharatpur" },
    { id: 13, name: "Bhilwara" },
    { id: 13, name: "Bikaner" },
    { id: 13, name: "Bundi" },
    { id: 13, name: "Chittorgarh" },
    { id: 13, name: "Churu" },
    { id: 13, name: "Dausa" },
    { id: 13, name: "Deeg" },
    { id: 13, name: "Dholpur" },
    { id: 13, name: "Didwana-Kuchaman" },
    { id: 13, name: "Dudu" },
    { id: 13, name: "Dungarpur" },
    { id: 13, name: "Gangapur City" },
    { id: 13, name: "Hanumangarh" },
    { id: 13, name: "Jaipur" },
    { id: 13, name: "Jaipur Rural" },
    { id: 13, name: "Jaisalmer" },
    { id: 13, name: "Jalore" },
    { id: 13, name: "Jhalawar" },
    { id: 13, name: "Jhunjhunu" },
    { id: 13, name: "Jodhpur" },
    { id: 13, name: "Jodhpur Rural" },
    { id: 13, name: "Karauli" },
    { id: 13, name: "Kekri" },
    { id: 13, name: "Khairthal-Tijara" },
    { id: 13, name: "Kota" },
    { id: 13, name: "Kotputli-Behror" },
    { id: 13, name: "Nagaur" },
    { id: 13, name: "Neem Ka Thana" },
    { id: 13, name: "Pali" },
    { id: 13, name: "Phalodi" },
    { id: 13, name: "Pratapgarh" },
    { id: 13, name: "Rajsamand" },
    { id: 13, name: "Salumbar" },
    { id: 13, name: "Sanchore" },
    { id: 13, name: "Sawai Madhopur" },
    { id: 13, name: "Shahpura" },
    { id: 13, name: "Sikar" },
    { id: 13, name: "Sirohi" },
    { id: 13, name: "Sri Ganganagar" },
    { id: 13, name: "Tonk" },
    { id: 13, name: "Udaipur" },
  ],

  // ── Sikkim (6 districts) ───────────────────────────────────────────────────
  "Sikkim": [
    { id: 23, name: "East Sikkim (Gangtok)" },
    { id: 23, name: "North Sikkim (Mangan)" },
    { id: 23, name: "Pakyong" },
    { id: 23, name: "Soreng" },
    { id: 23, name: "South Sikkim (Namchi)" },
    { id: 23, name: "West Sikkim (Gyalshing)" },
  ],

  // ── Tamil Nadu (38 districts) ─────────────────────────────────────────────
  "Tamil Nadu": [
    { id: 5,  name: "Ariyalur" },
    { id: 5,  name: "Chengalpattu" },
    { id: 5,  name: "Chennai" },
    { id: 20, name: "Coimbatore" },
    { id: 5,  name: "Cuddalore" },
    { id: 5,  name: "Dharmapuri" },
    { id: 5,  name: "Dindigul" },
    { id: 5,  name: "Erode" },
    { id: 5,  name: "Kallakurichi" },
    { id: 5,  name: "Kancheepuram" },
    { id: 5,  name: "Kanniyakumari" },
    { id: 5,  name: "Karur" },
    { id: 5,  name: "Krishnagiri" },
    { id: 5,  name: "Madurai" },
    { id: 5,  name: "Mayiladuthurai" },
    { id: 5,  name: "Nagapattinam" },
    { id: 20, name: "Namakkal" },
    { id: 5,  name: "Nilgiris" },
    { id: 5,  name: "Perambalur" },
    { id: 5,  name: "Pudukkottai" },
    { id: 25, name: "Ramanathapuram" },
    { id: 5,  name: "Ranipet" },
    { id: 5,  name: "Salem" },
    { id: 5,  name: "Sivaganga" },
    { id: 20, name: "Tenkasi" },
    { id: 5,  name: "Thanjavur" },
    { id: 5,  name: "Theni" },
    { id: 5,  name: "Thoothukudi" },
    { id: 5,  name: "Tiruchirappalli" },
    { id: 5,  name: "Tirunelveli" },
    { id: 5,  name: "Tirupathur" },
    { id: 5,  name: "Tiruppur" },
    { id: 5,  name: "Tiruvallur" },
    { id: 5,  name: "Tiruvannamalai" },
    { id: 5,  name: "Tiruvarur" },
    { id: 5,  name: "Vellore" },
    { id: 5,  name: "Villupuram" },
    { id: 5,  name: "Virudhunagar" },
  ],

  // ── Telangana (33 districts) ──────────────────────────────────────────────
  "Telangana": [
    { id: 4,  name: "Adilabad" },
    { id: 4,  name: "Bhadradri Kothagudem" },
    { id: 4,  name: "Hanumakonda" },
    { id: 4,  name: "Hyderabad" },
    { id: 4,  name: "Jagtial" },
    { id: 4,  name: "Jangaon" },
    { id: 4,  name: "Jayashankar Bhupalpally" },
    { id: 4,  name: "Jogulamba Gadwal" },
    { id: 4,  name: "Kamareddy" },
    { id: 4,  name: "Karimnagar" },
    { id: 4,  name: "Khammam" },
    { id: 4,  name: "Kumuram Bheem Asifabad" },
    { id: 4,  name: "Mahabubabad" },
    { id: 4,  name: "Mahabubnagar" },
    { id: 4,  name: "Mancherial" },
    { id: 4,  name: "Medak" },
    { id: 4,  name: "Medchal-Malkajgiri" },
    { id: 4,  name: "Mulugu" },
    { id: 4,  name: "Nagarkurnool" },
    { id: 4,  name: "Nalgonda" },
    { id: 4,  name: "Narayanpet" },
    { id: 4,  name: "Nirmal" },
    { id: 4,  name: "Nizamabad" },
    { id: 4,  name: "Peddapalli" },
    { id: 4,  name: "Rajanna Sircilla" },
    { id: 4,  name: "Rangareddy" },
    { id: 4,  name: "Sangareddy" },
    { id: 4,  name: "Siddipet" },
    { id: 4,  name: "Suryapet" },
    { id: 4,  name: "Vikarabad" },
    { id: 4,  name: "Wanaparthy" },
    { id: 4,  name: "Warangal" },
    { id: 4,  name: "Yadadri Bhuvanagiri" },
  ],

  // ── Tripura (8 districts) ──────────────────────────────────────────────────
  "Tripura": [
    { id: 6,  name: "Dhalai" },
    { id: 6,  name: "Gomati" },
    { id: 6,  name: "Khowai" },
    { id: 6,  name: "North Tripura" },
    { id: 6,  name: "Sepahijala" },
    { id: 6,  name: "South Tripura" },
    { id: 6,  name: "Unakoti" },
    { id: 6,  name: "West Tripura (Agartala)" },
  ],

  // ── Uttar Pradesh (75 districts) ──────────────────────────────────────────
  "Uttar Pradesh": [
    { id: 15, name: "Agra" },
    { id: 9,  name: "Aligarh" },
    { id: 9,  name: "Ambedkar Nagar" },
    { id: 9,  name: "Amethi" },
    { id: 9,  name: "Amroha" },
    { id: 9,  name: "Auraiya" },
    { id: 21, name: "Ayodhya" },
    { id: 21, name: "Azamgarh" },
    { id: 9,  name: "Baghpat" },
    { id: 21, name: "Bahraich" },
    { id: 21, name: "Ballia" },
    { id: 21, name: "Balrampur" },
    { id: 9,  name: "Banda" },
    { id: 21, name: "Barabanki" },
    { id: 9,  name: "Bareilly" },
    { id: 21, name: "Basti" },
    { id: 9,  name: "Bijnor" },
    { id: 9,  name: "Budaun" },
    { id: 9,  name: "Bulandshahr" },
    { id: 9,  name: "Chandauli" },
    { id: 9,  name: "Chitrakoot" },
    { id: 21, name: "Deoria" },
    { id: 15, name: "Etah" },
    { id: 15, name: "Etawah" },
    { id: 21, name: "Farrukhabad" },
    { id: 9,  name: "Fatehpur" },
    { id: 9,  name: "Firozabad" },
    { id: 9,  name: "Gautam Buddha Nagar" },
    { id: 9,  name: "Ghaziabad" },
    { id: 21, name: "Ghazipur" },
    { id: 21, name: "Gonda" },
    { id: 21, name: "Gorakhpur" },
    { id: 9,  name: "Hamirpur" },
    { id: 21, name: "Hapur" },
    { id: 9,  name: "Hardoi" },
    { id: 21, name: "Hathras" },
    { id: 21, name: "Jalaun" },
    { id: 21, name: "Jaunpur" },
    { id: 9,  name: "Jhansi" },
    { id: 21, name: "Kannauj" },
    { id: 9,  name: "Kanpur Dehat" },
    { id: 9,  name: "Kanpur Nagar" },
    { id: 21, name: "Kasganj" },
    { id: 21, name: "Kaushambi" },
    { id: 21, name: "Kushinagar" },
    { id: 9,  name: "Lakhimpur Kheri" },
    { id: 21, name: "Lalitpur" },
    { id: 9,  name: "Lucknow" },
    { id: 9,  name: "Maharajganj" },
    { id: 9,  name: "Mahoba" },
    { id: 9,  name: "Mainpuri" },
    { id: 9,  name: "Mathura" },
    { id: 9,  name: "Mau" },
    { id: 9,  name: "Meerut" },
    { id: 9,  name: "Mirzapur" },
    { id: 9,  name: "Moradabad" },
    { id: 9,  name: "Muzaffarnagar" },
    { id: 9,  name: "Pilibhit" },
    { id: 9,  name: "Pratapgarh" },
    { id: 21, name: "Prayagraj" },
    { id: 21, name: "Rae Bareli" },
    { id: 9,  name: "Rampur" },
    { id: 9,  name: "Saharanpur" },
    { id: 21, name: "Sambhal" },
    { id: 21, name: "Sant Kabir Nagar" },
    { id: 21, name: "Shahjahanpur" },
    { id: 9,  name: "Shamli" },
    { id: 21, name: "Shravasti" },
    { id: 21, name: "Siddharthnagar" },
    { id: 9,  name: "Sitapur" },
    { id: 21, name: "Sonbhadra" },
    { id: 9,  name: "Sultanpur" },
    { id: 9,  name: "Unnao" },
    { id: 21, name: "Varanasi" },
  ],

  // ── Uttarakhand (13 districts) ────────────────────────────────────────────
  "Uttarakhand": [
    { id: 23, name: "Almora" },
    { id: 23, name: "Bageshwar" },
    { id: 23, name: "Chamoli" },
    { id: 23, name: "Champawat" },
    { id: 23, name: "Dehradun" },
    { id: 23, name: "Haridwar" },
    { id: 23, name: "Nainital" },
    { id: 23, name: "Pauri Garhwal" },
    { id: 23, name: "Pithoragarh" },
    { id: 23, name: "Rudraprayag" },
    { id: 23, name: "Tehri Garhwal" },
    { id: 23, name: "Udham Singh Nagar" },
    { id: 23, name: "Uttarkashi" },
  ],

  // ── West Bengal (23 districts) ────────────────────────────────────────────
  "West Bengal": [
    { id: 6,  name: "Alipurduar" },
    { id: 6,  name: "Bankura" },
    { id: 6,  name: "Birbhum" },
    { id: 6,  name: "Cooch Behar" },
    { id: 6,  name: "Dakshin Dinajpur" },
    { id: 6,  name: "Darjeeling" },
    { id: 6,  name: "Hooghly" },
    { id: 6,  name: "Howrah" },
    { id: 6,  name: "Jalpaiguri" },
    { id: 6,  name: "Jhargram" },
    { id: 6,  name: "Kalimpong" },
    { id: 6,  name: "Kolkata" },
    { id: 6,  name: "Malda" },
    { id: 6,  name: "Murshidabad" },
    { id: 6,  name: "Nadia" },
    { id: 6,  name: "North 24 Parganas" },
    { id: 6,  name: "Paschim Bardhaman" },
    { id: 6,  name: "Paschim Medinipur" },
    { id: 6,  name: "Purba Bardhaman" },
    { id: 6,  name: "Purba Medinipur" },
    { id: 6,  name: "Purulia" },
    { id: 6,  name: "South 24 Parganas" },
    { id: 6,  name: "Uttar Dinajpur" },
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // Union Territories
  // ════════════════════════════════════════════════════════════════════════════

  // ── Andaman & Nicobar Islands (3 districts) ───────────────────────────────
  "Andaman & Nicobar Islands": [
    { id: 25, name: "Nicobar" },
    { id: 25, name: "North & Middle Andaman" },
    { id: 25, name: "South Andaman (Port Blair)" },
  ],

  // ── Chandigarh (1 district) ────────────────────────────────────────────────
  "Chandigarh": [
    { id: 14, name: "Chandigarh" },
  ],

  // ── Dadra & Nagar Haveli and Daman & Diu (3 districts) ───────────────────
  "Dadra & Nagar Haveli and Daman & Diu": [
    { id: 7,  name: "Dadra & Nagar Haveli" },
    { id: 7,  name: "Daman" },
    { id: 7,  name: "Diu" },
  ],

  // ── Delhi (11 districts) ───────────────────────────────────────────────────
  "Delhi": [
    { id: 2,  name: "Central Delhi" },
    { id: 2,  name: "East Delhi" },
    { id: 2,  name: "New Delhi" },
    { id: 2,  name: "North Delhi" },
    { id: 2,  name: "North East Delhi" },
    { id: 2,  name: "North West Delhi" },
    { id: 2,  name: "Shahdara" },
    { id: 2,  name: "South Delhi" },
    { id: 2,  name: "South East Delhi" },
    { id: 2,  name: "South West Delhi" },
    { id: 2,  name: "West Delhi" },
  ],

  // ── Jammu & Kashmir (20 districts) ────────────────────────────────────────
  "Jammu & Kashmir": [
    { id: 24, name: "Anantnag" },
    { id: 24, name: "Bandipora" },
    { id: 24, name: "Baramulla" },
    { id: 24, name: "Budgam" },
    { id: 24, name: "Doda" },
    { id: 24, name: "Ganderbal" },
    { id: 24, name: "Jammu" },
    { id: 24, name: "Kathua" },
    { id: 24, name: "Kishtwar" },
    { id: 24, name: "Kulgam" },
    { id: 24, name: "Kupwara" },
    { id: 24, name: "Poonch" },
    { id: 24, name: "Pulwama" },
    { id: 24, name: "Rajouri" },
    { id: 24, name: "Ramban" },
    { id: 24, name: "Reasi" },
    { id: 24, name: "Samba" },
    { id: 24, name: "Shopian" },
    { id: 24, name: "Srinagar" },
    { id: 24, name: "Udhampur" },
  ],

  // ── Ladakh (2 districts) ──────────────────────────────────────────────────
  "Ladakh": [
    { id: 24, name: "Kargil" },
    { id: 24, name: "Leh" },
  ],

  // ── Lakshadweep (1 district) ──────────────────────────────────────────────
  "Lakshadweep": [
    { id: 19, name: "Lakshadweep (Kavaratti)" },
  ],

  // ── Puducherry (4 districts) ──────────────────────────────────────────────
  "Puducherry": [
    { id: 25, name: "Karaikal" },
    { id: 25, name: "Mahe" },
    { id: 25, name: "Puducherry" },
    { id: 25, name: "Yanam" },
  ],

}; // end INDIA_DISTRICTS

// Flat lookup: district id → name
const DISTRICT_NAMES = {};
Object.values(INDIA_DISTRICTS).forEach(arr => arr.forEach(d => { DISTRICT_NAMES[d.id] = d.name; }));

// Month labels
const MONTH_NAMES = ["","January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

function hourLabel(h) {
  const period  = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ON LOAD
// ═══════════════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
  setupAuth();
  populateStateDropdown();
  checkApiStatus();
  initMap();
  setupNavbar();
  setupHourInput();
  loadMetrics();
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
function setupAuth() {
  const token    = localStorage.getItem("auth_token");
  const username = localStorage.getItem("auth_user");
  const area     = document.getElementById("nav-user-area");
  if (!area) return;

  if (token && username) {
    area.innerHTML = `
      <span class="nav-user-chip">👤 ${username}</span>
      <button class="nav-logout" onclick="logoutUser()">Logout</button>
    `;
  } else {
    area.innerHTML = `<button class="nav-login-btn" onclick="window.location.href='login.html'">Login / Register</button>`;
  }
}

function logoutUser() {
  const token = localStorage.getItem("auth_token");
  if (token) {
    fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { "X-Session-Token": token } })
      .catch(() => {});
  }
  localStorage.clear();
  window.location.href = "login.html";
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════
function setupNavbar() {
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 20);
  });
  document.getElementById("hamburger").addEventListener("click", () => {
    const links = document.querySelector(".nav-links");
    if (links) links.style.display = links.style.display === "flex" ? "none" : "flex";
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE → DISTRICT DROPDOWNS
// ═══════════════════════════════════════════════════════════════════════════════
function populateStateDropdown() {
  const sel = document.getElementById("state-select");
  if (!sel) return;
  const states = Object.keys(INDIA_DISTRICTS).sort();
  states.forEach(state => {
    const opt = document.createElement("option");
    opt.value = state;
    opt.textContent = state;
    sel.appendChild(opt);
  });
}

function onStateChange() {
  const state   = document.getElementById("state-select").value;
  const distSel = document.getElementById("district");

  // Reset district dropdown
  distSel.innerHTML = "";

  if (!state) {
    distSel.innerHTML = '<option value="">— Select state first —</option>';
    distSel.disabled  = true;
    return;
  }

  const districts = INDIA_DISTRICTS[state] || [];

  // Placeholder shows how many districts are available
  const placeholder = document.createElement("option");
  placeholder.value       = "";
  placeholder.textContent = `— Select a district (${districts.length}) —`;
  distSel.appendChild(placeholder);

  // Populate every district for the selected state
  districts.forEach(d => {
    const opt       = document.createElement("option");
    opt.value       = d.id;          // backend ID (1-25) used for prediction API
    opt.textContent = d.name;        // real district name shown to user
    distSel.appendChild(opt);
  });

  distSel.disabled = false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOUR INPUT
// ═══════════════════════════════════════════════════════════════════════════════
function setupHourInput() {
  const inp = document.getElementById("hour");
  const lbl = document.getElementById("hour-label");
  if (!inp) return;
  inp.addEventListener("input", () => {
    const v = parseInt(inp.value, 10);
    lbl.textContent = (!isNaN(v) && v >= 0 && v <= 23) ? hourLabel(v) : "—";
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// API STATUS
// ═══════════════════════════════════════════════════════════════════════════════
async function checkApiStatus() {
  const dot  = document.getElementById("api-dot");
  const text = document.getElementById("api-text");
  if (!dot) return;
  dot.className = "dot loading";
  text.textContent = "Connecting to API…";
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      dot.className = "dot online";
      text.textContent = `API Online · Model: ${data.metrics.accuracy}% accuracy`;
    } else throw new Error();
  } catch {
    dot.className = "dot offline";
    text.textContent = "API Offline — start backend (python app.py)";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
function validate() {
  let ok = true;
  const clear = id => { document.getElementById(id).textContent = ""; };
  const err   = (id, msg) => { document.getElementById(id).textContent = msg; ok = false; };

  clear("err-district"); clear("err-month"); clear("err-hour");

  const d = document.getElementById("district").value;
  const m = document.getElementById("month").value;
  const h = document.getElementById("hour").value;

  if (!d)                                    err("err-district", "Please select a district.");
  if (!m)                                    err("err-month",    "Please select a month.");
  if (h === "")                              err("err-hour",     "Please enter an hour.");
  else if (parseInt(h) < 0 || parseInt(h) > 23) err("err-hour", "Hour must be between 0 and 23.");
  return ok;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIGH RISK ALERT
// ═══════════════════════════════════════════════════════════════════════════════
function showHighRiskAlert(show) {
  const el = document.getElementById("high-risk-alert");
  if (!el) return;
  el.classList.toggle("show", show);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION
// ═══════════════════════════════════════════════════════════════════════════════
async function runPrediction() {
  if (!validate()) return;

  const district = parseInt(document.getElementById("district").value, 10);
  const month    = parseInt(document.getElementById("month").value, 10);
  const hour     = parseInt(document.getElementById("hour").value, 10);

  setLoading(true);
  hideAll();
  showHighRiskAlert(false);

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district, month, hour }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server error ${res.status}`);
    }
    const data = await res.json();
    renderResult(data);
    addToHistory(data);
    highlightDistrictOnMap(data);

    // Show high risk alert if needed
    if (data.risk_level === "High") showHighRiskAlert(true);

  } catch (e) {
    renderError(e.message || "Prediction failed. Is the backend running?");
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  const btn     = document.getElementById("predict-btn");
  const label   = document.getElementById("predict-label");
  const spinner = document.getElementById("predict-spinner");
  btn.disabled = on;
  label.textContent = on ? "Predicting…" : "Predict Risk Level";
  spinner.classList.toggle("hidden", !on);
}

function hideAll() {
  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("result-content").classList.add("hidden");
  document.getElementById("error-panel").classList.add("hidden");
  document.getElementById("result-panel").classList.remove("empty-panel");
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER RESULT
// ═══════════════════════════════════════════════════════════════════════════════
function renderResult(data) {
  const rc = document.getElementById("result-content");
  rc.classList.remove("hidden");

  const rl   = data.risk_level;
  const icon = { Low: "✅", Medium: "⚠️", High: "🚨" }[rl] || "🔍";

  const container = document.getElementById("risk-badge-container");
  container.className = `risk-badge-container risk-${rl.toLowerCase()}`;
  document.getElementById("risk-icon").textContent = icon;
  const lbl = document.getElementById("risk-label");
  lbl.textContent = `${rl} Risk`;
  lbl.className   = `risk-label ${rl.toLowerCase()}`;

  // Show district name + state if available
  const distName  = data.district_name  || DISTRICT_NAMES[data.district] || `District ${data.district}`;
  const distState = data.district_state || "";
  document.getElementById("risk-sub").textContent =
    `${distName}${distState ? " · " + distState : ""} · ${data.month} · ${hourLabel(data.hour)}`;

  document.getElementById("res-confidence").textContent = `${data.confidence}%`;
  document.getElementById("res-patrols").textContent    = data.patrols_needed;
  document.getElementById("res-urgency").textContent    = data.urgency;

  // Probability bars
  const bars = document.getElementById("prob-bars");
  bars.innerHTML = "";
  ["High","Medium","Low"].forEach(cls => {
    const pct = (data.probabilities?.[cls] ?? 0).toFixed(1);
    bars.insertAdjacentHTML("beforeend", `
      <div class="prob-bar-row">
        <span class="prob-bar-label">${cls}</span>
        <div class="prob-bar-track">
          <div class="prob-bar-fill ${cls.toLowerCase()}" style="width:${pct}%"></div>
        </div>
        <span class="prob-bar-pct">${pct}%</span>
      </div>
    `);
  });

  document.getElementById("sug-text").textContent = data.suggestion;
}

function renderError(msg) {
  const ep = document.getElementById("error-panel");
  ep.classList.remove("hidden");
  document.getElementById("error-msg").textContent = msg;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════════════
let localHistory = [];

function addToHistory(data) {
  localHistory.unshift(data);
  if (localHistory.length > 50) localHistory.pop();
  renderHistory();
}

function renderHistory() {
  const list  = document.getElementById("history-list");
  const count = document.getElementById("history-count");
  count.textContent = `${localHistory.length} prediction${localHistory.length !== 1 ? "s" : ""}`;

  if (localHistory.length === 0) {
    list.innerHTML = `<div class="empty-history">No predictions yet. Make one above!</div>`;
    return;
  }

  list.innerHTML = localHistory.map(d => {
    const name = d.district_name || DISTRICT_NAMES[d.district] || `District ${d.district}`;
    return `
    <div class="history-item">
      <div class="hi-risk ${d.risk_level}">${d.risk_level}</div>
      <div class="hi-info">
        <strong>${name}</strong> · ${d.month} · ${hourLabel(d.hour)}
      </div>
      <div class="hi-patrols">🚔 ${d.patrols_needed} patrols</div>
      <div class="hi-time">${new Date(d.timestamp).toLocaleTimeString()}</div>
    </div>
  `}).join("");
}

function clearHistory() {
  localHistory = [];
  renderHistory();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL METRICS
// ═══════════════════════════════════════════════════════════════════════════════
async function loadMetrics() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;
    const data = await res.json();
    const m = data.metrics;
    if (!m) return;
    const fmt = v => `${v}%`;
    document.getElementById("m-accuracy").textContent  = fmt(m.accuracy);
    document.getElementById("m-precision").textContent = fmt(m.precision);
    document.getElementById("m-recall").textContent    = fmt(m.recall);
    document.getElementById("m-f1").textContent        = fmt(m.f1_score);
    document.getElementById("stat-accuracy").textContent = fmt(m.accuracy);
    document.getElementById("tb-acc").textContent  = fmt(m.accuracy);
    document.getElementById("tb-prec").textContent = fmt(m.precision);
    document.getElementById("tb-rec").textContent  = fmt(m.recall);
    document.getElementById("tb-f1").textContent   = fmt(m.f1_score);
  } catch { /* silently ignore */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIA MAP — Leaflet.js
// ═══════════════════════════════════════════════════════════════════════════════
let map, markersLayer, heatLayer;
let allDistrictData = [];
let activeFilter    = null;

// India static district coordinates (fallback)
const INDIA_COORDS = {
  1:  [19.0760, 72.8777],  2:  [28.6139, 77.2090],  3:  [12.9716, 77.5946],
  4:  [17.3850, 78.4867],  5:  [13.0827, 80.2707],  6:  [22.5726, 88.3639],
  7:  [23.0225, 72.5714],  8:  [18.5204, 73.8567],  9:  [26.8467, 80.9462],
  10: [25.5941, 85.1376],  11: [21.1458, 79.0882],  12: [15.2993, 74.1240],
  13: [26.9124, 75.7873],  14: [30.7333, 76.7794],  15: [27.1767, 78.0081],
  16: [22.7196, 75.8577],  17: [21.2514, 81.6296],  18: [20.2961, 85.8245],
  19: [8.5241,  76.9366],  20: [11.0168, 76.9558],  21: [25.3176, 82.9739],
  22: [23.2599, 77.4126],  23: [31.1048, 77.1734],  24: [34.0837, 74.7973],
  25: [11.9416, 79.8083],
};

function initMap() {
  // Center on India
  map = L.map("crime-map", {
    center: [20.5937, 78.9629],
    zoom: 5,
    zoomControl: true,
  });

  // Dark tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  loadAllDistricts();
}

async function loadAllDistricts(btn) {
  if (btn) setActiveMapBtn(btn);
  activeFilter = null;

  const hour  = parseInt(document.getElementById("map-hour").value, 10);
  const month = parseInt(document.getElementById("map-month").value, 10);

  const inputs = Array.from({ length: 25 }, (_, i) => ({ district: i + 1, month, hour }));

  try {
    const res = await fetch(`${API_BASE}/batch_predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    allDistrictData = data.results;
    renderMapMarkers(allDistrictData);
    renderHeatLayer(allDistrictData);
  } catch {
    renderMapMarkersStatic();
  }
}

function filterMap(risk, btn) {
  if (btn) setActiveMapBtn(btn);
  activeFilter = risk;
  if (!allDistrictData.length) { loadAllDistricts(); return; }
  renderMapMarkers(allDistrictData.filter(d => d.risk_level === risk));
}

function setActiveMapBtn(btn) {
  document.querySelectorAll(".map-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function onMapHourChange(val) {
  document.getElementById("map-hour-val").textContent = val;
  loadAllDistricts();
}

// Risk styles
const RISK_COLOR  = { High: "#f87171", Medium: "#fbbf24", Low: "#34d399" };
const RISK_RADIUS = { High: 18, Medium: 14, Low: 10 };

function riskCircleOptions(risk) {
  return {
    radius: RISK_RADIUS[risk] || 12,
    fillColor: RISK_COLOR[risk] || "#94a3b8",
    color:     RISK_COLOR[risk] || "#94a3b8",
    weight: 2, opacity: 0.9, fillOpacity: 0.35,
  };
}

function renderMapMarkers(districts) {
  markersLayer.clearLayers();
  districts.forEach(d => {
    if (!d.coordinates) return;
    const { lat, lng } = d.coordinates;
    const name = d.district_name || DISTRICT_NAMES[d.district] || `District ${d.district}`;
    const circle = L.circleMarker([lat, lng], riskCircleOptions(d.risk_level));

    circle.bindPopup(`
      <div class="popup-title">📍 ${name}</div>
      <div class="popup-row"><span class="popup-key">State</span><span class="popup-val">${d.district_state || "—"}</span></div>
      <div class="popup-row"><span class="popup-key">Risk Level</span><span class="popup-val ${d.risk_level}">${d.risk_level}</span></div>
      <div class="popup-row"><span class="popup-key">Confidence</span><span class="popup-val">${d.confidence}%</span></div>
      <div class="popup-row"><span class="popup-key">Patrols</span><span class="popup-val">${d.patrols_needed} units</span></div>
      <div class="popup-row"><span class="popup-key">Hour</span><span class="popup-val">${hourLabel(d.hour)}</span></div>
    `);

    if (d.risk_level === "High") {
      circle.on("add", () => {
        if (circle._path) circle._path.style.animation = "leafletPulse 1.4s ease-in-out infinite";
      });
    }
    markersLayer.addLayer(circle);
  });
}

function renderHeatLayer(districts) {
  if (heatLayer) map.removeLayer(heatLayer);
  const points = districts.map(d => {
    if (!d.coordinates) return null;
    const intensity = { High: 1.0, Medium: 0.55, Low: 0.2 }[d.risk_level] || 0.3;
    return [d.coordinates.lat, d.coordinates.lng, intensity];
  }).filter(Boolean);

  if (typeof L.heatLayer === "function") {
    heatLayer = L.heatLayer(points, {
      radius: 40, blur: 30, maxZoom: 10,
      gradient: { 0.2: "#34d399", 0.55: "#fbbf24", 1.0: "#f87171" },
    }).addTo(map);
  }
}

// Fallback static markers when API is offline
function renderMapMarkersStatic() {
  markersLayer.clearLayers();
  Object.entries(INDIA_COORDS).forEach(([id, [lat, lng]]) => {
    const name = DISTRICT_NAMES[parseInt(id)] || `District ${id}`;
    L.circleMarker([lat, lng], {
      radius: 8, fillColor: "#64748b", color: "#64748b",
      weight: 1, opacity: .6, fillOpacity: .25,
    }).bindPopup(`<div class="popup-title">${name}</div><div style="color:#64748b;font-size:.8rem">Start backend to see predictions</div>`)
      .addTo(markersLayer);
  });
}

function highlightDistrictOnMap(data) {
  if (!data.coordinates) return;
  const { lat, lng } = data.coordinates;
  map.flyTo([lat, lng], 9, { duration: 1.5 });

  const flash = L.circleMarker([lat, lng], {
    ...riskCircleOptions(data.risk_level),
    radius: 30, fillOpacity: 0.6, weight: 3,
  }).addTo(map);

  const name = data.district_name || DISTRICT_NAMES[data.district] || `District ${data.district}`;
  flash.bindPopup(`
    <div class="popup-title">📍 Latest — ${name}</div>
    <div class="popup-row"><span class="popup-key">Risk</span><span class="popup-val ${data.risk_level}">${data.risk_level}</span></div>
    <div class="popup-row"><span class="popup-key">Patrols</span><span class="popup-val">${data.patrols_needed}</span></div>
  `).openPopup();

  setTimeout(() => map.removeLayer(flash), 6000);
}
