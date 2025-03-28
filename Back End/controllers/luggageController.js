const { supabase } = require("../config/supabaseClient");

async function registerLuggage(userId, luggageName, account, imei, password) {
  const { data, error } = await supabase
    .from("luggages")
    .insert([
      {
        user_id: userId,
        imei: imei,
        luggage_name: luggageName,
        account: account,
        password: password,
      },
    ])
    .select();

  if (error) {
    console.error("Error registering luggage:", error);
    throw new Error("Failed to register luggage: " + error.message);
  }

  return data[0];
}

async function getRegisteredLuggage(userId) {
  const { data, error } = await supabase
    .from("luggages")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching luggage:", error);
    throw new Error("Failed to fetch luggage");
  }

  return data;
}

async function deleteLuggage(luggageId) {
  const { error } = await supabase
    .from("luggages")
    .delete()
    .eq("luggage_id", luggageId);

  if (error) {
    console.error("Error deleting luggage:", error);
    throw new Error("Failed to delete luggage: " + error.message);
  }

  return true;
}

module.exports = { registerLuggage, getRegisteredLuggage, deleteLuggage };
