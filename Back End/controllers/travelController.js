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
    Generate a structured travel itinerary in JSON format based on the following input.

    Input JSON:
    ${JSON.stringify(itineraryData, null, 2)}

    The output must strictly follow this JSON structure:

    {
      "title": "Trip Title",
      "trip_summary": {
        "trip_duration": 7,
        "pace": "Balanced",
        "num_travelers": 2,
        "budget_estimate_per_person": 979.06,
        "total_group_budget": 1958.11,
        "total_locations": 21
      },
      "daily_itineraries": [
        {
          "day": 1,
          "description": "Short description of the day's activities",
          "locations": [
            {
              "name": "Location Name",
              "types": "Beach, Surfing, Adventure",
              "rating": 14.05,
              "distance_to_next": "98.0 km"
            }
          ],
          "total_travel_distance": "244.0 km"
        }
      ],
      "budget_breakdown": { (calculate minimal budget plan)
        "transportation": 120.05,
        "accommodation": 350.00,
        "food": 210.00,
        "activities": 210.00,
        "total_per_person": 979.06,
        "total_for_group": 1958.11
      }
    }

    Ensure the response is a valid JSON object, does not contain markdown formatting (like \`\`\`json \`\`\`), and adheres strictly to the structure above.
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
