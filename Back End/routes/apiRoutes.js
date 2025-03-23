const express = require("express");
const router = express.Router();
const { getAccessToken } = require("../controllers/authController");
const { trackDevice } = require("../controllers/trackController");
const { registerLuggage } = require("../controllers/luggageController");
const { supabase } = require("../config/supabaseClient");

router.post("/data", async (req, res) => {
  console.log("req", req.body);
  const { account, imei, password } = req.body;

  if (!account || !password || !imei) {
    return res
      .status(400)
      .json({ message: "accaount imei and password are required" });
  }

  try {
    const accessToken = await getAccessToken(account, password);

    if (accessToken) {
      const trackingData = await trackDevice(accessToken, imei);
      res.json({
        message: "device tracked successfully!",
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
      .json({ message: "luggage registered succesfully", data: luggageData });
  } catch (error) {
    res.status(500).json({ error: "Error registering luggage" });
  }
});

module.exports = router;
