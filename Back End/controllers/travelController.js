const { spawn } = require("child_process");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateTravelPlan = async ({
  start_date,
  end_date,
  preferences,
  pace,
  mandatory_locations,
  excluded_locations = [],
  specific_interests = [],
  num_travelers,
}) => {
  if (
    !start_date ||
    !end_date ||
    !preferences ||
    !pace ||
    !mandatory_locations ||
    !num_travelers
  ) {
    throw new Error("Missing required fields in request");
  }

  const pythonScriptPath = path.join(
    __dirname,
    "../itinerary/PYTHON_SCRIPT_WITH_REAL_DATA.py"
  );
  const requestData = JSON.stringify({
    start_date,
    end_date,
    preferences,
    pace,
    mandatory_locations,
    excluded_locations,
    specific_interests,
    num_travelers,
  });

  const rawItinerary = await new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [pythonScriptPath, requestData]);
    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Python script error: ${errorOutput}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to start Python script: ${err.message}`));
    });
  });

  let itineraryData;
  try {
    itineraryData = JSON.parse(rawItinerary);
  } catch (err) {
    throw new Error(`Error parsing Python output: ${err.message}`);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `
    Take the following travel itinerary JSON and generate a human-readable description.

    Input JSON:
    ${JSON.stringify(itineraryData, null, 2)}

    give JSON output so ican put them in a Sample template like below one

    ==================================================
    DETAILED ITINERARY PLAN
    ==================================================
    Trip Duration: 7 days
    Pace: Balanced
    Number of Travelers: 2
    Budget Estimate Per Person: $979.06
    Total Group Budget: $1958.11
    Total Locations: 21
    ==================================================

    DAY 1: Friday, April 11, 2025
    Description: Kick off your trip on Saturday, April 05, 2025, in Marble Beach, a hotspot for beach fun, surfing, and adventure!
    --------------------------------------------------
    Location 1: Marble Bay - Beach
      Rating: 13.06/15.0
      Distance to next: 98.0 km
    Location 2: Pasikuda - Beach
      Rating: 13.66/15.0
      Distance to next: 146.0 km
    Location 3: Arugam Bay - Beach, Surfing, Adventure
      Rating: 14.05/15.0

    Total travel distance for Day 7: 244.0 km

    ==================================================
    BUDGET BREAKDOWN (PER PERSON)
    ==================================================
    Transportation: $120.05 (shared cost)
    Accommodation: $350.00
    Food: $210.00
    Activities: $210.00
    --------------------------------------------------
    Total Per Person: $979.06
    Total for Group (2 travelers): $1958.11
  `;

  const result = await model.generateContent(prompt);
  const enhancedResponse = result.response.text();


  let enhancedItinerary;
  try {
    
    const jsonText = enhancedResponse.replace(/```json\s*|\s*```/g, "").trim();
    enhancedItinerary = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`Error parsing Gemini response: ${err.message}`);
  }

  
  return enhancedItinerary;
};

module.exports = { generateTravelPlan };
