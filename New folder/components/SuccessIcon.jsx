import React from "react";
import { FontAwesome } from "@expo/vector-icons";

const SuccessIcon = ({ size = 100, color = "green" }) => {
  return <FontAwesome name="check-circle" size={size} color={color} />;
};

export default SuccessIcon;