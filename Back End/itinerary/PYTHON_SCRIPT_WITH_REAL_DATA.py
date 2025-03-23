import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import math
import sys
import json

class ItineraryGenerator:
    def __init__(self, location_data, distance_data):
        """
        Initialize the itinerary generator with location and distance data
        
        Parameters:
        -----------
        location_data: list of dictionaries
            Each dictionary contains place_id, name, type (list), rating, season
        distance_data: list of dictionaries
            Each dictionary contains place_id_from, place_id_to, distance_km
        """
        self.location_data = location_data
        self.distance_data = distance_data
        self.locations_df = self._preprocess_locations()
        self.distances_df = pd.DataFrame(distance_data)
    
    def _preprocess_locations(self):
        """Convert location data to a DataFrame and preprocess"""
        # Create DataFrame
        df = pd.DataFrame(self.location_data)
        
        # Store the original DataFrame for later use
        self.original_df = df.copy()
        
        # Explode the type column for preference matching
        df = df.explode("type")
        
        return df
    
    def generate_pace_options(self, trip_duration):
        """
        Generate pace options based on trip duration
        
        Parameters:
        -----------
        trip_duration: int
            Number of days for the trip
        
        Returns:
        --------
        dict: Dictionary of pace options with locations per day and distance limits
        """
        return {
            "Fast-Paced": {"locations_per_day": 4, "distance_per_day_km": 500},
            "Balanced": {"locations_per_day": 3, "distance_per_day_km": 300},
            "Relaxing": {"locations_per_day": 2, "distance_per_day_km": 150},
        }
    
    def calculate_min_budget(self, trip_duration, pace, num_travelers=1):
        """
        Calculate minimum budget based on trip duration and pace
        
        Parameters:
        -----------
        trip_duration: int
            Number of days for the trip
        pace: str
            Selected pace (Fast-Paced, Balanced, Relaxing)
        num_travelers: int
            Number of travelers (default: 1)
        
        Returns:
        --------
        float: Minimum budget per person
        """
        paces = self.generate_pace_options(trip_duration)
        base_cost_per_day = 50  # Minimum estimated cost per day per person
        distance_factor = paces[pace]["distance_per_day_km"] * 0.2  # Estimated fuel cost
        
        # Transportation cost is shared among travelers
        transportation_cost = (distance_factor * trip_duration) / num_travelers
        
        # Other costs are per person
        other_costs = base_cost_per_day * trip_duration
        
        return transportation_cost + other_costs
    
    def _is_season_suitable(self, season, trip_start_date, trip_end_date):
        """
        Check if travel dates fall within the suitable season for a location
        
        Parameters:
        -----------
        season: list
            List of suitable seasons for the location
        trip_start_date: datetime
            Start date of the trip
        trip_end_date: datetime
            End date of the trip
            
        Returns:
        --------
        bool: True if the location is suitable for the travel dates, False otherwise
        """
        # Convert dates to month-day format for easier comparison
        start_month = trip_start_date.month
        end_month = trip_end_date.month
        
        # Check if any day in the trip falls within DEC-APR period
        dec_apr_suitable = False
        jun_sep_suitable = False
        
        # DEC-APR covers December (12) through April (4)
        if "DEC-APR" in season:
            if (start_month >= 12 or start_month <= 4) or (end_month >= 12 or end_month <= 4):
                dec_apr_suitable = True
        
        # JUN-SEP covers June (6) through September (9)
        if "JUN-SEP" in season:
            if (start_month >= 6 and start_month <= 9) or (end_month >= 6 and end_month <= 9):
                jun_sep_suitable = True
        
        # If either season matches or both seasons are listed, the location is suitable
        return dec_apr_suitable or jun_sep_suitable
    
    def apply_preferences(self, user_preferences, trip_start_date, trip_end_date):
        """
        Apply user preferences to location data and prioritize locations based on season
        
        Parameters:
        -----------
        user_preferences: dict
            Dictionary mapping location types to preference percentages
        trip_start_date: datetime
            Start date of the trip
        trip_end_date: datetime
            End date of the trip
        
        Returns:
        --------
        DataFrame: DataFrame with preference scores applied
        """
        # Copy the original DataFrame to avoid modifying the original
        df = self.locations_df.copy()
        
        # Map user preferences to location types
        df["preference_score"] = df["type"].map(
            lambda x: user_preferences.get(x, 0)
        )
        
        # Calculate weighted score based on rating and preference
        df["weighted_score"] = df["rating"] * (df["preference_score"] / 100)
        
        # Apply season preference to original dataframe
        original_df = self.original_df.copy()
        original_df["season_suitable"] = original_df.apply(
            lambda row: self._is_season_suitable(row["season"], trip_start_date, trip_end_date),
            axis=1
        )
        
        # Merge season suitability back to preference dataframe
        df = df.merge(
            original_df[["place_id", "season_suitable"]],
            on="place_id",
            how="left"
        )
        
        # Boost score for locations that are in season
        df["weighted_score"] = df.apply(
            lambda row: row["weighted_score"] * 2 if row["season_suitable"] else row["weighted_score"],
            axis=1
        )
        
        return df
    
    def optimize_itinerary(self, 
                           trip_start_date, 
                           trip_end_date, 
                           user_preferences, 
                           pace="Balanced", 
                           mandatory_locations=None, 
                           excluded_locations=None,
                           specific_interests=None,
                           num_travelers=1):
        """
        Generate an optimized itinerary based on user inputs
        
        Parameters:
        -----------
        trip_start_date: datetime
            Start date of the trip
        trip_end_date: datetime
            End date of the trip
        user_preferences: dict
            Dictionary mapping location types to preference percentages
        pace: str
            Selected pace (Fast-Paced, Balanced, Relaxing)
        mandatory_locations: list
            List of location names that must be included
        excluded_locations: list
            List of location names that must be excluded
        specific_interests: list
            List of place_ids that user is specifically interested in
        num_travelers: int
            Number of travelers (default: 1)
            
        Returns:
        --------
        dict: Dictionary containing itinerary details
        """
        # Store the trip start date for later use
        self.trip_start_date = trip_start_date
        
        # Calculate trip duration
        trip_duration = (trip_end_date - trip_start_date).days + 1
        
        # Get pace settings
        paces = self.generate_pace_options(trip_duration)
        selected_pace = paces[pace]
        
        # Calculate minimum budget per person
        min_budget = self.calculate_min_budget(trip_duration, pace, num_travelers)
        
        # Apply user preferences to get weighted scores, now taking into account season
        df_with_preferences = self.apply_preferences(user_preferences, trip_start_date, trip_end_date)
        
        # Handle mandatory and excluded locations
        if mandatory_locations is None:
            mandatory_locations = []
            
        if excluded_locations is None:
            excluded_locations = []
            
        if specific_interests is None:
            specific_interests = []
        
        # Get original dataframe (unexploded) for final selection
        selection_df = self.original_df.copy()
        
        # Remove excluded locations
        selection_df = selection_df[~selection_df["name"].isin(excluded_locations)]
        
        # Identify mandatory locations
        mandatory_df = selection_df[selection_df["name"].isin(mandatory_locations)].copy()
        
        # Remove mandatory locations from main pool to avoid duplicates
        selection_df = selection_df[~selection_df["name"].isin(mandatory_locations)]
        
        # Aggregate preference scores by place_id (since types were exploded)
        aggregated_scores = df_with_preferences.groupby("place_id").agg({
            "weighted_score": "sum"
        }).reset_index()
        
        # Merge aggregated scores back to selection dataframe
        selection_df = selection_df.merge(
            aggregated_scores, on="place_id", how="left"
        ).fillna({"weighted_score": 0})
        
        # Sort by weighted score
        selection_df = selection_df.sort_values(by="weighted_score", ascending=False)
        
        # Prioritize specific interests if provided
        if specific_interests:
            # Boost score for specific interests
            selection_df["weighted_score"] = selection_df.apply(
                lambda row: row["weighted_score"] * 1.5 if row["place_id"] in specific_interests else row["weighted_score"],
                axis=1
            )
            # Re-sort after boosting
            selection_df = selection_df.sort_values(by="weighted_score", ascending=False)
        
        # Calculate max locations based on trip duration and pace
        max_locations = min(
            len(selection_df) + len(mandatory_df),
            trip_duration * selected_pace["locations_per_day"]
        )
        
        # Account for mandatory locations in the total
        remaining_slots = max(0, max_locations - len(mandatory_df))
        
        # Select top locations based on weighted score
        selected_locations = selection_df.head(remaining_slots)
        
        # Combine mandatory and selected locations
        final_locations = pd.concat([mandatory_df, selected_locations])
        
        # Optimize order based on distances to minimize travel time
        optimized_itinerary = self._optimize_route(final_locations, selected_pace["distance_per_day_km"], trip_duration)
        
        # Calculate actual budget based on selected locations
        actual_budget = self._calculate_actual_budget(optimized_itinerary, trip_duration, pace, num_travelers)
        
        return {
            "itinerary": optimized_itinerary,
            "trip_duration": trip_duration,
            "pace": pace,
            "min_budget": min_budget,
            "actual_budget": actual_budget,
            "total_locations": len(optimized_itinerary),
            "num_travelers": num_travelers
        }
    
    def _optimize_route(self, locations, max_distance_per_day, trip_duration):
        """
        Optimize the route to minimize travel distance
        Uses a greedy approach for route optimization
        
        Parameters:
        -----------
        locations: DataFrame
            DataFrame of selected locations
        max_distance_per_day: float
            Maximum distance to travel per day based on pace
        trip_duration: int
            Number of days for the trip
            
        Returns:
        --------
        list: List of ordered location dictionaries with day assignments
        """
        if len(locations) == 0:
            return []
        
        # Convert to list of dictionaries for easier handling
        locations_list = locations.to_dict('records')
        
        # Start with a random location (or first in the list)
        ordered_locations = [locations_list[0]]
        remaining_locations = locations_list[1:]
        
        current_location = ordered_locations[0]
        
        # Calculate total allowed distance for the trip
        total_allowed_distance = max_distance_per_day * trip_duration
        current_total_distance = 0
        
        # Greedy algorithm to find next closest location
        while remaining_locations and current_total_distance < total_allowed_distance:
            current_id = current_location["place_id"]
            
            # Find the closest location
            min_distance = float('inf')
            closest_location = None
            closest_idx = -1
            
            for idx, location in enumerate(remaining_locations):
                next_id = location["place_id"]
                
                # Find distance between current and next location
                distance_row = self.distances_df[
                    ((self.distances_df["place_id_from"] == current_id) & 
                     (self.distances_df["place_id_to"] == next_id)) | 
                    ((self.distances_df["place_id_from"] == next_id) & 
                     (self.distances_df["place_id_to"] == current_id))
                ]
                
                if not distance_row.empty:
                    distance = distance_row.iloc[0]["distance_km"]
                    if distance < min_distance:
                        min_distance = distance
                        closest_location = location
                        closest_idx = idx
            
            # If we found a closest location, add it to the ordered list
            if closest_location is not None:
                current_total_distance += min_distance
                
                # Check if adding this location would exceed the distance limit
                if current_total_distance <= total_allowed_distance:
                    ordered_locations.append(closest_location)
                    remaining_locations.pop(closest_idx)
                    current_location = closest_location
                else:
                    # We've reached the distance limit
                    break
            else:
                # No more locations with known distances
                break
        
        # Assign days to locations based on pace
        result = self._assign_days_to_locations(ordered_locations, trip_duration)
        
        return result
    
    def _assign_days_to_locations(self, locations, trip_duration):
        """
        Assign days to locations based on trip duration
        
        Parameters:
        -----------
        locations: list
            List of location dictionaries
        trip_duration: int
            Number of days for the trip
            
        Returns:
        --------
        list: List of location dictionaries with day assignments
        """
        # If no locations, return empty list
        if not locations:
            return []
        
        # Calculate locations per day (ceiling to ensure all locations are visited)
        locations_per_day = math.ceil(len(locations) / trip_duration)
        
        # Create a copy of locations to add day information
        result = []
        
        for idx, location in enumerate(locations):
            day = idx // locations_per_day + 1
            if day <= trip_duration:
                location_copy = location.copy()
                location_copy["day"] = day
                result.append(location_copy)
        
        return result
    
    def _calculate_actual_budget(self, itinerary, trip_duration, pace, num_travelers=1):
        """
        Calculate actual budget based on selected locations and distances
        
        Parameters:
        -----------
        itinerary: list
            List of location dictionaries in the itinerary
        trip_duration: int
            Number of days for the trip
        pace: str
            Selected pace (Fast-Paced, Balanced, Relaxing)
        num_travelers: int
            Number of travelers (default: 1)
            
        Returns:
        --------
        float: Actual budget per person
        """
        if not itinerary:
            return 0
        
        # Calculate total distance
        total_distance = 0
        for i in range(len(itinerary) - 1):
            current_id = itinerary[i]["place_id"]
            next_id = itinerary[i + 1]["place_id"]
            
            # Find distance between current and next location
            distance_row = self.distances_df[
                ((self.distances_df["place_id_from"] == current_id) & 
                 (self.distances_df["place_id_to"] == next_id)) | 
                ((self.distances_df["place_id_from"] == next_id) & 
                 (self.distances_df["place_id_to"] == current_id))
            ]
            
            if not distance_row.empty:
                total_distance += distance_row.iloc[0]["distance_km"]
        
        # Calculate budget components
        # Transportation cost is shared among travelers
        transportation_cost = (total_distance * 0.2) / num_travelers
        
        # These costs are per person
        accommodation_cost = trip_duration * 50  # Estimated accommodation cost
        food_cost = trip_duration * 30  # Estimated food cost
        activity_cost = len(itinerary) * 10  # Estimated average cost per location
        
        total_budget_per_person = transportation_cost + accommodation_cost + food_cost + activity_cost
        
        # Add buffer based on pace (faster pace = more activities = higher cost)
        paces = {
            "Fast-Paced": 1.2,
            "Balanced": 1.1,
            "Relaxing": 1.0
        }
        
        return total_budget_per_person * paces[pace]

    def _get_distance(self, from_id, to_id):
        """Get distance between two locations"""
        distance_row = self.distances_df[
            ((self.distances_df["place_id_from"] == from_id) & 
             (self.distances_df["place_id_to"] == to_id)) | 
            ((self.distances_df["place_id_from"] == to_id) & 
             (self.distances_df["place_id_to"] == from_id))
        ]
        
        if not distance_row.empty:
            return distance_row.iloc[0]["distance_km"]
        return 0

    def to_json(self, itinerary_result):
        """
        Convert itinerary result to JSON format
        
        Parameters:
        -----------
        itinerary_result: dict
            Dictionary containing itinerary details from optimize_itinerary
            
        Returns:
        --------
        dict: JSON-serializable dictionary of the itinerary
        """
        # Calculate total distance for budget breakdown
        total_distance = 0
        for i in range(len(itinerary_result['itinerary']) - 1):
            current_id = itinerary_result['itinerary'][i]["place_id"]
            next_id = itinerary_result['itinerary'][i+1]["place_id"]
            distance = self._get_distance(current_id, next_id)
            total_distance += distance

        num_travelers = itinerary_result.get('num_travelers', 1)
        
        # Budget breakdown
        transportation_cost = (total_distance * 0.2) / num_travelers
        accommodation_cost = itinerary_result['trip_duration'] * 50
        food_cost = itinerary_result['trip_duration'] * 30
        activity_cost = len(itinerary_result['itinerary']) * 10

        # Prepare JSON output
        result = {
            "trip_duration": itinerary_result['trip_duration'],
            "pace": itinerary_result['pace'],
            "num_travelers": num_travelers,
            "min_budget_per_person": itinerary_result['min_budget'],
            "actual_budget_per_person": itinerary_result['actual_budget'],
            "total_group_budget": itinerary_result['actual_budget'] * num_travelers,
            "total_locations": itinerary_result['total_locations'],
            "itinerary": [
                {
                    "day": loc.get('day', 0),
                    "place_id": loc['place_id'],
                    "name": loc['name'],
                    "types": loc['type'],
                    "rating": loc['rating'],
                    "season": loc['season'],
                    "distance_to_next_km": self._get_distance(
                        loc['place_id'],
                        itinerary_result['itinerary'][i+1]['place_id']
                    ) if i < len(itinerary_result['itinerary']) - 1 else 0
                }
                for i, loc in enumerate(itinerary_result['itinerary'])
            ],
            "budget_breakdown_per_person": {
                "transportation": transportation_cost,
                "accommodation": accommodation_cost,
                "food": food_cost,
                "activities": activity_cost,
                "total": itinerary_result['actual_budget']
            }
        }
        
        return result

