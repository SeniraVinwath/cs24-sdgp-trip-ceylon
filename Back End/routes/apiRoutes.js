const express = require("express");
const router = express.Router();
const { getAccessToken } = require("../controllers/authController");
const { trackDevice } = require("../controllers/trackController");
const { registerLuggage } = require("../controllers/luggageController");
const { generateTravelPlan } = require("../controllers/travelController");

router.post("/data", async (req, res) => {
  const { account, imei, password } = req.body;

  if (!account || !password || !imei) {
    return res
      .status(400)
      .json({ message: "account, imei, and password are required" });
  }

  try {
    const accessToken = await getAccessToken(account, password);

    if (accessToken) {
      const trackingData = await trackDevice(accessToken, imei);
      res.json({
        message: "Device tracked successfully!",
        trackingData: trackingData,
      });
    } else {
      res.status(500).json({ message: "Failed to get access token" });
    }
  } catch (error) {
    console.error("Error processing QR code data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/registerLuggage", async (req, res) => {
  const { imei, luggageDetails } = req.body;

  if (!imei || !luggageDetails) {
    return res
      .status(400)
      .json({ error: "IMEI and luggage details are required" });
  }

  try {
    const luggageData = await registerLuggage(imei, luggageDetails);
    res
      .status(200)
      .json({ message: "Luggage registered successfully", data: luggageData });
  } catch (error) {
    res.status(500).json({ error: "Error registering luggage" });
  }
});

router.post("/travelPlanGenerator", async (req, res) => {
  const {
    start_date,
    end_date,
    preferences,
    pace,
    mandatory_locations,
    excluded_locations,
    specific_interests,
    num_travelers,
  } = req.body;

  if (
    !start_date ||
    !end_date ||
    !preferences ||
    !pace ||
    !mandatory_locations ||
    !num_travelers
  ) {
    return res
      .status(400)
      .json({ error: "Missing required fields in request" });
  }

  try {
    const travelPlan = await generateTravelPlan({
      start_date,
      end_date,
      preferences,
      pace,
      mandatory_locations,
      excluded_locations: excluded_locations || [],
      specific_interests: specific_interests || [],
      num_travelers,
    });

    res.status(200).json({
      message: "Travel plan generated successfully",
      data: travelPlan,
    });
  } catch (error) {
    console.error("Error generating travel plan:", error);
    res.status(500).json({ error: "Error generating travel plan" });
  }
});

module.exports = router;