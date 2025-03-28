const express = require("express");
const router = express.Router();
const { getAccessToken } = require("../controllers/authController");
const { trackDevice } = require("../controllers/trackController");
const {
  registerLuggage,
  getRegisteredLuggage,
  deleteLuggage,
} = require("../controllers/luggageController");
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

router.post("/register-luggage", async (req, res) => {
  const { userId, luggageName, account, imei, password } = req.body;

  if (!luggageName || !account || !imei || !password) {
    return res.status(400).json({ error: "All details are required" });
  }

  try {
    const luggageData = await registerLuggage(
      userId,
      luggageName,
      account,
      imei,
      password
    );
    res
      .status(200)
      .json({ message: "Luggage registered successfully", data: luggageData });
  } catch (error) {
    console.error("Error registering luggage:", error);
    res.status(500).json({ error: "Error registering luggage" });
  }
});

// Fetch Registered Luggage by User ID
router.get("/registered-luggage", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const luggage = await getRegisteredLuggage(userId);
    res.status(200).json({ success: true, luggage });
  } catch (error) {
    console.error("Error fetching registered luggage:", error);
    res.status(500).json({ error: "Error fetching registered luggage" });
  }
});

// Delete Luggage
router.delete("/registered-luggage/:luggageId", async (req, res) => {
  let { luggageId } = req.params;

  try {
    luggageId = BigInt(luggageId);

    const result = await deleteLuggage(luggageId);
    if (result) {
      res.status(200).json({ message: "Luggage deleted successfully" });
    } else {
      res.status(404).json({ error: "Luggage not found" });
    }
  } catch (error) {
    console.error("Error deleting luggage:", error);
    res.status(500).json({ error: "Error deleting luggage" });
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