# API handler function
def generate_travel_itinerary(location_data, distance_data, params):
    generator = ItineraryGenerator(location_data, distance_data)
    trip_start_date = datetime.strptime(params['start_date'], "%Y-%m-%d")
    trip_end_date = datetime.strptime(params['end_date'], "%Y-%m-%d")
    pace = params.get('pace', 'Balanced')
    mandatory_locations = params.get('mandatory_locations', [])
    excluded_locations = params.get('excluded_locations', [])
    specific_interests = params.get('specific_interests', [])
    num_travelers = params.get('num_travelers', 1)
    
    itinerary_result = generator.optimize_itinerary(
        trip_start_date=trip_start_date,
        trip_end_date=trip_end_date,
        user_preferences=params['preferences'],
        pace=pace,
        mandatory_locations=mandatory_locations,
        excluded_locations=excluded_locations,
        specific_interests=specific_interests,
        num_travelers=num_travelers
    )
    return generator.to_json(itinerary_result)


# Example usage - This is where you store your data and use the API
if __name__ == "__main__":
    # location data
    location_data = [
        {"place_id": 1, "name": "Colombo", "type": ["City"], "rating": 12.80, "season": ["DEC-APR", "JUN-SEP"]},
        {"place_id": 2, "name": "Bentota", "type": ["Beach"], "rating": 13.53,"season": ["DEC-APR"]},
        {"place_id": 3, "name": "Arugam Bay", "type": ["Beach", "Surfing", "Adventure"], "rating": 14.05, "season":["JUN-SEP"]},
        {"place_id": 4, "name": "Anuradhapura", "type": ["Historical", "Cultural"], "rating": 13.77, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 5, "name": "Ella", "type": ["HillCountry"], "rating": 13.96, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 6, "name": "Little Adam's Peak", "type": ["HillCountry", "Adventure"], "rating": 13.75, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 7, "name": "Nine Arch Bridge", "type": ["HillCountry", "Historical"], "rating": 13.47,"season":["DEC-APR","JUN-SEP"]},
        {"place_id": 8, "name": "Ravana Ella Waterfalls", "type": ["HillCountry"], "rating": 13.15,"season":["DEC-APR","JUN-SEP"]},
        {"place_id": 9, "name": "Ravana Zipline", "type": ["Adventure"], "rating": 12.83, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 10, "name": "Galle Fort", "type": ["Historical"], "rating": 14.09, "season":["DEC-APR"]},
        {"place_id": 11, "name": "Hikkaduwa", "type": ["Beach", "Surfing", "Adventure"], "rating": 13.46, "season":["DEC-APR"]},
        {"place_id": 12, "name": "Turtle Beach", "type": ["Beach"], "rating": 13.73, "season":["DEC-APR"]},
        {"place_id": 13, "name": "Horton Plains", "type": ["HillCountry", "Wildlife"], "rating": 13.45, "season":["DEC-APR"]},
        {"place_id": 14, "name": "World's End (Sri Lanka)", "type": ["HillCountry", "Wildlife"], "rating": 13.66, "season":["DEC-APR"]},
        {"place_id": 15, "name": "Kandy", "type": ["City", "Cultural"], "rating": 14.07, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 16, "name": "Ambuluwawa Tower", "type": ["HillCountry"], "rating": 13.13, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 17, "name": "Elephant Orphanage", "type": ["Wildlife"], "rating": 13.47, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 18, "name": "Temple of the Tooth Relic", "type": ["Cultural"], "rating": 13.79, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 19, "name": "Royal Botanical Garden", "type": ["HillCountry"], "rating": 13.17, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 20, "name": "Kitulgala", "type": ["Adventure"], "rating": 13.43, "season":["DEC-APR"]},
        {"place_id": 21, "name": "Mirissa", "type": ["Beach", "Surfing", "Adventure"], "rating": 13.80, "season":["DEC-APR"]},
        {"place_id": 22, "name": "Negombo", "type": ["Beach"], "rating": 13.06, "season":["DEC-APR"]},
        {"place_id": 23, "name": "Nuwara Eliya", "type": ["HillCountry", "City"], "rating": 14.11, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 24, "name": "Damro Tea Factory", "type": ["HillCountry"], "rating": 13.36, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 25, "name": "Gregory Lake", "type": ["HillCountry"], "rating": 13.68, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 26, "name": "Ramboda Falls", "type": ["HillCountry"], "rating": 13.19, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 27, "name": "Tea Plantations", "type": ["HillCountry"], "rating": 13.45, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 28, "name": "Sigiriya", "type": ["Historical", "Adventure"], "rating": 14.13, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 29, "name": "Dambulla", "type": ["Historical", "Cultural"], "rating": 13.81, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 30, "name": "Habarana", "type": ["Wildlife"], "rating": 13.15, "season":["JUN-SEP"]},
        {"place_id": 31, "name": "Kawudulla", "type": ["Wildlife"], "rating": 13.43, "season":["JUN-SEP"]},
        {"place_id": 32, "name": "Pidurangala", "type": ["Adventure"], "rating": 13.77, "season":["DEC-APR","JUN-SEP"]},
        {"place_id": 33, "name": "Minneriya", "type": ["Wildlife"], "rating": 13.36, "season":["JUN-SEP"]},
        {"place_id": 34, "name": "Tangalle", "type": ["Beach"], "rating": 13.08, "season":["DEC-APR"]},
        {"place_id": 35, "name": "Hiriketiya", "type": ["Beach", "Surfing", "Adventure"], "rating": 13.99, "season":["DEC-APR"]},
        {"place_id": 36, "name": "Trincomalee", "type": ["Beach"], "rating": 13.75, "season":["JUN-SEP"]},
        {"place_id": 37, "name": "Marble Bay", "type": ["Beach"], "rating": 13.06, "season":["JUN-SEP"]},
        {"place_id": 38, "name": "Maritime & Naval History Museum", "type": ["Historical"], "rating": 13.34, "season":["JUN-SEP"]},
        {"place_id": 39, "name": "Pasikuda", "type": ["Beach"], "rating": 13.66, "season":["JUN-SEP"]},
        {"place_id": 40, "name": "ThiruKoneshwaram Kovil", "type": ["Cultural"], "rating": 13.13, "season":["JUN-SEP"]},
        {"place_id": 41, "name": "Udawalawa", "type": ["Wildlife"], "rating": 13.45, "season":["JUN-SEP"]},
        {"place_id": 42, "name": "Weligama", "type": ["Beach", "Surfing", "Adventure"], "rating": 13.76, "season":["DEC-APR"]},
        {"place_id": 43, "name": "Yala", "type": ["Wildlife"], "rating": 14.11, "season":["JUN-SEP"]},
        {"place_id": 44, "name": "Adam's Peak", "type": ["HillCountry", "Adventure"], "rating": 13.77, "season":["DEC-APR"]},
    ]
    
    # distance data
    distance_data = [
        {"place_id_from": 1, "place_id_to": 2, "distance_km": 64.5},
        {"place_id_from": 1, "place_id_to": 3, "distance_km": 328},
    ]
    
    if __name__ == "__main__":

        # Check if running as a script with command-line arguments (from Node.js)
        if len(sys.argv) > 1:
            # Parse input from Node.js
            params = json.loads(sys.argv[1])

        result = generate_travel_itinerary(location_data, distance_data, params)
        print(json.dumps(result))