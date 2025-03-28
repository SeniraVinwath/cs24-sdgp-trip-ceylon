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
        {"place_id_from": 1, "place_id_to": 4, "distance_km": 193},
        {"place_id_from": 1, "place_id_to": 5, "distance_km": 195},
        {"place_id_from": 1, "place_id_to": 6, "distance_km": 196},
        {"place_id_from": 1, "place_id_to": 7, "distance_km": 125},
        {"place_id_from": 1, "place_id_to": 8, "distance_km": 100},
        {"place_id_from": 1, "place_id_to": 9, "distance_km": 100},
        {"place_id_from": 1, "place_id_to": 10, "distance_km": 125},
        {"place_id_from": 1, "place_id_to": 11, "distance_km": 100},
        {"place_id_from": 1, "place_id_to": 12, "distance_km": 100},
        {"place_id_from": 1, "place_id_to": 13, "distance_km": 149},
        {"place_id_from": 1, "place_id_to": 14, "distance_km": 164},
        {"place_id_from": 1, "place_id_to": 15, "distance_km": 115},
        {"place_id_from": 1, "place_id_to": 16, "distance_km": 114},
        {"place_id_from": 1, "place_id_to": 17, "distance_km": 86.7},
        {"place_id_from": 1, "place_id_to": 18, "distance_km": 116},
        {"place_id_from": 1, "place_id_to": 19, "distance_km": 109},
        {"place_id_from": 1, "place_id_to": 20, "distance_km": 87.4},
        {"place_id_from": 1, "place_id_to": 21, "distance_km": 151},
        {"place_id_from": 1, "place_id_to": 22, "distance_km": 35.5},
        {"place_id_from": 1, "place_id_to": 23, "distance_km": 158},
        {"place_id_from": 1, "place_id_to": 24, "distance_km": 160},
        {"place_id_from": 1, "place_id_to": 25, "distance_km": 157},
        {"place_id_from": 1, "place_id_to": 26, "distance_km": 153},
        {"place_id_from": 1, "place_id_to": 27, "distance_km": 155},
        {"place_id_from": 1, "place_id_to": 28, "distance_km": 177},
        {"place_id_from": 1, "place_id_to": 29, "distance_km": 161},
        {"place_id_from": 1, "place_id_to": 30, "distance_km": 170},
        {"place_id_from": 1, "place_id_to": 31, "distance_km": 197},
        {"place_id_from": 1, "place_id_to": 32, "distance_km": 181},
        {"place_id_from": 1, "place_id_to": 33, "distance_km": 207},
        {"place_id_from": 1, "place_id_to": 34, "distance_km": 184},
        {"place_id_from": 1, "place_id_to": 35, "distance_km": 62},
        {"place_id_from": 1, "place_id_to": 36, "distance_km": 255},
        {"place_id_from": 1, "place_id_to": 37, "distance_km": 266},
        {"place_id_from": 1, "place_id_to": 38, "distance_km": 270},
        {"place_id_from": 1, "place_id_to": 39, "distance_km": 285},
        {"place_id_from": 1, "place_id_to": 40, "distance_km": 260},
        {"place_id_from": 1, "place_id_to": 41, "distance_km": 150},
        {"place_id_from": 1, "place_id_to": 42, "distance_km": 144},
        {"place_id_from": 1, "place_id_to": 43, "distance_km": 44.4},
        {"place_id_from": 1, "place_id_to": 44, "distance_km": 130},
        {"place_id_from": 2, "place_id_to": 1, "distance_km": 86},   # Colombo
        {"place_id_from": 2, "place_id_to": 3, "distance_km": 338},  # Arugam Bay
        {"place_id_from": 2, "place_id_to": 4, "distance_km": 257},  # Anuradhapura
        {"place_id_from": 2, "place_id_to": 5, "distance_km": 254},  # Ella
        {"place_id_from": 2, "place_id_to": 6, "distance_km": 196},  # Little Adam’s Peak
        {"place_id_from": 2, "place_id_to": 7, "distance_km": 195},  # Nine Arch Bridge
        {"place_id_from": 2, "place_id_to": 8, "distance_km": 199},  # Ravana Waterfalls
        {"place_id_from": 2, "place_id_to": 9, "distance_km": 195},  # Ravana Zipline
        {"place_id_from": 2, "place_id_to": 10, "distance_km": 55},  # Galle Fort
        {"place_id_from": 2, "place_id_to": 11, "distance_km": 37},  # Hikkaduwa
        {"place_id_from": 2, "place_id_to": 12, "distance_km": 37},  # Turtle Beach
        {"place_id_from": 2, "place_id_to": 13, "distance_km": 173}, # Horton Plains
        {"place_id_from": 2, "place_id_to": 14, "distance_km": 227}, # World’s End
        {"place_id_from": 2, "place_id_to": 15, "distance_km": 180}, # Kandy
        {"place_id_from": 2, "place_id_to": 16, "distance_km": 179}, # Ambuluwawa Tower
        {"place_id_from": 2, "place_id_to": 17, "distance_km": 151}, # Elephant Orphanage
        {"place_id_from": 2, "place_id_to": 18, "distance_km": 178}, # Temple of the Tooth
        {"place_id_from": 2, "place_id_to": 19, "distance_km": 173}, # Royal Botanical Garden
        {"place_id_from": 2, "place_id_to": 20, "distance_km": 144}, # Kitulgala
        {"place_id_from": 2, "place_id_to": 21, "distance_km": 93},  # Mirissa
        {"place_id_from": 2, "place_id_to": 22, "distance_km": 112}, # Negombo
        {"place_id_from": 2, "place_id_to": 23, "distance_km": 215}, # Nuwara Eliya
        {"place_id_from": 2, "place_id_to": 24, "distance_km": 225}, # Damro Tea Factory
        {"place_id_from": 2, "place_id_to": 25, "distance_km": 213}, # Gregory Lake
        {"place_id_from": 2, "place_id_to": 26, "distance_km": 217}, # Ramboda Falls
        {"place_id_from": 2, "place_id_to": 27, "distance_km": 231}, # Tea Plantations
        {"place_id_from": 2, "place_id_to": 28, "distance_km": 232}, # Sigiriya
        {"place_id_from": 2, "place_id_to": 29, "distance_km": 215}, # Dambulla
        {"place_id_from": 2, "place_id_to": 30, "distance_km": 236}, # Habarana
        {"place_id_from": 2, "place_id_to": 31, "distance_km": 272}, # Kawudulla
        {"place_id_from": 2, "place_id_to": 32, "distance_km": 235}, # Pidurangala
        {"place_id_from": 2, "place_id_to": 33, "distance_km": 262}, # Minneriya
        {"place_id_from": 2, "place_id_to": 34, "distance_km": 131}, # Tangalle
        {"place_id_from": 2, "place_id_to": 35, "distance_km": 31},  # Hiriketiya
        {"place_id_from": 2, "place_id_to": 36, "distance_km": 321}, # Trincomalee
        {"place_id_from": 2, "place_id_to": 37, "distance_km": 321}, # Marble Bay
        {"place_id_from": 2, "place_id_to": 38, "distance_km": 324}, # Maritime Museum
        {"place_id_from": 2, "place_id_to": 39, "distance_km": 353}, # Pasikuda
        {"place_id_from": 2, "place_id_to": 40, "distance_km": 326}, # ThiruKoneshwaram Kovil
        {"place_id_from": 2, "place_id_to": 41, "distance_km": 174}, # Udawalawa
        {"place_id_from": 2, "place_id_to": 42, "distance_km": 83},  # Weligama
        {"place_id_from": 2, "place_id_to": 43, "distance_km": 40},  # Yala
        {"place_id_from": 2, "place_id_to": 44, "distance_km": 187}, # Adam’s Peak
        {"place_id_from": 3, "place_id_to": 1, "distance_km": 343},  # Arugam Bay to Colombo
        {"place_id_from": 3, "place_id_to": 2, "distance_km": 334},  # Arugam Bay to Bentota
        {"place_id_from": 3, "place_id_to": 4, "distance_km": 294},  # Arugam Bay to Anuradhapura
        {"place_id_from": 3, "place_id_to": 5, "distance_km": 134},  # Arugam Bay to Ella
        {"place_id_from": 3, "place_id_to": 6, "distance_km": 136},  # Arugam Bay to Little Adam’s Peak
        {"place_id_from": 3, "place_id_to": 7, "distance_km": 138},  # Arugam Bay to Nine Arch Bridge
        {"place_id_from": 3, "place_id_to": 8, "distance_km": 127},  # Arugam Bay to Ravana Waterfalls
        {"place_id_from": 3, "place_id_to": 9, "distance_km": 136},  # Arugam Bay to Ravana Zipline
        {"place_id_from": 3, "place_id_to": 10, "distance_km": 277},  # Arugam Bay to Galle Fort
        {"place_id_from": 3, "place_id_to": 11, "distance_km": 298},  # Arugam Bay to Hikkaduwa
        {"place_id_from": 3, "place_id_to": 12, "distance_km": 300},  # Arugam Bay to Turtle Beach
        {"place_id_from": 3, "place_id_to": 13, "distance_km": 177},  # Arugam Bay to Horton Plains
        {"place_id_from": 3, "place_id_to": 14, "distance_km": 178},  # Arugam Bay to World's End
        {"place_id_from": 3, "place_id_to": 15, "distance_km": 213},  # Arugam Bay to Kandy
        {"place_id_from": 3, "place_id_to": 16, "distance_km": 237},  # Arugam Bay to Ambuluwawa Tower
        {"place_id_from": 3, "place_id_to": 17, "distance_km": 250},  # Arugam Bay to Elephant Orphanage
        {"place_id_from": 3, "place_id_to": 18, "distance_km": 215},  # Arugam Bay to Temple of the Tooth Relic
        {"place_id_from": 3, "place_id_to": 19, "distance_km": 218},  # Arugam Bay to Royal Botanical Garden
        {"place_id_from": 3, "place_id_to": 20, "distance_km": 253},  # Arugam Bay to Kitulgala
        {"place_id_from": 3, "place_id_to": 21, "distance_km": 254},  # Arugam Bay to Mirissa
        {"place_id_from": 3, "place_id_to": 22, "distance_km": 315},  # Arugam Bay to Negombo
        {"place_id_from": 3, "place_id_to": 23, "distance_km": 181},  # Arugam Bay to Nuwara Eliya
        {"place_id_from": 3, "place_id_to": 24, "distance_km": 203},  # Arugam Bay to Damro Tea Factory
        {"place_id_from": 3, "place_id_to": 25, "distance_km": 189},  # Arugam Bay to Gregory Lake
        {"place_id_from": 3, "place_id_to": 26, "distance_km": 210},  # Arugam Bay to Ramboda Falls
        {"place_id_from": 3, "place_id_to": 27, "distance_km": 193},  # Arugam Bay to Tea Plantations
        {"place_id_from": 3, "place_id_to": 28, "distance_km": 240},  # Arugam Bay to Sigiriya
        {"place_id_from": 3, "place_id_to": 29, "distance_km": 232},  # Arugam Bay to Dambulla
        {"place_id_from": 3, "place_id_to": 30, "distance_km": 252},  # Arugam Bay to Habarana
        {"place_id_from": 3, "place_id_to": 31, "distance_km": 237},  # Arugam Bay to Kawudulla
        {"place_id_from": 3, "place_id_to": 32, "distance_km": 243},  # Arugam Bay to Pidurangala
        {"place_id_from": 3, "place_id_to": 33, "distance_km": 229},  # Arugam Bay to Minneriya
        {"place_id_from": 3, "place_id_to": 34, "distance_km": 216},  # Arugam Bay to Tangalle
        {"place_id_from": 3, "place_id_to": 35, "distance_km": 302},  # Arugam Bay to Hiriketiya
        {"place_id_from": 3, "place_id_to": 36, "distance_km": 246},  # Arugam Bay to Trincomalee
        {"place_id_from": 3, "place_id_to": 37, "distance_km": 235},  # Arugam Bay to Marble Bay
        {"place_id_from": 3, "place_id_to": 38, "distance_km": 250},  # Arugam Bay to Maritime & Naval Museum
        {"place_id_from": 3, "place_id_to": 39, "distance_km": 146},  # Arugam Bay to Pasikuda
        {"place_id_from": 3, "place_id_to": 40, "distance_km": 252},  # Arugam Bay to ThiruKoneshwaram Kovil
        {"place_id_from": 3, "place_id_to": 41, "distance_km": 180},  # Arugam Bay to Udawalawa
        {"place_id_from": 3, "place_id_to": 42, "distance_km": 256},  # Arugam Bay to Weligama
        {"place_id_from": 3, "place_id_to": 43, "distance_km": 350},  # Arugam Bay to Yala
        {"place_id_from": 3, "place_id_to": 44, "distance_km": 253},  # Arugam Bay to Adam's Peak
        {"place_id_from": 4, "place_id_to": 1, "distance_km": 194},
        {"place_id_from": 4, "place_id_to": 2, "distance_km": 254},
        {"place_id_from": 4, "place_id_to": 3, "distance_km": 293},
        {"place_id_from": 4, "place_id_to": 5, "distance_km": 228},
        {"place_id_from": 4, "place_id_to": 6, "distance_km": 227},
        {"place_id_from": 4, "place_id_to": 7, "distance_km": 229},
        {"place_id_from": 4, "place_id_to": 8, "distance_km": 233},
        {"place_id_from": 4, "place_id_to": 9, "distance_km": 229},
        {"place_id_from": 4, "place_id_to": 10, "distance_km": 302},
        {"place_id_from": 4, "place_id_to": 11, "distance_km": 290},
        {"place_id_from": 4, "place_id_to": 12, "distance_km": 293},
        {"place_id_from": 4, "place_id_to": 13, "distance_km": 240},
        {"place_id_from": 4, "place_id_to": 14, "distance_km": 187},
        {"place_id_from": 4, "place_id_to": 15, "distance_km": 136},
        {"place_id_from": 4, "place_id_to": 16, "distance_km": 172},
        {"place_id_from": 4, "place_id_to": 17, "distance_km": 136},
        {"place_id_from": 4, "place_id_to": 18, "distance_km": 135},
        {"place_id_from": 4, "place_id_to": 19, "distance_km": 140},
        {"place_id_from": 4, "place_id_to": 20, "distance_km": 196},
        {"place_id_from": 4, "place_id_to": 21, "distance_km": 327},
        {"place_id_from": 4, "place_id_to": 22, "distance_km": 170},
        {"place_id_from": 4, "place_id_to": 23, "distance_km": 220},
        {"place_id_from": 4, "place_id_to": 24, "distance_km": 198},
        {"place_id_from": 4, "place_id_to": 25, "distance_km": 219},
        {"place_id_from": 4, "place_id_to": 26, "distance_km": 190},
        {"place_id_from": 4, "place_id_to": 27, "distance_km": 215},
        {"place_id_from": 4, "place_id_to": 28, "distance_km": 73.2},
        {"place_id_from": 4, "place_id_to": 29, "distance_km": 63.3},
        {"place_id_from": 4, "place_id_to": 30, "distance_km": 58.8},
        {"place_id_from": 4, "place_id_to": 31, "distance_km": 93},
        {"place_id_from": 4, "place_id_to": 32, "distance_km": 70.3},
        {"place_id_from": 4, "place_id_to": 33, "distance_km": 63},
        {"place_id_from": 4, "place_id_to": 34, "distance_km": 343},
        {"place_id_from": 4, "place_id_to": 35, "distance_km": 349},
        {"place_id_from": 4, "place_id_to": 36, "distance_km": 107},
        {"place_id_from": 4, "place_id_to": 37, "distance_km": 119},
        {"place_id_from": 4, "place_id_to": 38, "distance_km": 111},
        {"place_id_from": 4, "place_id_to": 39, "distance_km": 173},
        {"place_id_from": 4, "place_id_to": 40, "distance_km": 113},
        {"place_id_from": 4, "place_id_to": 41, "distance_km": 288},
        {"place_id_from": 4, "place_id_to": 42, "distance_km": 319},
        {"place_id_from": 4, "place_id_to": 43, "distance_km": 262},
        {"place_id_from": 4, "place_id_to": 44, "distance_km": 221},
        {"place_id_from": 5, "place_id_to": 1, "distance_km": 200},
        {"place_id_from": 5, "place_id_to": 2, "distance_km": 252},
        {"place_id_from": 5, "place_id_to": 3, "distance_km": 133},
        {"place_id_from": 5, "place_id_to": 4, "distance_km": 292},
        {"place_id_from": 5, "place_id_to": 6, "distance_km": 4.3},
        {"place_id_from": 5, "place_id_to": 7, "distance_km": 3.2},
        {"place_id_from": 5, "place_id_to": 8, "distance_km": 5.0},
        {"place_id_from": 5, "place_id_to": 9, "distance_km": 4.1},
        {"place_id_from": 5, "place_id_to": 10, "distance_km": 197},
        {"place_id_from": 5, "place_id_to": 11, "distance_km": 219},
        {"place_id_from": 5, "place_id_to": 12, "distance_km": 220},
        {"place_id_from": 5, "place_id_to": 13, "distance_km": 45},
        {"place_id_from": 5, "place_id_to": 14, "distance_km": 115},
        {"place_id_from": 5, "place_id_to": 15, "distance_km": 136},
        {"place_id_from": 5, "place_id_to": 16, "distance_km": 142},
        {"place_id_from": 5, "place_id_to": 17, "distance_km": 121},
        {"place_id_from": 5, "place_id_to": 18, "distance_km": 135},
        {"place_id_from": 5, "place_id_to": 19, "distance_km": 142},
        {"place_id_from": 5, "place_id_to": 20, "distance_km": 127},
        {"place_id_from": 5, "place_id_to": 21, "distance_km": 174},
        {"place_id_from": 5, "place_id_to": 22, "distance_km": 333},
        {"place_id_from": 5, "place_id_to": 23, "distance_km": 56},
        {"place_id_from": 5, "place_id_to": 24, "distance_km": 71},
        {"place_id_from": 5, "place_id_to": 25, "distance_km": 57},
        {"place_id_from": 5, "place_id_to": 26, "distance_km": 94},
        {"place_id_from": 5, "place_id_to": 27, "distance_km": 75},
        {"place_id_from": 5, "place_id_to": 28, "distance_km": 175},
        {"place_id_from": 5, "place_id_to": 29, "distance_km": 166},
        {"place_id_from": 5, "place_id_to": 30, "distance_km": 197},
        {"place_id_from": 5, "place_id_to": 31, "distance_km": 197},
        {"place_id_from": 5, "place_id_to": 32, "distance_km": 178},
        {"place_id_from": 5, "place_id_to": 33, "distance_km": 180},
        {"place_id_from": 5, "place_id_to": 34, "distance_km": 138},
        {"place_id_from": 5, "place_id_to": 35, "distance_km": 155},
        {"place_id_from": 5, "place_id_to": 36, "distance_km": 271},
        {"place_id_from": 5, "place_id_to": 37, "distance_km": 271},
        {"place_id_from": 5, "place_id_to": 38, "distance_km": 275},
        {"place_id_from": 5, "place_id_to": 39, "distance_km": 184},
        {"place_id_from": 5, "place_id_to": 40, "distance_km": 278},
        {"place_id_from": 5, "place_id_to": 41, "distance_km": 100},
        {"place_id_from": 5, "place_id_to": 42, "distance_km": 167},
        {"place_id_from": 5, "place_id_to": 43, "distance_km": 167},
        {"place_id_from": 5, "place_id_to": 44, "distance_km": 126},
        {"place_id_from": 6, "place_id_to": 1, "distance_km": 201},
        {"place_id_from": 6, "place_id_to": 2, "distance_km": 204},
        {"place_id_from": 6, "place_id_to": 3, "distance_km": 137},
        {"place_id_from": 6, "place_id_to": 4, "distance_km": 230},
        {"place_id_from": 6, "place_id_to": 5, "distance_km": 4.3},
        {"place_id_from": 6, "place_id_to": 7, "distance_km": 1.7},
        {"place_id_from": 6, "place_id_to": 8, "distance_km": 8.1},
        {"place_id_from": 6, "place_id_to": 9, "distance_km": 0.21},
        {"place_id_from": 6, "place_id_to": 10, "distance_km": 201},
        {"place_id_from": 6, "place_id_to": 11, "distance_km": 223},
        {"place_id_from": 6, "place_id_to": 12, "distance_km": 224},
        {"place_id_from": 6, "place_id_to": 13, "distance_km": 46},
        {"place_id_from": 6, "place_id_to": 14, "distance_km": 63},
        {"place_id_from": 6, "place_id_to": 15, "distance_km": 136},
        {"place_id_from": 6, "place_id_to": 16, "distance_km": 121},
        {"place_id_from": 6, "place_id_to": 17, "distance_km": 176},
        {"place_id_from": 6, "place_id_to": 18, "distance_km": 139},
        {"place_id_from": 6, "place_id_to": 19, "distance_km": 129},
        {"place_id_from": 6, "place_id_to": 20, "distance_km": 128},
        {"place_id_from": 6, "place_id_to": 21, "distance_km": 178},
        {"place_id_from": 6, "place_id_to": 22, "distance_km": 214},
        {"place_id_from": 6, "place_id_to": 23, "distance_km": 57},
        {"place_id_from": 6, "place_id_to": 24, "distance_km": 72},
        {"place_id_from": 6, "place_id_to": 25, "distance_km": 57},
        {"place_id_from": 6, "place_id_to": 26, "distance_km": 121},
        {"place_id_from": 6, "place_id_to": 27, "distance_km": 76},
        {"place_id_from": 6, "place_id_to": 28, "distance_km": 175},
        {"place_id_from": 6, "place_id_to": 29, "distance_km": 166},
        {"place_id_from": 6, "place_id_to": 30, "distance_km": 187},
        {"place_id_from": 6, "place_id_to": 31, "distance_km": 190},
        {"place_id_from": 6, "place_id_to": 32, "distance_km": 180},
        {"place_id_from": 6, "place_id_to": 33, "distance_km": 181},
        {"place_id_from": 6, "place_id_to": 34, "distance_km": 140},
        {"place_id_from": 6, "place_id_to": 35, "distance_km": 182},
        {"place_id_from": 6, "place_id_to": 36, "distance_km": 272},
        {"place_id_from": 6, "place_id_to": 37, "distance_km": 272},
        {"place_id_from": 6, "place_id_to": 38, "distance_km": 276},
        {"place_id_from": 6, "place_id_to": 39, "distance_km": 180},
        {"place_id_from": 6, "place_id_to": 40, "distance_km": 277},
        {"place_id_from": 6, "place_id_to": 41, "distance_km": 104},
        {"place_id_from": 6, "place_id_to": 42, "distance_km": 180},
        {"place_id_from": 6, "place_id_to": 43, "distance_km": 168},
        {"place_id_from": 6, "place_id_to": 44, "distance_km": 128},
        {"place_id_from": 7, "place_id_to": 1, "distance_km": 200},
        {"place_id_from": 7, "place_id_to": 2, "distance_km": 204},
        {"place_id_from": 7, "place_id_to": 3, "distance_km": 137},
        {"place_id_from": 7, "place_id_to": 4, "distance_km": 230},
        {"place_id_from": 7, "place_id_to": 5, "distance_km": 3.9},
        {"place_id_from": 7, "place_id_to": 6, "distance_km": 2.4},
        {"place_id_from": 7, "place_id_to": 8, "distance_km": 8.4},
        {"place_id_from": 7, "place_id_to": 9, "distance_km": 2.1},
        {"place_id_from": 7, "place_id_to": 10, "distance_km": 201},
        {"place_id_from": 7, "place_id_to": 11, "distance_km": 222},
        {"place_id_from": 7, "place_id_to": 12, "distance_km": 224},
        {"place_id_from": 7, "place_id_to": 13, "distance_km": 95},
        {"place_id_from": 7, "place_id_to": 14, "distance_km": 64},
        {"place_id_from": 7, "place_id_to": 15, "distance_km": 137},
        {"place_id_from": 7, "place_id_to": 16, "distance_km": 121},
        {"place_id_from": 7, "place_id_to": 17, "distance_km": 176},
        {"place_id_from": 7, "place_id_to": 18, "distance_km": 139},
        {"place_id_from": 7, "place_id_to": 19, "distance_km": 129},
        {"place_id_from": 7, "place_id_to": 20, "distance_km": 128},
        {"place_id_from": 7, "place_id_to": 21, "distance_km": 178},
        {"place_id_from": 7, "place_id_to": 22, "distance_km": 214},
        {"place_id_from": 7, "place_id_to": 23, "distance_km": 56},
        {"place_id_from": 7, "place_id_to": 24, "distance_km": 72},
        {"place_id_from": 7, "place_id_to": 25, "distance_km": 58},
        {"place_id_from": 7, "place_id_to": 26, "distance_km": 121},
        {"place_id_from": 7, "place_id_to": 27, "distance_km": 76},
        {"place_id_from": 7, "place_id_to": 28, "distance_km": 176},
        {"place_id_from": 7, "place_id_to": 29, "distance_km": 167},
        {"place_id_from": 7, "place_id_to": 30, "distance_km": 187},
        {"place_id_from": 7, "place_id_to": 31, "distance_km": 190},
        {"place_id_from": 7, "place_id_to": 32, "distance_km": 179},
        {"place_id_from": 7, "place_id_to": 33, "distance_km": 180},
        {"place_id_from": 7, "place_id_to": 34, "distance_km": 140},
        {"place_id_from": 7, "place_id_to": 35, "distance_km": 182},
        {"place_id_from": 7, "place_id_to": 36, "distance_km": 271},
        {"place_id_from": 7, "place_id_to": 37, "distance_km": 283},
        {"place_id_from": 7, "place_id_to": 38, "distance_km": 275},
        {"place_id_from": 7, "place_id_to": 39, "distance_km": 179},
        {"place_id_from": 7, "place_id_to": 40, "distance_km": 277},
        {"place_id_from": 7, "place_id_to": 41, "distance_km": 103},
        {"place_id_from": 7, "place_id_to": 42, "distance_km": 179},
        {"place_id_from": 7, "place_id_to": 43, "distance_km": 167},
        {"place_id_from": 7, "place_id_to": 44, "distance_km": 128},
        {"place_id_from": 8, "place_id_to": 1, "distance_km": 190},
        {"place_id_from": 8, "place_id_to": 2, "distance_km": 221},
        {"place_id_from": 8, "place_id_to": 3, "distance_km": 176},
        {"place_id_from": 8, "place_id_to": 4, "distance_km": 252},
        {"place_id_from": 8, "place_id_to": 5, "distance_km": 48},
        {"place_id_from": 8, "place_id_to": 6, "distance_km": 48},
        {"place_id_from": 8, "place_id_to": 7, "distance_km": 48},
        {"place_id_from": 8, "place_id_to": 9, "distance_km": 48},
        {"place_id_from": 8, "place_id_to": 10, "distance_km": 245},
        {"place_id_from": 8, "place_id_to": 11, "distance_km": 246},
        {"place_id_from": 8, "place_id_to": 12, "distance_km": 247},
        {"place_id_from": 8, "place_id_to": 13, "distance_km": 62},
        {"place_id_from": 8, "place_id_to": 14, "distance_km": 81},
        {"place_id_from": 8, "place_id_to": 15, "distance_km": 119},
        {"place_id_from": 8, "place_id_to": 16, "distance_km": 88},
        {"place_id_from": 8, "place_id_to": 17, "distance_km": 123},
        {"place_id_from": 8, "place_id_to": 18, "distance_km": 127},
        {"place_id_from": 8, "place_id_to": 19, "distance_km": 95},
        {"place_id_from": 8, "place_id_to": 20, "distance_km": 94},
        {"place_id_from": 8, "place_id_to": 21, "distance_km": 222},
        {"place_id_from": 8, "place_id_to": 22, "distance_km": 184},
        {"place_id_from": 8, "place_id_to": 23, "distance_km": 22},
        {"place_id_from": 8, "place_id_to": 24, "distance_km": 38},
        {"place_id_from": 8, "place_id_to": 25, "distance_km": 24},
        {"place_id_from": 8, "place_id_to": 26, "distance_km": 51},
        {"place_id_from": 8, "place_id_to": 27, "distance_km": 42},
        {"place_id_from": 8, "place_id_to": 28, "distance_km": 198},
        {"place_id_from": 8, "place_id_to": 29, "distance_km": 189},
        {"place_id_from": 8, "place_id_to": 30, "distance_km": 210},
        {"place_id_from": 8, "place_id_to": 31, "distance_km": 213},
        {"place_id_from": 8, "place_id_to": 32, "distance_km": 201},
        {"place_id_from": 8, "place_id_to": 33, "distance_km": 203},
        {"place_id_from": 8, "place_id_to": 34, "distance_km": 184},
        {"place_id_from": 8, "place_id_to": 35, "distance_km": 203},
        {"place_id_from": 8, "place_id_to": 36, "distance_km": 294},
        {"place_id_from": 8, "place_id_to": 37, "distance_km": 298},
        {"place_id_from": 8, "place_id_to": 38, "distance_km": 298},
        {"place_id_from": 8, "place_id_to": 39, "distance_km": 207},
        {"place_id_from": 8, "place_id_to": 40, "distance_km": 300},
        {"place_id_from": 8, "place_id_to": 41, "distance_km": 133},
        {"place_id_from": 8, "place_id_to": 42, "distance_km": 223},
        {"place_id_from": 8, "place_id_to": 43, "distance_km": 185},
        {"place_id_from": 8, "place_id_to": 44, "distance_km": 94},
        {"place_id_from": 9, "place_id_to": 1, "distance_km": 200},
        {"place_id_from": 9, "place_id_to": 2, "distance_km": 204},
        {"place_id_from": 9, "place_id_to": 3, "distance_km": 137},
        {"place_id_from": 9, "place_id_to": 4, "distance_km": 230},
        {"place_id_from": 9, "place_id_to": 5, "distance_km": 4.1},
        {"place_id_from": 9, "place_id_to": 6, "distance_km": 0.21},
        {"place_id_from": 9, "place_id_to": 7, "distance_km": 2.1},
        {"place_id_from": 9, "place_id_to": 8, "distance_km": 51},
        {"place_id_from": 9, "place_id_to": 10, "distance_km": 201},
        {"place_id_from": 9, "place_id_to": 11, "distance_km": 222},
        {"place_id_from": 9, "place_id_to": 12, "distance_km": 224},
        {"place_id_from": 9, "place_id_to": 13, "distance_km": 95},
        {"place_id_from": 9, "place_id_to": 14, "distance_km": 64},
        {"place_id_from": 9, "place_id_to": 15, "distance_km": 137},
        {"place_id_from": 9, "place_id_to": 16, "distance_km": 122},
        {"place_id_from": 9, "place_id_to": 17, "distance_km": 179},
        {"place_id_from": 9, "place_id_to": 18, "distance_km": 139},
        {"place_id_from": 9, "place_id_to": 19, "distance_km": 142},
        {"place_id_from": 9, "place_id_to": 20, "distance_km": 128},
        {"place_id_from": 9, "place_id_to": 21, "distance_km": 178},
        {"place_id_from": 9, "place_id_to": 22, "distance_km": 214},
        {"place_id_from": 9, "place_id_to": 23, "distance_km": 56},
        {"place_id_from": 9, "place_id_to": 24, "distance_km": 72},
        {"place_id_from": 9, "place_id_to": 25, "distance_km": 58},
        {"place_id_from": 9, "place_id_to": 26, "distance_km": 85},
        {"place_id_from": 9, "place_id_to": 27, "distance_km": 76},
        {"place_id_from": 9, "place_id_to": 28, "distance_km": 176},
        {"place_id_from": 9, "place_id_to": 29, "distance_km": 167},
        {"place_id_from": 9, "place_id_to": 30, "distance_km": 187},
        {"place_id_from": 9, "place_id_to": 31, "distance_km": 190},
        {"place_id_from": 9, "place_id_to": 32, "distance_km": 179},
        {"place_id_from": 9, "place_id_to": 33, "distance_km": 180},
        {"place_id_from": 9, "place_id_to": 34, "distance_km": 140},
        {"place_id_from": 9, "place_id_to": 35, "distance_km": 185},
        {"place_id_from": 9, "place_id_to": 36, "distance_km": 272},
        {"place_id_from": 9, "place_id_to": 37, "distance_km": 272},
        {"place_id_from": 9, "place_id_to": 38, "distance_km": 275},
        {"place_id_from": 9, "place_id_to": 39, "distance_km": 180},
        {"place_id_from": 9, "place_id_to": 40, "distance_km": 277},
        {"place_id_from": 9, "place_id_to": 41, "distance_km": 104},
        {"place_id_from": 9, "place_id_to": 42, "distance_km": 180},
        {"place_id_from": 9, "place_id_to": 43, "distance_km": 167},
        {"place_id_from": 9, "place_id_to": 44, "distance_km": 128},
        {"place_id_from": 10, "place_id_to": 1, "distance_km": 129},
        {"place_id_from": 10, "place_id_to": 2, "distance_km": 56},
        {"place_id_from": 10, "place_id_to": 3, "distance_km": 283},
        {"place_id_from": 10, "place_id_to": 4, "distance_km": 311},
        {"place_id_from": 10, "place_id_to": 5, "distance_km": 198},
        {"place_id_from": 10, "place_id_to": 6, "distance_km": 202},
        {"place_id_from": 10, "place_id_to": 7, "distance_km": 201},
        {"place_id_from": 10, "place_id_to": 8, "distance_km": 248},
        {"place_id_from": 10, "place_id_to": 9, "distance_km": 202},
        {"place_id_from": 10, "place_id_to": 11, "distance_km": 19},
        {"place_id_from": 10, "place_id_to": 12, "distance_km": 18},
        {"place_id_from": 10, "place_id_to": 13, "distance_km": 238},
        {"place_id_from": 10, "place_id_to": 14, "distance_km": 192},
        {"place_id_from": 10, "place_id_to": 15, "distance_km": 222},
        {"place_id_from": 10, "place_id_to": 16, "distance_km": 216},
        {"place_id_from": 10, "place_id_to": 17, "distance_km": 194},
        {"place_id_from": 10, "place_id_to": 18, "distance_km": 230},
        {"place_id_from": 10, "place_id_to": 19, "distance_km": 216},
        {"place_id_from": 10, "place_id_to": 20, "distance_km": 180},
        {"place_id_from": 10, "place_id_to": 21, "distance_km": 35},
        {"place_id_from": 10, "place_id_to": 22, "distance_km": 155},
        {"place_id_from": 10, "place_id_to": 23, "distance_km": 251},
        {"place_id_from": 10, "place_id_to": 24, "distance_km": 267},
        {"place_id_from": 10, "place_id_to": 25, "distance_km": 252},
        {"place_id_from": 10, "place_id_to": 26, "distance_km": 259},
        {"place_id_from": 10, "place_id_to": 27, "distance_km": 259},
        {"place_id_from": 10, "place_id_to": 28, "distance_km": 274},
        {"place_id_from": 10, "place_id_to": 29, "distance_km": 258},
        {"place_id_from": 10, "place_id_to": 30, "distance_km": 279},
        {"place_id_from": 10, "place_id_to": 31, "distance_km": 307},
        {"place_id_from": 10, "place_id_to": 32, "distance_km": 277},
        {"place_id_from": 10, "place_id_to": 33, "distance_km": 304},
        {"place_id_from": 10, "place_id_to": 34, "distance_km": 76},
        {"place_id_from": 10, "place_id_to": 35, "distance_km": 73},
        {"place_id_from": 10, "place_id_to": 36, "distance_km": 363},
        {"place_id_from": 10, "place_id_to": 37, "distance_km": 368},
        {"place_id_from": 10, "place_id_to": 38, "distance_km": 367},
        {"place_id_from": 10, "place_id_to": 39, "distance_km": 355},
        {"place_id_from": 10, "place_id_to": 40, "distance_km": 369},
        {"place_id_from": 10, "place_id_to": 41, "distance_km": 124},
        {"place_id_from": 10, "place_id_to": 42, "distance_km": 28},
        {"place_id_from": 10, "place_id_to": 43, "distance_km": 88},
        {"place_id_from": 10, "place_id_to": 44, "distance_km": 228},
        {"place_id_from": 11, "place_id_to": 1, "distance_km": 100},  
        {"place_id_from": 11, "place_id_to": 2, "distance_km": 39},  
        {"place_id_from": 11, "place_id_to": 3, "distance_km": 303},
        {"place_id_from": 11, "place_id_to": 4, "distance_km": 300},  
        {"place_id_from": 11, "place_id_to": 5, "distance_km": 219}, 
        {"place_id_from": 11, "place_id_to": 6, "distance_km": 223},  
        {"place_id_from": 11, "place_id_to": 7, "distance_km": 222},  
        {"place_id_from": 11, "place_id_to": 8, "distance_km": 233},  
        {"place_id_from": 11, "place_id_to": 9, "distance_km": 222},  
        {"place_id_from": 11, "place_id_to": 10, "distance_km": 20}, 
        {"place_id_from": 11, "place_id_to": 12, "distance_km": 1.4},
        {"place_id_from": 11, "place_id_to": 13, "distance_km": 225}, 
        {"place_id_from": 11, "place_id_to": 14, "distance_km": 176}, 
        {"place_id_from": 11, "place_id_to": 15, "distance_km": 213}, 
        {"place_id_from": 11, "place_id_to": 16, "distance_km": 200}, 
        {"place_id_from": 11, "place_id_to": 17, "distance_km": 182}, 
        {"place_id_from": 11, "place_id_to": 18, "distance_km": 212}, 
        {"place_id_from": 11, "place_id_to": 19, "distance_km": 205},
        {"place_id_from": 11, "place_id_to": 20, "distance_km": 176},
        {"place_id_from": 11, "place_id_to": 21, "distance_km": 55},  
        {"place_id_from": 11, "place_id_to": 22, "distance_km": 145},
        {"place_id_from": 11, "place_id_to": 23, "distance_km": 236},
        {"place_id_from": 11, "place_id_to": 24, "distance_km": 246}, 
        {"place_id_from": 11, "place_id_to": 25, "distance_km": 234}, 
        {"place_id_from": 11, "place_id_to": 26, "distance_km": 242}, 
        {"place_id_from": 11, "place_id_to": 27, "distance_km": 243},
        {"place_id_from": 11, "place_id_to": 28, "distance_km": 261},
        {"place_id_from": 11, "place_id_to": 29, "distance_km": 245}, 
        {"place_id_from": 11, "place_id_to": 30, "distance_km": 266},
        {"place_id_from": 11, "place_id_to": 31, "distance_km": 294},
        {"place_id_from": 11, "place_id_to": 32, "distance_km": 264}, 
        {"place_id_from": 11, "place_id_to": 33, "distance_km": 291}, 
        {"place_id_from": 11, "place_id_to": 34, "distance_km": 48}, 
        {"place_id_from": 11, "place_id_to": 35, "distance_km": 63}, 
        {"place_id_from": 11, "place_id_to": 36, "distance_km": 350}, 
        {"place_id_from": 11, "place_id_to": 37, "distance_km": 350}, 
        {"place_id_from": 11, "place_id_to": 38, "distance_km": 354},
        {"place_id_from": 11, "place_id_to": 39, "distance_km": 373},
        {"place_id_from": 11, "place_id_to": 40, "distance_km": 356}, 
        {"place_id_from": 11, "place_id_to": 41, "distance_km": 144}, 
        {"place_id_from": 11, "place_id_to": 42, "distance_km": 47},  
        {"place_id_from": 11, "place_id_to": 43, "distance_km": 75},  
        {"place_id_from": 11, "place_id_to": 44, "distance_km": 212}, 
        {"place_id_from": 12, "place_id_to": 1, "distance_km": 100},
        {"place_id_from": 12, "place_id_to": 2, "distance_km": 39},
        {"place_id_from": 12, "place_id_to": 3, "distance_km": 301},
        {"place_id_from": 12, "place_id_to": 4, "distance_km": 293},
        {"place_id_from": 12, "place_id_to": 5, "distance_km": 216},
        {"place_id_from": 12, "place_id_to": 6, "distance_km": 220},
        {"place_id_from": 12, "place_id_to": 7, "distance_km": 220},
        {"place_id_from": 12, "place_id_to": 8, "distance_km": 233},
        {"place_id_from": 12, "place_id_to": 9, "distance_km": 222},
        {"place_id_from": 12, "place_id_to": 10, "distance_km": 20},
        {"place_id_from": 12, "place_id_to": 11, "distance_km": 1.4},
        {"place_id_from": 12, "place_id_to": 13, "distance_km": 226},
        {"place_id_from": 12, "place_id_to": 14, "distance_km": 176},
        {"place_id_from": 12, "place_id_to": 15, "distance_km": 211},
        {"place_id_from": 12, "place_id_to": 16, "distance_km": 200},
        {"place_id_from": 12, "place_id_to": 17, "distance_km": 182},
        {"place_id_from": 12, "place_id_to": 18, "distance_km": 212},
        {"place_id_from": 12, "place_id_to": 19, "distance_km": 205},
        {"place_id_from": 12, "place_id_to": 20, "distance_km": 164},
        {"place_id_from": 12, "place_id_to": 21, "distance_km": 53},
        {"place_id_from": 12, "place_id_to": 22, "distance_km": 146},
        {"place_id_from": 12, "place_id_to": 23, "distance_km": 236},
        {"place_id_from": 12, "place_id_to": 24, "distance_km": 246},
        {"place_id_from": 12, "place_id_to": 25, "distance_km": 234},
        {"place_id_from": 12, "place_id_to": 26, "distance_km": 242},
        {"place_id_from": 12, "place_id_to": 27, "distance_km": 243},
        {"place_id_from": 12, "place_id_to": 28, "distance_km": 261},
        {"place_id_from": 12, "place_id_to": 29, "distance_km": 249},
        {"place_id_from": 12, "place_id_to": 30, "distance_km": 266},
        {"place_id_from": 12, "place_id_to": 31, "distance_km": 294},
        {"place_id_from": 12, "place_id_to": 32, "distance_km": 264},
        {"place_id_from": 12, "place_id_to": 33, "distance_km": 291},
        {"place_id_from": 12, "place_id_to": 34, "distance_km": 98},
        {"place_id_from": 12, "place_id_to": 35, "distance_km": 65},
        {"place_id_from": 12, "place_id_to": 36, "distance_km": 350},
        {"place_id_from": 12, "place_id_to": 37, "distance_km": 350},
        {"place_id_from": 12, "place_id_to": 38, "distance_km": 354},
        {"place_id_from": 12, "place_id_to": 39, "distance_km": 374},
        {"place_id_from": 12, "place_id_to": 40, "distance_km": 356},
        {"place_id_from": 12, "place_id_to": 41, "distance_km": 146},
        {"place_id_from": 12, "place_id_to": 42, "distance_km": 46},
        {"place_id_from": 12, "place_id_to": 43, "distance_km": 75},
        {"place_id_from": 12, "place_id_to": 44, "distance_km": 212},
        {"place_id_from": 13, "place_id_to": 1, "distance_km": 173},
        {"place_id_from": 13, "place_id_to": 2, "distance_km": 182},
        {"place_id_from": 13, "place_id_to": 3, "distance_km": 175},
        {"place_id_from": 13, "place_id_to": 4, "distance_km": 245},
        {"place_id_from": 13, "place_id_to": 5, "distance_km": 45.1},
        {"place_id_from": 13, "place_id_to": 6, "distance_km": 45.8},
        {"place_id_from": 13, "place_id_to": 7, "distance_km": 94.3},
        {"place_id_from": 13, "place_id_to": 8, "distance_km": 56.4},
        {"place_id_from": 13, "place_id_to": 9, "distance_km": 94.5},
        {"place_id_from": 13, "place_id_to": 10, "distance_km": 238},
        {"place_id_from": 13, "place_id_to": 11, "distance_km": 223},
        {"place_id_from": 13, "place_id_to": 12, "distance_km": 224},
        {"place_id_from": 13, "place_id_to": 14, "distance_km": 62.8},
        {"place_id_from": 13, "place_id_to": 15, "distance_km": 96.7},
        {"place_id_from": 13, "place_id_to": 16, "distance_km": 81.9},
        {"place_id_from": 13, "place_id_to": 17, "distance_km": 117},
        {"place_id_from": 13, "place_id_to": 18, "distance_km": 97.3},
        {"place_id_from": 13, "place_id_to": 19, "distance_km": 91.3},
        {"place_id_from": 13, "place_id_to": 20, "distance_km": 61.4},
        {"place_id_from": 13, "place_id_to": 21, "distance_km": 208},
        {"place_id_from": 13, "place_id_to": 22, "distance_km": 150},
        {"place_id_from": 13, "place_id_to": 23, "distance_km": 39.0},
        {"place_id_from": 13, "place_id_to": 24, "distance_km": 49.1},
        {"place_id_from": 13, "place_id_to": 25, "distance_km": 37.3},
        {"place_id_from": 13, "place_id_to": 26, "distance_km": 61.7},
        {"place_id_from": 13, "place_id_to": 27, "distance_km": 55.6},
        {"place_id_from": 13, "place_id_to": 28, "distance_km": 185},
        {"place_id_from": 13, "place_id_to": 29, "distance_km": 168},
        {"place_id_from": 13, "place_id_to": 30, "distance_km": 190},
        {"place_id_from": 13, "place_id_to": 31, "distance_km": 216},
        {"place_id_from": 13, "place_id_to": 32, "distance_km": 188},
        {"place_id_from": 13, "place_id_to": 33, "distance_km": 215},
        {"place_id_from": 13, "place_id_to": 34, "distance_km": 170},
        {"place_id_from": 13, "place_id_to": 35, "distance_km": 167},
        {"place_id_from": 13, "place_id_to": 36, "distance_km": 275},
        {"place_id_from": 13, "place_id_to": 37, "distance_km": 275},
        {"place_id_from": 13, "place_id_to": 38, "distance_km": 278},
        {"place_id_from": 13, "place_id_to": 39, "distance_km": 237},
        {"place_id_from": 13, "place_id_to": 40, "distance_km": 279},
        {"place_id_from": 13, "place_id_to": 41, "distance_km": 121},
        {"place_id_from": 13, "place_id_to": 42, "distance_km": 208},
        {"place_id_from": 13, "place_id_to": 43, "distance_km": 145},
        {"place_id_from": 13, "place_id_to": 44, "distance_km": 53.7},
        {"place_id_from": 14, "place_id_to": 1, "distance_km": 154},  # World's End to Colombo
        {"place_id_from": 14, "place_id_to": 2, "distance_km": 163},  # World's End to Bentota
        {"place_id_from": 14, "place_id_to": 3, "distance_km": 174},  # World's End to Arugam Bay
        {"place_id_from": 14, "place_id_to": 4, "distance_km": 285},  # World's End to Anuradhapura
        {"place_id_from": 14, "place_id_to": 5, "distance_km": 63.1},  # World's End to Ella
        {"place_id_from": 14, "place_id_to": 6, "distance_km": 63.9},  # World's End to Little Adam's Peak
        {"place_id_from": 14, "place_id_to": 7, "distance_km": 63.4},  # World's End to Nine Arch Bridge
        {"place_id_from": 14, "place_id_to": 8, "distance_km": 80.2},  # World's End to Ravana Waterfalls
        {"place_id_from": 14, "place_id_to": 9, "distance_km": 63.6},  # World's End to Ravana Zipline
        {"place_id_from": 14, "place_id_to": 10, "distance_km": 187},  # World's End to Galle Fort
        {"place_id_from": 14, "place_id_to": 11, "distance_km": 185},  # World's End to Hikkaduwa
        {"place_id_from": 14, "place_id_to": 12, "distance_km": 185},  # World's End to Turtle Beach
        {"place_id_from": 14, "place_id_to": 13, "distance_km": 41.9},  # World's End to Horton Plains
        {"place_id_from": 14, "place_id_to": 15, "distance_km": 127},  # World's End to Kandy
        {"place_id_from": 14, "place_id_to": 16, "distance_km": 112},  # World's End to Ambuluwawa Tower
        {"place_id_from": 14, "place_id_to": 17, "distance_km": 148},  # World's End to Elephant Orphanage
        {"place_id_from": 14, "place_id_to": 18, "distance_km": 128},  # World's End to Temple of the Tooth Relic
        {"place_id_from": 14, "place_id_to": 19, "distance_km": 122},  # World's End to Royal Botanical Garden
        {"place_id_from": 14, "place_id_to": 20, "distance_km": 91.7},  # World's End to Kitulgala
        {"place_id_from": 14, "place_id_to": 21, "distance_km": 160},  # World's End to Mirissa
        {"place_id_from": 14, "place_id_to": 22, "distance_km": 172},  # World's End to Negombo
        {"place_id_from": 14, "place_id_to": 23, "distance_km": 81.8},  # World's End to Nuwara Eliya
        {"place_id_from": 14, "place_id_to": 24, "distance_km": 97.6},  # World's End to Damro Tea Factory
        {"place_id_from": 14, "place_id_to": 25, "distance_km": 83.5},  # World's End to Gregory Lake
        {"place_id_from": 14, "place_id_to": 26, "distance_km": 110},  # World's End to Ramboda Falls
        {"place_id_from": 14, "place_id_to": 27, "distance_km": 100},  # World's End to Tea Plantations
        {"place_id_from": 14, "place_id_to": 28, "distance_km": 232},  # World's End to Sigiriya
        {"place_id_from": 14, "place_id_to": 29, "distance_km": 222},  # World's End to Dambulla
        {"place_id_from": 14, "place_id_to": 30, "distance_km": 243},  # World's End to Habarana
        {"place_id_from": 14, "place_id_to": 31, "distance_km": 245},  # World's End to Kawudulla
        {"place_id_from": 14, "place_id_to": 32, "distance_km": 237},  # World's End to Pidurangala
        {"place_id_from": 14, "place_id_to": 33, "distance_km": 236},  # World's End to Minneriya
        {"place_id_from": 14, "place_id_to": 34, "distance_km": 124},  # World's End to Tangalle
        {"place_id_from": 14, "place_id_to": 35, "distance_km": 141},  # World's End to Hiriketiya
        {"place_id_from": 14, "place_id_to": 36, "distance_km": 322},  # World's End to Trincomalee
        {"place_id_from": 14, "place_id_to": 37, "distance_km": 330},  # World's End to Marble Bay
        {"place_id_from": 14, "place_id_to": 38, "distance_km": 326},  # World's End to Maritime & Naval History Museum
        {"place_id_from": 14, "place_id_to": 39, "distance_km": 240},  # World's End to Pasikuda
        {"place_id_from": 14, "place_id_to": 40, "distance_km": 327},  # World's End to ThiruKoneshwaram Kovil
        {"place_id_from": 14, "place_id_to": 41, "distance_km": 74.6},  # World's End to Udawalawa
        {"place_id_from": 14, "place_id_to": 42, "distance_km": 161},  # World's End to Weligama
        {"place_id_from": 14, "place_id_to": 43, "distance_km": 126},  # World's End to Yala
        {"place_id_from": 14, "place_id_to": 44, "distance_km": 71.9},  # World's End to Adam's Peak
        {"place_id_from": 15, "place_id_to": 1, "distance_km": 113},    # Kandy to Colombo
        {"place_id_from": 15, "place_id_to": 2, "distance_km": 177},    # Kandy to Bentota
        {"place_id_from": 15, "place_id_to": 3, "distance_km": 214},    # Kandy to Arugam Bay
        {"place_id_from": 15, "place_id_to": 4, "distance_km": 136},    # Kandy to Anuradhapura
        {"place_id_from": 15, "place_id_to": 5, "distance_km": 136},    # Kandy to Ella
        {"place_id_from": 15, "place_id_to": 6, "distance_km": 137},    # Kandy to Little Adam's Peak
        {"place_id_from": 15, "place_id_to": 7, "distance_km": 137},    # Kandy to Nine Arch Bridge
        {"place_id_from": 15, "place_id_to": 8, "distance_km": 93.1},   # Kandy to Ravana Waterfalls
        {"place_id_from": 15, "place_id_to": 9, "distance_km": 137},    # Kandy to Ravana Zipline
        {"place_id_from": 15, "place_id_to": 10, "distance_km": 223},   # Kandy to Galle Fort
        {"place_id_from": 15, "place_id_to": 11, "distance_km": 213},   # Kandy to Hikkaduwa
        {"place_id_from": 15, "place_id_to": 12, "distance_km": 213},   # Kandy to Turtle Beach
        {"place_id_from": 15, "place_id_to": 13, "distance_km": 96.6},  # Kandy to Horton Plains
        {"place_id_from": 15, "place_id_to": 14, "distance_km": 126},   # Kandy to World's End
        {"place_id_from": 15, "place_id_to": 16, "distance_km": 25.5},  # Kandy to Ambuluwawa Tower
        {"place_id_from": 15, "place_id_to": 17, "distance_km": 39.4},  # Kandy to Elephant Orphanage
        {"place_id_from": 15, "place_id_to": 18, "distance_km": 1.3},   # Kandy to Temple of the Tooth Relic
        {"place_id_from": 15, "place_id_to": 19, "distance_km": 5.6},   # Kandy to Royal Botanical Garden
        {"place_id_from": 15, "place_id_to": 20, "distance_km": 60},    # Kandy to Kitulgala
        {"place_id_from": 15, "place_id_to": 21, "distance_km": 244},   # Kandy to Mirissa
        {"place_id_from": 15, "place_id_to": 22, "distance_km": 102},   # Kandy to Negombo
        {"place_id_from": 15, "place_id_to": 23, "distance_km": 75.4},  # Kandy to Nuwara Eliya
        {"place_id_from": 15, "place_id_to": 24, "distance_km": 62.6},  # Kandy to Damro Tea Factory
        {"place_id_from": 15, "place_id_to": 25, "distance_km": 73.7},  # Kandy to Gregory Lake
        {"place_id_from": 15, "place_id_to": 26, "distance_km": 52.9},  # Kandy to Ramboda Falls
        {"place_id_from": 15, "place_id_to": 27, "distance_km": 59.2},  # Kandy to Tea Plantations
        {"place_id_from": 15, "place_id_to": 28, "distance_km": 89.3},  # Kandy to Sigiriya
        {"place_id_from": 15, "place_id_to": 29, "distance_km": 72.6},  # Kandy to Dambulla
        {"place_id_from": 15, "place_id_to": 30, "distance_km": 94},    # Kandy to Habarana
        {"place_id_from": 15, "place_id_to": 31, "distance_km": 120},   # Kandy to Kawudulla
        {"place_id_from": 15, "place_id_to": 32, "distance_km": 92.3},  # Kandy to Pidurangala
        {"place_id_from": 15, "place_id_to": 33, "distance_km": 119},   # Kandy to Minneriya
        {"place_id_from": 15, "place_id_to": 34, "distance_km": 238},   # Kandy to Tangalle
        {"place_id_from": 15, "place_id_to": 35, "distance_km": 151},   # Kandy to Hiriketiya
        {"place_id_from": 15, "place_id_to": 36, "distance_km": 178},   # Kandy to Trincomalee
        {"place_id_from": 15, "place_id_to": 37, "distance_km": 179},   # Kandy to Marble Bay
        {"place_id_from": 15, "place_id_to": 38, "distance_km": 182},   # Kandy to Maritime Museum
        {"place_id_from": 15, "place_id_to": 39, "distance_km": 189},   # Kandy to Pasikuda
        {"place_id_from": 15, "place_id_to": 40, "distance_km": 184},   # Kandy to ThiruKoneshwaram Kovil
        {"place_id_from": 15, "place_id_to": 41, "distance_km": 189},   # Kandy to Udawalawa
        {"place_id_from": 15, "place_id_to": 42, "distance_km": 240},   # Kandy to Weligama
        {"place_id_from": 15, "place_id_to": 43, "distance_km": 183},   # Kandy to Yala
        {"place_id_from": 15, "place_id_to": 44, "distance_km": 86.3},  # Kandy to Adam's Peak
        {"place_id_from": 16, "place_id_to": 1, "distance_km": 114},
        {"place_id_from": 16, "place_id_to": 2, "distance_km": 178},
        {"place_id_from": 16, "place_id_to": 3, "distance_km": 240},
        {"place_id_from": 16, "place_id_to": 4, "distance_km": 161},
        {"place_id_from": 16, "place_id_to": 5, "distance_km": 118},
        {"place_id_from": 16, "place_id_to": 6, "distance_km": 119},
        {"place_id_from": 16, "place_id_to": 7, "distance_km": 118},
        {"place_id_from": 16, "place_id_to": 8, "distance_km": 123},
        {"place_id_from": 16, "place_id_to": 9, "distance_km": 119},
        {"place_id_from": 16, "place_id_to": 10, "distance_km": 221},
        {"place_id_from": 16, "place_id_to": 11, "distance_km": 198},
        {"place_id_from": 16, "place_id_to": 12, "distance_km": 199},
        {"place_id_from": 16, "place_id_to": 13, "distance_km": 83.9},
        {"place_id_from": 16, "place_id_to": 14, "distance_km": 112},
        {"place_id_from": 16, "place_id_to": 15, "distance_km": 25.9},
        {"place_id_from": 16, "place_id_to": 17, "distance_km": 40.1},
        {"place_id_from": 16, "place_id_to": 18, "distance_km": 26.5},
        {"place_id_from": 16, "place_id_to": 19, "distance_km": 20.5},
        {"place_id_from": 16, "place_id_to": 20, "distance_km": 25.6},
        {"place_id_from": 16, "place_id_to": 21, "distance_km": 234},
        {"place_id_from": 16, "place_id_to": 22, "distance_km": 103},
        {"place_id_from": 16, "place_id_to": 23, "distance_km": 62.7},
        {"place_id_from": 16, "place_id_to": 24, "distance_km": 49.9},
        {"place_id_from": 16, "place_id_to": 25, "distance_km": 61.1},
        {"place_id_from": 16, "place_id_to": 26, "distance_km": 40.2},
        {"place_id_from": 16, "place_id_to": 27, "distance_km": 46.6},
        {"place_id_from": 16, "place_id_to": 28, "distance_km": 114},
        {"place_id_from": 16, "place_id_to": 29, "distance_km": 97.6},
        {"place_id_from": 16, "place_id_to": 30, "distance_km": 119},
        {"place_id_from": 16, "place_id_to": 31, "distance_km": 145},
        {"place_id_from": 16, "place_id_to": 32, "distance_km": 117},
        {"place_id_from": 16, "place_id_to": 33, "distance_km": 144},
        {"place_id_from": 16, "place_id_to": 34, "distance_km": 281},
        {"place_id_from": 16, "place_id_to": 35, "distance_km": 142},
        {"place_id_from": 16, "place_id_to": 36, "distance_km": 203},
        {"place_id_from": 16, "place_id_to": 37, "distance_km": 203},
        {"place_id_from": 16, "place_id_to": 38, "distance_km": 207},
        {"place_id_from": 16, "place_id_to": 39, "distance_km": 215},
        {"place_id_from": 16, "place_id_to": 40, "distance_km": 209},
        {"place_id_from": 16, "place_id_to": 41, "distance_km": 179},
        {"place_id_from": 16, "place_id_to": 42, "distance_km": 224},
        {"place_id_from": 16, "place_id_to": 43, "distance_km": 124},
        {"place_id_from": 16, "place_id_to": 44, "distance_km": 71.9},
        {"place_id_from": 17, "place_id_to": 1, "distance_km": 85.9},
        {"place_id_from": 17, "place_id_to": 2, "distance_km": 150},
        {"place_id_from": 17, "place_id_to": 3, "distance_km": 252},
        {"place_id_from": 17, "place_id_to": 4, "distance_km": 136},
        {"place_id_from": 17, "place_id_to": 5, "distance_km": 152},
        {"place_id_from": 17, "place_id_to": 6, "distance_km": 153},
        {"place_id_from": 17, "place_id_to": 7, "distance_km": 152},
        {"place_id_from": 17, "place_id_to": 8, "distance_km": 114},
        {"place_id_from": 17, "place_id_to": 9, "distance_km": 153},
        {"place_id_from": 17, "place_id_to": 10, "distance_km": 194},
        {"place_id_from": 17, "place_id_to": 11, "distance_km": 181},
        {"place_id_from": 17, "place_id_to": 12, "distance_km": 181},
        {"place_id_from": 17, "place_id_to": 13, "distance_km": 118},
        {"place_id_from": 17, "place_id_to": 14, "distance_km": 166},
        {"place_id_from": 17, "place_id_to": 15, "distance_km": 39.3},
        {"place_id_from": 17, "place_id_to": 16, "distance_km": 38.7},
        {"place_id_from": 17, "place_id_to": 18, "distance_km": 39.9},
        {"place_id_from": 17, "place_id_to": 19, "distance_km": 34.4},
        {"place_id_from": 17, "place_id_to": 20, "distance_km": 64.8},
        {"place_id_from": 17, "place_id_to": 21, "distance_km": 217},
        {"place_id_from": 17, "place_id_to": 22, "distance_km": 75.1},
        {"place_id_from": 17, "place_id_to": 23, "distance_km": 96.7},
        {"place_id_from": 17, "place_id_to": 24, "distance_km": 83.9},
        {"place_id_from": 17, "place_id_to": 25, "distance_km": 95.1},
        {"place_id_from": 17, "place_id_to": 26, "distance_km": 75.7},
        {"place_id_from": 17, "place_id_to": 27, "distance_km": 80.6},
        {"place_id_from": 17, "place_id_to": 28, "distance_km": 96.3},
        {"place_id_from": 17, "place_id_to": 29, "distance_km": 79.7},
        {"place_id_from": 17, "place_id_to": 30, "distance_km": 101},
        {"place_id_from": 17, "place_id_to": 31, "distance_km": 127},
        {"place_id_from": 17, "place_id_to": 32, "distance_km": 99.3},
        {"place_id_from": 17, "place_id_to": 33, "distance_km": 126},
        {"place_id_from": 17, "place_id_to": 34, "distance_km": 211},
        {"place_id_from": 17, "place_id_to": 35, "distance_km": 124},
        {"place_id_from": 17, "place_id_to": 36, "distance_km": 185},
        {"place_id_from": 17, "place_id_to": 37, "distance_km": 186},
        {"place_id_from": 17, "place_id_to": 38, "distance_km": 189},
        {"place_id_from": 17, "place_id_to": 39, "distance_km": 216},
        {"place_id_from": 17, "place_id_to": 40, "distance_km": 191},
        {"place_id_from": 17, "place_id_to": 41, "distance_km": 162},
        {"place_id_from": 17, "place_id_to": 42, "distance_km": 207},
        {"place_id_from": 17, "place_id_to": 43, "distance_km": 106},
        {"place_id_from": 17, "place_id_to": 44, "distance_km": 106},
        {"place_id_from": 18, "place_id_to": 1, "distance_km": 114},
        {"place_id_from": 18, "place_id_to": 2, "distance_km": 173},
        {"place_id_from": 18, "place_id_to": 3, "distance_km": 214},
        {"place_id_from": 18, "place_id_to": 4, "distance_km": 136},
        {"place_id_from": 18, "place_id_to": 5, "distance_km": 136},
        {"place_id_from": 18, "place_id_to": 6, "distance_km": 137},
        {"place_id_from": 18, "place_id_to": 7, "distance_km": 134},
        {"place_id_from": 18, "place_id_to": 8, "distance_km": 93.9},
        {"place_id_from": 18, "place_id_to": 9, "distance_km": 136},
        {"place_id_from": 18, "place_id_to": 10, "distance_km": 222},
        {"place_id_from": 18, "place_id_to": 11, "distance_km": 209},
        {"place_id_from": 18, "place_id_to": 12, "distance_km": 209},
        {"place_id_from": 18, "place_id_to": 13, "distance_km": 97.4},
        {"place_id_from": 18, "place_id_to": 14, "distance_km": 158},
        {"place_id_from": 18, "place_id_to": 15, "distance_km": 0.85},
        {"place_id_from": 18, "place_id_to": 16, "distance_km": 26.3},
        {"place_id_from": 18, "place_id_to": 17, "distance_km": 40.1},
        {"place_id_from": 18, "place_id_to": 19, "distance_km": 6.4},
        {"place_id_from": 18, "place_id_to": 20, "distance_km": 60.8},
        {"place_id_from": 18, "place_id_to": 21, "distance_km": 245},
        {"place_id_from": 18, "place_id_to": 22, "distance_km": 103},
        {"place_id_from": 18, "place_id_to": 23, "distance_km": 76.2},
        {"place_id_from": 18, "place_id_to": 24, "distance_km": 63.4},
        {"place_id_from": 18, "place_id_to": 25, "distance_km": 75.3},
        {"place_id_from": 18, "place_id_to": 26, "distance_km": 53.7},
        {"place_id_from": 18, "place_id_to": 27, "distance_km": 60.0},
        {"place_id_from": 18, "place_id_to": 28, "distance_km": 88.8},
        {"place_id_from": 18, "place_id_to": 29, "distance_km": 72.1},
        {"place_id_from": 18, "place_id_to": 30, "distance_km": 93.5},
        {"place_id_from": 18, "place_id_to": 31, "distance_km": 121},
        {"place_id_from": 18, "place_id_to": 32, "distance_km": 91.8},
        {"place_id_from": 18, "place_id_to": 33, "distance_km": 119},
        {"place_id_from": 18, "place_id_to": 34, "distance_km": 239},
        {"place_id_from": 18, "place_id_to": 35, "distance_km": 152},
        {"place_id_from": 18, "place_id_to": 36, "distance_km": 178},
        {"place_id_from": 18, "place_id_to": 37, "distance_km": 178},
        {"place_id_from": 18, "place_id_to": 38, "distance_km": 181},
        {"place_id_from": 18, "place_id_to": 39, "distance_km": 190},
        {"place_id_from": 18, "place_id_to": 40, "distance_km": 183},
        {"place_id_from": 18, "place_id_to": 41, "distance_km": 190},
        {"place_id_from": 18, "place_id_to": 42, "distance_km": 235},
        {"place_id_from": 18, "place_id_to": 43, "distance_km": 131},
        {"place_id_from": 18, "place_id_to": 44, "distance_km": 87.1},
        {"place_id_from": 19, "place_id_to": 1, "distance_km": 108},
        {"place_id_from": 19, "place_id_to": 2, "distance_km": 172},
        {"place_id_from": 19, "place_id_to": 3, "distance_km": 219},
        {"place_id_from": 19, "place_id_to": 4, "distance_km": 140},
        {"place_id_from": 19, "place_id_to": 5, "distance_km": 126},
        {"place_id_from": 19, "place_id_to": 6, "distance_km": 127},
        {"place_id_from": 19, "place_id_to": 7, "distance_km": 126},
        {"place_id_from": 19, "place_id_to": 8, "distance_km": 88.3},
        {"place_id_from": 19, "place_id_to": 9, "distance_km": 126},
        {"place_id_from": 19, "place_id_to": 10, "distance_km": 219},
        {"place_id_from": 19, "place_id_to": 11, "distance_km": 208},
        {"place_id_from": 19, "place_id_to": 12, "distance_km": 208},
        {"place_id_from": 19, "place_id_to": 13, "distance_km": 91.6},
        {"place_id_from": 19, "place_id_to": 14, "distance_km": 153},
        {"place_id_from": 19, "place_id_to": 15, "distance_km": 5.5},
        {"place_id_from": 19, "place_id_to": 16, "distance_km": 20.8},
        {"place_id_from": 19, "place_id_to": 17, "distance_km": 34.6},
        {"place_id_from": 19, "place_id_to": 18, "distance_km": 6.1},
        {"place_id_from": 19, "place_id_to": 20, "distance_km": 55.2},
        {"place_id_from": 19, "place_id_to": 21, "distance_km": 245},
        {"place_id_from": 19, "place_id_to": 22, "distance_km": 97.6},
        {"place_id_from": 19, "place_id_to": 23, "distance_km": 73.6},
        {"place_id_from": 19, "place_id_to": 24, "distance_km": 58.6},
        {"place_id_from": 19, "place_id_to": 25, "distance_km": 69},
        {"place_id_from": 19, "place_id_to": 26, "distance_km": 48.1},
        {"place_id_from": 19, "place_id_to": 27, "distance_km": 54.5},
        {"place_id_from": 19, "place_id_to": 28, "distance_km": 92.9},
        {"place_id_from": 19, "place_id_to": 29, "distance_km": 76.2},
        {"place_id_from": 19, "place_id_to": 30, "distance_km": 97.7},
        {"place_id_from": 19, "place_id_to": 31, "distance_km": 124},
        {"place_id_from": 19, "place_id_to": 32, "distance_km": 95.9},
        {"place_id_from": 19, "place_id_to": 33, "distance_km": 123},
        {"place_id_from": 19, "place_id_to": 34, "distance_km": 233},
        {"place_id_from": 19, "place_id_to": 35, "distance_km": 147},
        {"place_id_from": 19, "place_id_to": 36, "distance_km": 182},
        {"place_id_from": 19, "place_id_to": 37, "distance_km": 182},
        {"place_id_from": 19, "place_id_to": 38, "distance_km": 186},
        {"place_id_from": 19, "place_id_to": 39, "distance_km": 194},
        {"place_id_from": 19, "place_id_to": 40, "distance_km": 187},
        {"place_id_from": 19, "place_id_to": 41, "distance_km": 184},
        {"place_id_from": 19, "place_id_to": 42, "distance_km": 229},
        {"place_id_from": 19, "place_id_to": 43, "distance_km": 188},
        {"place_id_from": 19, "place_id_to": 44, "distance_km": 81.6},
        {"place_id_from": 20, "place_id_to": 1, "distance_km": 87},  # Kitulgala to Colombo
        {"place_id_from": 20, "place_id_to": 2, "distance_km": 131},  # Kitulgala to Bentota
        {"place_id_from": 20, "place_id_to": 3, "distance_km": 247},  # Kitulgala to Arugam Bay
        {"place_id_from": 20, "place_id_to": 4, "distance_km": 197},  # Kitulgala to Anuradhapura
        {"place_id_from": 20, "place_id_to": 5, "distance_km": 125},  # Kitulgala to Ella
        {"place_id_from": 20, "place_id_to": 6, "distance_km": 126},  # Kitulgala to Little Adam’s Peak
        {"place_id_from": 20, "place_id_to": 7, "distance_km": 125},  # Kitulgala to Nine Arch Bridge
        {"place_id_from": 20, "place_id_to": 8, "distance_km": 87.2}, # Kitulgala to Ravana Waterfalls
        {"place_id_from": 20, "place_id_to": 9, "distance_km": 125},  # Kitulgala to Ravana Zipline
        {"place_id_from": 20, "place_id_to": 10, "distance_km": 177}, # Kitulgala to Galle Fort
        {"place_id_from": 20, "place_id_to": 11, "distance_km": 175}, # Kitulgala to Hikkaduwa
        {"place_id_from": 20, "place_id_to": 12, "distance_km": 177}, # Kitulgala to Turtle Beach
        {"place_id_from": 20, "place_id_to": 13, "distance_km": 61.4}, # Kitulgala to Horton Plains
        {"place_id_from": 20, "place_id_to": 14, "distance_km": 91.5}, # Kitulgala to World’s End
        {"place_id_from": 20, "place_id_to": 15, "distance_km": 60.4}, # Kitulgala to Kandy
        {"place_id_from": 20, "place_id_to": 16, "distance_km": 45.5}, # Kitulgala to Ambuluwawa Tower
        {"place_id_from": 20, "place_id_to": 17, "distance_km": 65.9}, # Kitulgala to Elephant Orphanage
        {"place_id_from": 20, "place_id_to": 18, "distance_km": 61.0}, # Kitulgala to Temple of the Tooth Relic
        {"place_id_from": 20, "place_id_to": 19, "distance_km": 54.9}, # Kitulgala to Royal Botanical Garden
        {"place_id_from": 20, "place_id_to": 21, "distance_km": 198}, # Kitulgala to Mirissa
        {"place_id_from": 20, "place_id_to": 22, "distance_km": 88.6}, # Kitulgala to Negombo
        {"place_id_from": 20, "place_id_to": 23, "distance_km": 71.0}, # Kitulgala to Nuwara Eliya
        {"place_id_from": 20, "place_id_to": 24, "distance_km": 76},   # Kitulgala to Damro Tea Factory
        {"place_id_from": 20, "place_id_to": 25, "distance_km": 69.3}, # Kitulgala to Gregory Lake
        {"place_id_from": 20, "place_id_to": 26, "distance_km": 68.8}, # Kitulgala to Ramboda Falls
        {"place_id_from": 20, "place_id_to": 27, "distance_km": 72.6}, # Kitulgala to Tea Plantations
        {"place_id_from": 20, "place_id_to": 28, "distance_km": 156},  # Kitulgala to Sigiriya
        {"place_id_from": 20, "place_id_to": 29, "distance_km": 139},  # Kitulgala to Dambulla
        {"place_id_from": 20, "place_id_to": 30, "distance_km": 160},  # Kitulgala to Habarana
        {"place_id_from": 20, "place_id_to": 31, "distance_km": 194},  # Kitulgala to Kawudulla
        {"place_id_from": 20, "place_id_to": 32, "distance_km": 159},  # Kitulgala to Pidurangala
        {"place_id_from": 20, "place_id_to": 33, "distance_km": 187},  # Kitulgala to Minneriya
        {"place_id_from": 20, "place_id_to": 34, "distance_km": 192},  # Kitulgala to Tangalle
        {"place_id_from": 20, "place_id_to": 35, "distance_km": 108},  # Kitulgala to Hiriketiya
        {"place_id_from": 20, "place_id_to": 36, "distance_km": 252},  # Kitulgala to Trincomalee
        {"place_id_from": 20, "place_id_to": 37, "distance_km": 253},  # Kitulgala to Marble Bay
        {"place_id_from": 20, "place_id_to": 38, "distance_km": 256},  # Kitulgala to Maritime & Naval History Museum
        {"place_id_from": 20, "place_id_to": 39, "distance_km": 249},  # Kitulgala to Pasikuda
        {"place_id_from": 20, "place_id_to": 40, "distance_km": 257},  # Kitulgala to ThiruKoneshwaram Kovil
        {"place_id_from": 20, "place_id_to": 41, "distance_km": 143},  # Kitulgala to Udawalawa
        {"place_id_from": 20, "place_id_to": 42, "distance_km": 187},  # Kitulgala to Weligama
        {"place_id_from": 20, "place_id_to": 43, "distance_km": 83.5},  # Kitulgala to Yala
        {"place_id_from": 20, "place_id_to": 44, "distance_km": 48.0},  # Kitulgala to Adam’s Peak
        {"place_id_from": 21, "place_id_to": 1, "distance_km": 153},
        {"place_id_from": 21, "place_id_to": 2, "distance_km": 91.9},
        {"place_id_from": 21, "place_id_to": 3, "distance_km": 256},
        {"place_id_from": 21, "place_id_to": 4, "distance_km": 336},
        {"place_id_from": 21, "place_id_to": 5, "distance_km": 172},
        {"place_id_from": 21, "place_id_to": 6, "distance_km": 176},
        {"place_id_from": 21, "place_id_to": 7, "distance_km": 176},
        {"place_id_from": 21, "place_id_to": 8, "distance_km": 222},
        {"place_id_from": 21, "place_id_to": 9, "distance_km": 176},
        {"place_id_from": 21, "place_id_to": 10, "distance_km": 35.5},
        {"place_id_from": 21, "place_id_to": 11, "distance_km": 63.2},
        {"place_id_from": 21, "place_id_to": 12, "distance_km": 53},
        {"place_id_from": 21, "place_id_to": 13, "distance_km": 206},
        {"place_id_from": 21, "place_id_to": 14, "distance_km": 160},
        {"place_id_from": 21, "place_id_to": 15, "distance_km": 260},
        {"place_id_from": 21, "place_id_to": 16, "distance_km": 248},
        {"place_id_from": 21, "place_id_to": 17, "distance_km": 218},
        {"place_id_from": 21, "place_id_to": 18, "distance_km": 261},
        {"place_id_from": 21, "place_id_to": 19, "distance_km": 242},
        {"place_id_from": 21, "place_id_to": 20, "distance_km": 210},
        {"place_id_from": 21, "place_id_to": 22, "distance_km": 181},
        {"place_id_from": 21, "place_id_to": 23, "distance_km": 228},
        {"place_id_from": 21, "place_id_to": 24, "distance_km": 243},
        {"place_id_from": 21, "place_id_to": 25, "distance_km": 160},
        {"place_id_from": 21, "place_id_to": 26, "distance_km": 263},
        {"place_id_from": 21, "place_id_to": 27, "distance_km": 251},
        {"place_id_from": 21, "place_id_to": 28, "distance_km": 300},
        {"place_id_from": 21, "place_id_to": 29, "distance_km": 284},
        {"place_id_from": 21, "place_id_to": 30, "distance_km": 305},
        {"place_id_from": 21, "place_id_to": 31, "distance_km": 333},
        {"place_id_from": 21, "place_id_to": 32, "distance_km": 303},
        {"place_id_from": 21, "place_id_to": 33, "distance_km": 330},
        {"place_id_from": 21, "place_id_to": 34, "distance_km": 49.8},
        {"place_id_from": 21, "place_id_to": 35, "distance_km": 99.3},
        {"place_id_from": 21, "place_id_to": 36, "distance_km": 389},
        {"place_id_from": 21, "place_id_to": 37, "distance_km": 389},
        {"place_id_from": 21, "place_id_to": 38, "distance_km": 393},
        {"place_id_from": 21, "place_id_to": 39, "distance_km": 329},
        {"place_id_from": 21, "place_id_to": 40, "distance_km": 395},
        {"place_id_from": 21, "place_id_to": 41, "distance_km": 93.4},
        {"place_id_from": 21, "place_id_to": 42, "distance_km": 8.0},
        {"place_id_from": 21, "place_id_to": 43, "distance_km": 114},
        {"place_id_from": 21, "place_id_to": 44, "distance_km": 260},
        {"place_id_from": 22, "place_id_to": 1, "distance_km": 34.3},  # Negombo to Colombo
        {"place_id_from": 22, "place_id_to": 2, "distance_km": 97.5},  # Negombo to Bentota
        {"place_id_from": 22, "place_id_to": 3, "distance_km": 318},  # Negombo to Arugam Bay
        {"place_id_from": 22, "place_id_to": 4, "distance_km": 167},  # Negombo to Anuradhapura
        {"place_id_from": 22, "place_id_to": 5, "distance_km": 213},  # Negombo to Ella
        {"place_id_from": 22, "place_id_to": 6, "distance_km": 213},  # Negombo to Little Adam’s Peak
        {"place_id_from": 22, "place_id_to": 7, "distance_km": 213},  # Negombo to Nine Arch Bridge
        {"place_id_from": 22, "place_id_to": 8, "distance_km": 175},  # Negombo to Ravana Waterfalls
        {"place_id_from": 22, "place_id_to": 9, "distance_km": 213},  # Negombo to Ravana Zipline
        {"place_id_from": 22, "place_id_to": 10, "distance_km": 151},  # Negombo to Galle Fort
        {"place_id_from": 22, "place_id_to": 11, "distance_km": 133},  # Negombo to Hikkaduwa
        {"place_id_from": 22, "place_id_to": 12, "distance_km": 133},  # Negombo to Turtle Beach
        {"place_id_from": 22, "place_id_to": 13, "distance_km": 177},  # Negombo to Horton Plains
        {"place_id_from": 22, "place_id_to": 14, "distance_km": 172},  # Negombo to World's End
        {"place_id_from": 22, "place_id_to": 15, "distance_km": 104},  # Negombo to Kandy
        {"place_id_from": 22, "place_id_to": 16, "distance_km": 105},  # Negombo to Ambuluwawa Tower
        {"place_id_from": 22, "place_id_to": 17, "distance_km": 75.4},  # Negombo to Elephant Orphanage
        {"place_id_from": 22, "place_id_to": 18, "distance_km": 105},  # Negombo to Temple of the Tooth Relic
        {"place_id_from": 22, "place_id_to": 19, "distance_km": 97.6},  # Negombo to Royal Botanical Garden
        {"place_id_from": 22, "place_id_to": 20, "distance_km": 88.2},  # Negombo to Kitulgala
        {"place_id_from": 22, "place_id_to": 21, "distance_km": 181},  # Negombo to Mirissa
        {"place_id_from": 22, "place_id_to": 23, "distance_km": 159},  # Negombo to Nuwara Eliya
        {"place_id_from": 22, "place_id_to": 24, "distance_km": 149},  # Negombo to Damro Tea Factory
        {"place_id_from": 22, "place_id_to": 25, "distance_km": 158},  # Negombo to Gregory Lake
        {"place_id_from": 22, "place_id_to": 26, "distance_km": 139},  # Negombo to Ramboda Falls
        {"place_id_from": 22, "place_id_to": 27, "distance_km": 145},  # Negombo to Tea Plantations
        {"place_id_from": 22, "place_id_to": 28, "distance_km": 146},  # Negombo to Sigiriya
        {"place_id_from": 22, "place_id_to": 29, "distance_km": 129},  # Negombo to Dambulla
        {"place_id_from": 22, "place_id_to": 30, "distance_km": 150},  # Negombo to Habarana
        {"place_id_from": 22, "place_id_to": 31, "distance_km": 177},  # Negombo to Kawudulla
        {"place_id_from": 22, "place_id_to": 32, "distance_km": 149},  # Negombo to Pidurangala
        {"place_id_from": 22, "place_id_to": 33, "distance_km": 175},  # Negombo to Minneriya
        {"place_id_from": 22, "place_id_to": 34, "distance_km": 215},  # Negombo to Tangalle
        {"place_id_from": 22, "place_id_to": 35, "distance_km": 94},   # Negombo to Hiriketiya
        {"place_id_from": 22, "place_id_to": 36, "distance_km": 234},  # Negombo to Trincomalee
        {"place_id_from": 22, "place_id_to": 37, "distance_km": 236},  # Negombo to Marble Bay
        {"place_id_from": 22, "place_id_to": 38, "distance_km": 240},  # Negombo to Maritime & Naval History Museum
        {"place_id_from": 22, "place_id_to": 39, "distance_km": 265},  # Negombo to Pasikuda
        {"place_id_from": 22, "place_id_to": 40, "distance_km": 240},  # Negombo to ThiruKoneshwaram Kovil
        {"place_id_from": 22, "place_id_to": 41, "distance_km": 168},  # Negombo to Udawalawa
        {"place_id_from": 22, "place_id_to": 42, "distance_km": 174},  # Negombo to Weligama
        {"place_id_from": 22, "place_id_to": 43, "distance_km": 76.4},  # Negombo to Yala
        {"place_id_from": 22, "place_id_to": 44, "distance_km": 136},  # Negombo to Adam's Peak
        {"place_id_from": 23, "place_id_to": 1, "distance_km": 160},  # Nuwara Eliya to Colombo
        {"place_id_from": 23, "place_id_to": 2, "distance_km": 202},  # Nuwara Eliya to Bentota
        {"place_id_from": 23, "place_id_to": 3, "distance_km": 177},  # Nuwara Eliya to Arugam Bay
        {"place_id_from": 23, "place_id_to": 4, "distance_km": 245},  # Nuwara Eliya to Anuradhapura
        {"place_id_from": 23, "place_id_to": 5, "distance_km": 54.5}, # Nuwara Eliya to Ella
        {"place_id_from": 23, "place_id_to": 6, "distance_km": 55.2}, # Nuwara Eliya to Little Adam's Peak
        {"place_id_from": 23, "place_id_to": 7, "distance_km": 55.6}, # Nuwara Eliya to Nine Arch Bridge
        {"place_id_from": 23, "place_id_to": 8, "distance_km": 17.7}, # Nuwara Eliya to Ravana Waterfalls
        {"place_id_from": 23, "place_id_to": 9, "distance_km": 55},   # Nuwara Eliya to Ravana Zipline
        {"place_id_from": 23, "place_id_to": 10, "distance_km": 251}, # Nuwara Eliya to Galle Fort
        {"place_id_from": 23, "place_id_to": 11, "distance_km": 238}, # Nuwara Eliya to Hikkaduwa
        {"place_id_from": 23, "place_id_to": 12, "distance_km": 238}, # Nuwara Eliya to Turtle Beach
        {"place_id_from": 23, "place_id_to": 13, "distance_km": 22.9},# Nuwara Eliya to Horton Plains
        {"place_id_from": 23, "place_id_to": 14, "distance_km": 82.1},# Nuwara Eliya to World's End
        {"place_id_from": 23, "place_id_to": 15, "distance_km": 78.1},# Nuwara Eliya to Kandy
        {"place_id_from": 23, "place_id_to": 16, "distance_km": 65},  # Nuwara Eliya to Ambuluwawa Tower
        {"place_id_from": 23, "place_id_to": 17, "distance_km": 100}, # Nuwara Eliya to Elephant Orphanage
        {"place_id_from": 23, "place_id_to": 18, "distance_km": 79},# Nuwara Eliya to Temple of the Tooth Relic
        {"place_id_from": 23, "place_id_to": 19, "distance_km": 72.7},# Nuwara Eliya to Royal Botanical Garden
        {"place_id_from": 23, "place_id_to": 20, "distance_km": 71.5},# Nuwara Eliya to Kitulgala
        {"place_id_from": 23, "place_id_to": 21, "distance_km": 228}, # Nuwara Eliya to Mirissa
        {"place_id_from": 23, "place_id_to": 22, "distance_km": 160}, # Nuwara Eliya to Negombo
        {"place_id_from": 23, "place_id_to": 24, "distance_km": 15.8},# Nuwara Eliya to Damro Tea Factory
        {"place_id_from": 23, "place_id_to": 25, "distance_km": 1.7}, # Nuwara Eliya to Gregory Lake
        {"place_id_from": 23, "place_id_to": 26, "distance_km": 28.6},# Nuwara Eliya to Ramboda Falls
        {"place_id_from": 23, "place_id_to": 27, "distance_km": 19.8},# Nuwara Eliya to Tea Plantations
        {"place_id_from": 23, "place_id_to": 28, "distance_km": 194}, # Nuwara Eliya to Sigiriya
        {"place_id_from": 23, "place_id_to": 29, "distance_km": 182}, # Nuwara Eliya to Dambulla
        {"place_id_from": 23, "place_id_to": 30, "distance_km": 202}, # Nuwara Eliya to Habarana
        {"place_id_from": 23, "place_id_to": 31, "distance_km": 205}, # Nuwara Eliya to Kawudulla
        {"place_id_from": 23, "place_id_to": 32, "distance_km": 197}, # Nuwara Eliya to Pidurangala
        {"place_id_from": 23, "place_id_to": 33, "distance_km": 195}, # Nuwara Eliya to Minneriya
        {"place_id_from": 23, "place_id_to": 34, "distance_km": 190}, # Nuwara Eliya to Tangalle
        {"place_id_from": 23, "place_id_to": 35, "distance_km": 172}, # Nuwara Eliya to Hiriketiya
        {"place_id_from": 23, "place_id_to": 36, "distance_km": 282}, # Nuwara Eliya to Trincomalee
        {"place_id_from": 23, "place_id_to": 37, "distance_km": 283}, # Nuwara Eliya to Marble Bay
        {"place_id_from": 23, "place_id_to": 38, "distance_km": 259}, # Nuwara Eliya to Maritime & Naval History Museum
        {"place_id_from": 23, "place_id_to": 39, "distance_km": 200}, # Nuwara Eliya to Pasikuda
        {"place_id_from": 23, "place_id_to": 40, "distance_km": 261}, # Nuwara Eliya to ThiruKoneshwaram Kovil
        {"place_id_from": 23, "place_id_to": 41, "distance_km": 134}, # Nuwara Eliya to Udawalawa
        {"place_id_from": 23, "place_id_to": 42, "distance_km": 230}, # Nuwara Eliya to Weligama
        {"place_id_from": 23, "place_id_to": 43, "distance_km": 155}, # Nuwara Eliya to Yala
        {"place_id_from": 23, "place_id_to": 44, "distance_km": 71.5}, # Nuwara Eliya to Adam’s Peak
        {"place_id_from": 24, "place_id_to": 1, "distance_km": 157},  # Damro Tea Factory to Colombo
        {"place_id_from": 24, "place_id_to": 2, "distance_km": 201},  # Damro Tea Factory to Bentota
        {"place_id_from": 24, "place_id_to": 3, "distance_km": 194},  # Damro Tea Factory to Arugam Bay
        {"place_id_from": 24, "place_id_to": 4, "distance_km": 204},  # Damro Tea Factory to Anuradhapura
        {"place_id_from": 24, "place_id_to": 5, "distance_km": 71.6},  # Damro Tea Factory to Ella
        {"place_id_from": 24, "place_id_to": 6, "distance_km": 72.3},  # Damro Tea Factory to Little Adam's Peak
        {"place_id_from": 24, "place_id_to": 7, "distance_km": 71.9},  # Damro Tea Factory to Nine Arch Bridge
        {"place_id_from": 24, "place_id_to": 8, "distance_km": 33.9},  # Damro Tea Factory to Ravana Waterfalls
        {"place_id_from": 24, "place_id_to": 9, "distance_km": 72.1},  # Damro Tea Factory to Ravana Zipline
        {"place_id_from": 24, "place_id_to": 10, "distance_km": 247},  # Damro Tea Factory to Galle Fort
        {"place_id_from": 24, "place_id_to": 11, "distance_km": 237},  # Damro Tea Factory to Hikkaduwa
        {"place_id_from": 24, "place_id_to": 12, "distance_km": 237},  # Damro Tea Factory to Turtle Beach
        {"place_id_from": 24, "place_id_to": 13, "distance_km": 49.7},  # Damro Tea Factory to Horton Plains
        {"place_id_from": 24, "place_id_to": 14, "distance_km": 98.7},  # Damro Tea Factory to World's End
        {"place_id_from": 24, "place_id_to": 15, "distance_km": 60.9},  # Damro Tea Factory to Kandy
        {"place_id_from": 24, "place_id_to": 16, "distance_km": 47.5},  # Damro Tea Factory to Ambuluwawa Tower
        {"place_id_from": 24, "place_id_to": 17, "distance_km": 82.9},  # Damro Tea Factory to Elephant Orphanage
        {"place_id_from": 24, "place_id_to": 18, "distance_km": 61.1},  # Damro Tea Factory to Temple of the Tooth Relic
        {"place_id_from": 24, "place_id_to": 19, "distance_km": 55.5},  # Damro Tea Factory to Royal Botanical Garden
        {"place_id_from": 24, "place_id_to": 20, "distance_km": 70.2},  # Damro Tea Factory to Kitulgala
        {"place_id_from": 24, "place_id_to": 21, "distance_km": 254},  # Damro Tea Factory to Mirissa
        {"place_id_from": 24, "place_id_to": 22, "distance_km": 146},  # Damro Tea Factory to Negombo
        {"place_id_from": 24, "place_id_to": 23, "distance_km": 16.2},  # Damro Tea Factory to Nuwara Eliya
        {"place_id_from": 24, "place_id_to": 25, "distance_km": 14.6},  # Damro Tea Factory to Gregory Lake
        {"place_id_from": 24, "place_id_to": 26, "distance_km": 9.6},   # Damro Tea Factory to Ramboda Falls
        {"place_id_from": 24, "place_id_to": 27, "distance_km": 0.5},   # Damro Tea Factory to Tea Plantations
        {"place_id_from": 24, "place_id_to": 28, "distance_km": 149},  # Damro Tea Factory to Sigiriya
        {"place_id_from": 24, "place_id_to": 29, "distance_km": 132},  # Damro Tea Factory to Dambulla
        {"place_id_from": 24, "place_id_to": 30, "distance_km": 154},  # Damro Tea Factory to Habarana
        {"place_id_from": 24, "place_id_to": 31, "distance_km": 180},  # Damro Tea Factory to Kawudulla
        {"place_id_from": 24, "place_id_to": 32, "distance_km": 152},  # Damro Tea Factory to Pidurangala
        {"place_id_from": 24, "place_id_to": 33, "distance_km": 179},  # Damro Tea Factory to Minneriya
        {"place_id_from": 24, "place_id_to": 34, "distance_km": 210},  # Damro Tea Factory to Tangalle
        {"place_id_from": 24, "place_id_to": 35, "distance_km": 176},  # Damro Tea Factory to Hiriketiya
        {"place_id_from": 24, "place_id_to": 36, "distance_km": 238},  # Damro Tea Factory to Trincomalee
        {"place_id_from": 24, "place_id_to": 37, "distance_km": 239},  # Damro Tea Factory to Marble Bay
        {"place_id_from": 24, "place_id_to": 38, "distance_km": 242},  # Damro Tea Factory to Maritime & Naval History Museum
        {"place_id_from": 24, "place_id_to": 39, "distance_km": 231},  # Damro Tea Factory to Pasikuda
        {"place_id_from": 24, "place_id_to": 40, "distance_km": 241},  # Damro Tea Factory to ThiruKoneshwaram Kovil
        {"place_id_from": 24, "place_id_to": 41, "distance_km": 150},  # Damro Tea Factory to Udawalawa
        {"place_id_from": 24, "place_id_to": 42, "distance_km": 249},  # Damro Tea Factory to Weligama
        {"place_id_from": 24, "place_id_to": 43, "distance_km": 154},  # Damro Tea Factory to Yala
        {"place_id_from": 24, "place_id_to": 44, "distance_km": 81.9},  # Damro Tea Factory to Adam’s Peak
        {"place_id_from": 25, "place_id_to": 1, "distance_km": 155},  # Gregory Lake to Colombo
        {"place_id_from": 25, "place_id_to": 2, "distance_km": 211},  # Gregory Lake to Bentota
        {"place_id_from": 25, "place_id_to": 3, "distance_km": 185},  # Gregory Lake to Arugam Bay
        {"place_id_from": 25, "place_id_to": 4, "distance_km": 248},  # Gregory Lake to Anuradhapura
        {"place_id_from": 25, "place_id_to": 5, "distance_km": 56},   # Gregory Lake to Ella
        {"place_id_from": 25, "place_id_to": 6, "distance_km": 57},   # Gregory Lake to Little Adam’s Peak
        {"place_id_from": 25, "place_id_to": 7, "distance_km": 56},   # Gregory Lake to Nine Arch Bridge
        {"place_id_from": 25, "place_id_to": 8, "distance_km": 61},   # Gregory Lake to Ravana Waterfalls
        {"place_id_from": 25, "place_id_to": 9, "distance_km": 57},   # Gregory Lake to Ravana Zipline
        {"place_id_from": 25, "place_id_to": 10, "distance_km": 253}, # Gregory Lake to Galle Fort
        {"place_id_from": 25, "place_id_to": 11, "distance_km": 274}, # Gregory Lake to Hikkaduwa
        {"place_id_from": 25, "place_id_to": 12, "distance_km": 276}, # Gregory Lake to Turtle Beach
        {"place_id_from": 25, "place_id_to": 13, "distance_km": 25},  # Gregory Lake to Horton Plains
        {"place_id_from": 25, "place_id_to": 14, "distance_km": 134}, # Gregory Lake to World’s End
        {"place_id_from": 25, "place_id_to": 15, "distance_km": 96},  # Gregory Lake to Kandy
        {"place_id_from": 25, "place_id_to": 16, "distance_km": 64},  # Gregory Lake to Ambuluwawa Tower
        {"place_id_from": 25, "place_id_to": 17, "distance_km": 99},  # Gregory Lake to Elephant Orphanage
        {"place_id_from": 25, "place_id_to": 18, "distance_km": 95},  # Gregory Lake to Temple of the Tooth Relic
        {"place_id_from": 25, "place_id_to": 19, "distance_km": 71},  # Gregory Lake to Royal Botanical Garden
        {"place_id_from": 25, "place_id_to": 20, "distance_km": 70},  # Gregory Lake to Kitulgala
        {"place_id_from": 25, "place_id_to": 21, "distance_km": 230}, # Gregory Lake to Mirissa
        {"place_id_from": 25, "place_id_to": 22, "distance_km": 160}, # Gregory Lake to Negombo
        {"place_id_from": 25, "place_id_to": 23, "distance_km": 1.7}, # Gregory Lake to Nuwara Eliya
        {"place_id_from": 25, "place_id_to": 24, "distance_km": 14},  # Gregory Lake to Damro Tea Factory
        {"place_id_from": 25, "place_id_to": 26, "distance_km": 27},  # Gregory Lake to Ramboda Falls
        {"place_id_from": 25, "place_id_to": 27, "distance_km": 20},  # Gregory Lake to Tea Plantations
        {"place_id_from": 25, "place_id_to": 28, "distance_km": 194}, # Gregory Lake to Sigiriya
        {"place_id_from": 25, "place_id_to": 29, "distance_km": 185}, # Gregory Lake to Dambulla
        {"place_id_from": 25, "place_id_to": 30, "distance_km": 206}, # Gregory Lake to Habarana
        {"place_id_from": 25, "place_id_to": 31, "distance_km": 216}, # Gregory Lake to Kawudulla
        {"place_id_from": 25, "place_id_to": 32, "distance_km": 197}, # Gregory Lake to Pidurangala
        {"place_id_from": 25, "place_id_to": 33, "distance_km": 199}, # Gregory Lake to Minneriya
        {"place_id_from": 25, "place_id_to": 34, "distance_km": 192}, # Gregory Lake to Tangalle
        {"place_id_from": 25, "place_id_to": 35, "distance_km": 172}, # Gregory Lake to Hiriketiya
        {"place_id_from": 25, "place_id_to": 36, "distance_km": 290}, # Gregory Lake to Trincomalee
        {"place_id_from": 25, "place_id_to": 37, "distance_km": 290}, # Gregory Lake to Marble Bay
        {"place_id_from": 25, "place_id_to": 38, "distance_km": 294}, # Gregory Lake to Maritime & Naval History Museum
        {"place_id_from": 25, "place_id_to": 39, "distance_km": 203}, # Gregory Lake to Pasikuda
        {"place_id_from": 25, "place_id_to": 40, "distance_km": 295}, # Gregory Lake to ThiruKoneshwaram Kovil
        {"place_id_from": 25, "place_id_to": 41, "distance_km": 139}, # Gregory Lake to Udawalawa
        {"place_id_from": 25, "place_id_to": 42, "distance_km": 232}, # Gregory Lake to Weligama
        {"place_id_from": 25, "place_id_to": 43, "distance_km": 154}, # Gregory Lake to Yala
        {"place_id_from": 25, "place_id_to": 44, "distance_km": 70},  # Gregory Lake to Adam’s Peak
        {"place_id_from": 26, "place_id_to": 1, "distance_km": 157},  # Ramboda Falls to Colombo
        {"place_id_from": 26, "place_id_to": 2, "distance_km": 213},  # Ramboda Falls to Bentota
        {"place_id_from": 26, "place_id_to": 3, "distance_km": 210},  # Ramboda Falls to Arugam Bay
        {"place_id_from": 26, "place_id_to": 4, "distance_km": 188},  # Ramboda Falls to Anuradhapura
        {"place_id_from": 26, "place_id_to": 5, "distance_km": 81},   # Ramboda Falls to Ella
        {"place_id_from": 26, "place_id_to": 6, "distance_km": 82},   # Ramboda Falls to Little Adam's Peak
        {"place_id_from": 26, "place_id_to": 7, "distance_km": 82},   # Ramboda Falls to Nine Arch Bridge
        {"place_id_from": 26, "place_id_to": 8, "distance_km": 86},   # Ramboda Falls to Ravana Waterfalls
        {"place_id_from": 26, "place_id_to": 9, "distance_km": 82},   # Ramboda Falls to Ravana Zipline
        {"place_id_from": 26, "place_id_to": 10, "distance_km": 257}, # Ramboda Falls to Galle Fort
        {"place_id_from": 26, "place_id_to": 11, "distance_km": 247}, # Ramboda Falls to Hikkaduwa
        {"place_id_from": 26, "place_id_to": 12, "distance_km": 249}, # Ramboda Falls to Turtle Beach
        {"place_id_from": 26, "place_id_to": 13, "distance_km": 48},  # Ramboda Falls to Horton Plains
        {"place_id_from": 26, "place_id_to": 14, "distance_km": 102}, # Ramboda Falls to World's End
        {"place_id_from": 26, "place_id_to": 15, "distance_km": 53},  # Ramboda Falls to Kandy
        {"place_id_from": 26, "place_id_to": 16, "distance_km": 43},  # Ramboda Falls to Ambuluwawa Tower
        {"place_id_from": 26, "place_id_to": 17, "distance_km": 76},  # Ramboda Falls to Elephant Orphanage
        {"place_id_from": 26, "place_id_to": 18, "distance_km": 56},  # Ramboda Falls to Temple of the Tooth Relic
        {"place_id_from": 26, "place_id_to": 19, "distance_km": 48},  # Ramboda Falls to Royal Botanical Garden
        {"place_id_from": 26, "place_id_to": 20, "distance_km": 65},  # Ramboda Falls to Kitulgala
        {"place_id_from": 26, "place_id_to": 21, "distance_km": 255}, # Ramboda Falls to Mirissa
        {"place_id_from": 26, "place_id_to": 22, "distance_km": 139}, # Ramboda Falls to Negombo
        {"place_id_from": 26, "place_id_to": 23, "distance_km": 27},  # Ramboda Falls to Nuwara Eliya
        {"place_id_from": 26, "place_id_to": 24, "distance_km": 14},  # Ramboda Falls to Damro Tea Factory
        {"place_id_from": 26, "place_id_to": 25, "distance_km": 25},  # Ramboda Falls to Gregory Lake
        {"place_id_from": 26, "place_id_to": 27, "distance_km": 40},  # Ramboda Falls to Tea Plantations
        {"place_id_from": 26, "place_id_to": 28, "distance_km": 141}, # Ramboda Falls to Sigiriya
        {"place_id_from": 26, "place_id_to": 29, "distance_km": 124}, # Ramboda Falls to Dambulla
        {"place_id_from": 26, "place_id_to": 30, "distance_km": 145}, # Ramboda Falls to Habarana
        {"place_id_from": 26, "place_id_to": 31, "distance_km": 181}, # Ramboda Falls to Kawudulla
        {"place_id_from": 26, "place_id_to": 32, "distance_km": 144}, # Ramboda Falls to Pidurangala
        {"place_id_from": 26, "place_id_to": 33, "distance_km": 174}, # Ramboda Falls to Minneriya
        {"place_id_from": 26, "place_id_to": 34, "distance_km": 216}, # Ramboda Falls to Tangalle
        {"place_id_from": 26, "place_id_to": 35, "distance_km": 167}, # Ramboda Falls to Hiriketiya
        {"place_id_from": 26, "place_id_to": 36, "distance_km": 230}, # Ramboda Falls to Trincomalee
        {"place_id_from": 26, "place_id_to": 37, "distance_km": 230}, # Ramboda Falls to Marble Bay
        {"place_id_from": 26, "place_id_to": 38, "distance_km": 233}, # Ramboda Falls to Maritime & Naval History Museum
        {"place_id_from": 26, "place_id_to": 39, "distance_km": 228}, # Ramboda Falls to Pasikuda
        {"place_id_from": 26, "place_id_to": 40, "distance_km": 235}, # Ramboda Falls to ThiruKoneshwaram Kovil
        {"place_id_from": 26, "place_id_to": 41, "distance_km": 165}, # Ramboda Falls to Udawalawa
        {"place_id_from": 26, "place_id_to": 42, "distance_km": 257}, # Ramboda Falls to Weligama
        {"place_id_from": 26, "place_id_to": 43, "distance_km": 150}, # Ramboda Falls to Yala
        {"place_id_from": 26, "place_id_to": 44, "distance_km": 84},  # Ramboda Falls to Adam's Peak
        {"place_id_from": 27, "place_id_to": 1, "distance_km": 272},
        {"place_id_from": 27, "place_id_to": 2, "distance_km": 225},
        {"place_id_from": 27, "place_id_to": 3, "distance_km": 198},
        {"place_id_from": 27, "place_id_to": 4, "distance_km": 232},
        {"place_id_from": 27, "place_id_to": 5, "distance_km": 75},
        {"place_id_from": 27, "place_id_to": 6, "distance_km": 76},
        {"place_id_from": 27, "place_id_to": 7, "distance_km": 75},
        {"place_id_from": 27, "place_id_to": 8, "distance_km": 80},
        {"place_id_from": 27, "place_id_to": 9, "distance_km": 76},
        {"place_id_from": 27, "place_id_to": 10, "distance_km": 272},
        {"place_id_from": 27, "place_id_to": 11, "distance_km": 293},
        {"place_id_from": 27, "place_id_to": 12, "distance_km": 295},
        {"place_id_from": 27, "place_id_to": 13, "distance_km": 42},
        {"place_id_from": 27, "place_id_to": 14, "distance_km": 117},
        {"place_id_from": 27, "place_id_to": 15, "distance_km": 80},
        {"place_id_from": 27, "place_id_to": 16, "distance_km": 78},
        {"place_id_from": 27, "place_id_to": 17, "distance_km": 119},
        {"place_id_from": 27, "place_id_to": 18, "distance_km": 78},
        {"place_id_from": 27, "place_id_to": 19, "distance_km": 85},
        {"place_id_from": 27, "place_id_to": 20, "distance_km": 87},
        {"place_id_from": 27, "place_id_to": 21, "distance_km": 249},
        {"place_id_from": 27, "place_id_to": 22, "distance_km": 193},
        {"place_id_from": 27, "place_id_to": 23, "distance_km": 21},
        {"place_id_from": 27, "place_id_to": 24, "distance_km": 29},
        {"place_id_from": 27, "place_id_to": 25, "distance_km": 19},
        {"place_id_from": 27, "place_id_to": 26, "distance_km": 42},
        {"place_id_from": 27, "place_id_to": 28, "distance_km": 178},
        {"place_id_from": 27, "place_id_to": 29, "distance_km": 169},
        {"place_id_from": 27, "place_id_to": 30, "distance_km": 189},
        {"place_id_from": 27, "place_id_to": 31, "distance_km": 200},
        {"place_id_from": 27, "place_id_to": 32, "distance_km": 181},
        {"place_id_from": 27, "place_id_to": 33, "distance_km": 182},
        {"place_id_from": 27, "place_id_to": 34, "distance_km": 211},
        {"place_id_from": 27, "place_id_to": 35, "distance_km": 193},
        {"place_id_from": 27, "place_id_to": 36, "distance_km": 273},
        {"place_id_from": 27, "place_id_to": 37, "distance_km": 274},
        {"place_id_from": 27, "place_id_to": 38, "distance_km": 277},
        {"place_id_from": 27, "place_id_to": 39, "distance_km": 187},
        {"place_id_from": 27, "place_id_to": 40, "distance_km": 279},
        {"place_id_from": 27, "place_id_to": 41, "distance_km": 158},
        {"place_id_from": 27, "place_id_to": 42, "distance_km": 251},
        {"place_id_from": 27, "place_id_to": 43, "distance_km": 172},
        {"place_id_from": 27, "place_id_to": 44, "distance_km": 87},
        {"place_id_from": 28, "place_id_to": 1, "distance_km": 174},
        {"place_id_from": 28, "place_id_to": 2, "distance_km": 230},
        {"place_id_from": 28, "place_id_to": 3, "distance_km": 245},
        {"place_id_from": 28, "place_id_to": 4, "distance_km": 74},
        {"place_id_from": 28, "place_id_to": 5, "distance_km": 180},
        {"place_id_from": 28, "place_id_to": 6, "distance_km": 180},
        {"place_id_from": 28, "place_id_to": 7, "distance_km": 180},
        {"place_id_from": 28, "place_id_to": 8, "distance_km": 184},
        {"place_id_from": 28, "place_id_to": 9, "distance_km": 180},
        {"place_id_from": 28, "place_id_to": 10, "distance_km": 162},
        {"place_id_from": 28, "place_id_to": 11, "distance_km": 264},
        {"place_id_from": 28, "place_id_to": 12, "distance_km": 266},
        {"place_id_from": 28, "place_id_to": 13, "distance_km": 214},
        {"place_id_from": 28, "place_id_to": 14, "distance_km": 138},
        {"place_id_from": 28, "place_id_to": 15, "distance_km": 89},
        {"place_id_from": 28, "place_id_to": 16, "distance_km": 113},
        {"place_id_from": 28, "place_id_to": 17, "distance_km": 97},
        {"place_id_from": 28, "place_id_to": 18, "distance_km": 92},
        {"place_id_from": 28, "place_id_to": 19, "distance_km": 93},
        {"place_id_from": 28, "place_id_to": 20, "distance_km": 170},
        {"place_id_from": 28, "place_id_to": 21, "distance_km": 300},
        {"place_id_from": 28, "place_id_to": 22, "distance_km": 147},
        {"place_id_from": 28, "place_id_to": 23, "distance_km": 164},
        {"place_id_from": 28, "place_id_to": 24, "distance_km": 151},
        {"place_id_from": 28, "place_id_to": 25, "distance_km": 162},
        {"place_id_from": 28, "place_id_to": 26, "distance_km": 143},
        {"place_id_from": 28, "place_id_to": 27, "distance_km": 182},
        {"place_id_from": 28, "place_id_to": 29, "distance_km": 17},
        {"place_id_from": 28, "place_id_to": 30, "distance_km": 17},
        {"place_id_from": 28, "place_id_to": 31, "distance_km": 46},
        {"place_id_from": 28, "place_id_to": 32, "distance_km": 3.7},
        {"place_id_from": 28, "place_id_to": 33, "distance_km": 35},
        {"place_id_from": 28, "place_id_to": 34, "distance_km": 333},
        {"place_id_from": 28, "place_id_to": 35, "distance_km": 218},
        {"place_id_from": 28, "place_id_to": 36, "distance_km": 99},
        {"place_id_from": 28, "place_id_to": 37, "distance_km": 99},
        {"place_id_from": 28, "place_id_to": 38, "distance_km": 103},
        {"place_id_from": 28, "place_id_to": 39, "distance_km": 125},
        {"place_id_from": 28, "place_id_to": 40, "distance_km": 104},
        {"place_id_from": 28, "place_id_to": 41, "distance_km": 261},
        {"place_id_from": 28, "place_id_to": 42, "distance_km": 292},
        {"place_id_from": 28, "place_id_to": 43, "distance_km": 199},
        {"place_id_from": 28, "place_id_to": 44, "distance_km": 175},
        {"place_id_from": 29, "place_id_to": 1, "distance_km": 157},  # Dambulla to Colombo
        {"place_id_from": 29, "place_id_to": 2, "distance_km": 213},  # Dambulla to Bentota
        {"place_id_from": 29, "place_id_to": 3, "distance_km": 232},  # Dambulla to Arugam Bay
        {"place_id_from": 29, "place_id_to": 4, "distance_km": 64},   # Dambulla to Anuradhapura
        {"place_id_from": 29, "place_id_to": 5, "distance_km": 166},  # Dambulla to Ella
        {"place_id_from": 29, "place_id_to": 6, "distance_km": 167},  # Dambulla to Little Adam's Peak
        {"place_id_from": 29, "place_id_to": 7, "distance_km": 167},  # Dambulla to Nine Arch Bridge
        {"place_id_from": 29, "place_id_to": 8, "distance_km": 171},  # Dambulla to Ravana Waterfalls
        {"place_id_from": 29, "place_id_to": 9, "distance_km": 167},  # Dambulla to Ravana Zipline
        {"place_id_from": 29, "place_id_to": 10, "distance_km": 257}, # Dambulla to Galle Fort
        {"place_id_from": 29, "place_id_to": 11, "distance_km": 247}, # Dambulla to Hikkaduwa
        {"place_id_from": 29, "place_id_to": 12, "distance_km": 249}, # Dambulla to Turtle Beach
        {"place_id_from": 29, "place_id_to": 13, "distance_km": 169}, # Dambulla to Horton Plains
        {"place_id_from": 29, "place_id_to": 14, "distance_km": 124}, # Dambulla to World's End (Sri Lanka)
        {"place_id_from": 29, "place_id_to": 15, "distance_km": 73},  # Dambulla to Kandy
        {"place_id_from": 29, "place_id_to": 16, "distance_km": 97},  # Dambulla to Ambuluwawa Tower
        {"place_id_from": 29, "place_id_to": 17, "distance_km": 80},  # Dambulla to Elephant Orphanage
        {"place_id_from": 29, "place_id_to": 18, "distance_km": 75},  # Dambulla to Temple of the Tooth Relic
        {"place_id_from": 29, "place_id_to": 19, "distance_km": 77},  # Dambulla to Royal Botanical Garden
        {"place_id_from": 29, "place_id_to": 20, "distance_km": 131}, # Dambulla to Kitulgala
        {"place_id_from": 29, "place_id_to": 21, "distance_km": 283}, # Dambulla to Mirissa
        {"place_id_from": 29, "place_id_to": 22, "distance_km": 131}, # Dambulla to Negombo
        {"place_id_from": 29, "place_id_to": 23, "distance_km": 147}, # Dambulla to Nuwara Eliya
        {"place_id_from": 29, "place_id_to": 24, "distance_km": 135}, # Dambulla to Damro Tea Factory
        {"place_id_from": 29, "place_id_to": 25, "distance_km": 146}, # Dambulla to Gregory Lake
        {"place_id_from": 29, "place_id_to": 26, "distance_km": 127}, # Dambulla to Ramboda Falls
        {"place_id_from": 29, "place_id_to": 27, "distance_km": 169}, # Dambulla to Tea Plantations
        {"place_id_from": 29, "place_id_to": 28, "distance_km": 17},  # Dambulla to Sigiriya
        {"place_id_from": 29, "place_id_to": 30, "distance_km": 21},  # Dambulla to Habarana
        {"place_id_from": 29, "place_id_to": 31, "distance_km": 57},  # Dambulla to Kawudulla
        {"place_id_from": 29, "place_id_to": 32, "distance_km": 20},  # Dambulla to Pidurangala
        {"place_id_from": 29, "place_id_to": 33, "distance_km": 47},  # Dambulla to Minneriya
        {"place_id_from": 29, "place_id_to": 34, "distance_km": 316}, # Dambulla to Tangalle
        {"place_id_from": 29, "place_id_to": 35, "distance_km": 202}, # Dambulla to Hiriketiya
        {"place_id_from": 29, "place_id_to": 36, "distance_km": 106}, # Dambulla to Trincomalee
        {"place_id_from": 29, "place_id_to": 37, "distance_km": 106}, # Dambulla to Marble Bay
        {"place_id_from": 29, "place_id_to": 38, "distance_km": 109}, # Dambulla to Maritime & Naval History Museum
        {"place_id_from": 29, "place_id_to": 39, "distance_km": 139}, # Dambulla to Pasikuda
        {"place_id_from": 29, "place_id_to": 40, "distance_km": 111}, # Dambulla to ThiruKoneshwaram Kovil
        {"place_id_from": 29, "place_id_to": 41, "distance_km": 244}, # Dambulla to Udawalawa
        {"place_id_from": 29, "place_id_to": 42, "distance_km": 276}, # Dambulla to Weligama
        {"place_id_from": 29, "place_id_to": 43, "distance_km": 182}, # Dambulla to Yala
        {"place_id_from": 29, "place_id_to": 44, "distance_km": 158}, # Dambulla to Adam's Peak
        {"place_id_from": 30, "place_id_to": 1, "distance_km": 178},  # Habarana to Colombo
        {"place_id_from": 30, "place_id_to": 2, "distance_km": 234},  # Habarana to Bentota
        {"place_id_from": 30, "place_id_to": 3, "distance_km": 254},  # Habarana to Arugam Bay
        {"place_id_from": 30, "place_id_to": 4, "distance_km": 59},   # Habarana to Anuradhapura
        {"place_id_from": 30, "place_id_to": 5, "distance_km": 185},  # Habarana to Ella
        {"place_id_from": 30, "place_id_to": 6, "distance_km": 186},  # Habarana to Little Adam's Peak
        {"place_id_from": 30, "place_id_to": 7, "distance_km": 185},  # Habarana to Nine Arch Bridge
        {"place_id_from": 30, "place_id_to": 8, "distance_km": 190},  # Habarana to Ravana Waterfalls
        {"place_id_from": 30, "place_id_to": 9, "distance_km": 186},  # Habarana to Ravana Zipline
        {"place_id_from": 30, "place_id_to": 10, "distance_km": 279}, # Habarana to Galle Fort
        {"place_id_from": 30, "place_id_to": 11, "distance_km": 269}, # Habarana to Hikkaduwa
        {"place_id_from": 30, "place_id_to": 12, "distance_km": 270}, # Habarana to Turtle Beach
        {"place_id_from": 30, "place_id_to": 13, "distance_km": 190}, # Habarana to Horton Plains
        {"place_id_from": 30, "place_id_to": 14, "distance_km": 144}, # Habarana to World's End (Sri Lanka)
        {"place_id_from": 30, "place_id_to": 15, "distance_km": 94},  # Habarana to Kandy
        {"place_id_from": 30, "place_id_to": 16, "distance_km": 118}, # Habarana to Ambuluwawa Tower
        {"place_id_from": 30, "place_id_to": 17, "distance_km": 102}, # Habarana to Elephant Orphanage
        {"place_id_from": 30, "place_id_to": 18, "distance_km": 97},  # Habarana to Temple of the Tooth
        {"place_id_from": 30, "place_id_to": 19, "distance_km": 98},  # Habarana to Royal Botanical Garden
        {"place_id_from": 30, "place_id_to": 20, "distance_km": 164}, # Habarana to Kitulgala
        {"place_id_from": 30, "place_id_to": 21, "distance_km": 304}, # Habarana to Mirissa
        {"place_id_from": 30, "place_id_to": 22, "distance_km": 152}, # Habarana to Negombo
        {"place_id_from": 30, "place_id_to": 23, "distance_km": 169}, # Habarana to Nuwara Eliya
        {"place_id_from": 30, "place_id_to": 24, "distance_km": 156}, # Habarana to Damro Tea Factory
        {"place_id_from": 30, "place_id_to": 25, "distance_km": 167}, # Habarana to Gregory Lake
        {"place_id_from": 30, "place_id_to": 26, "distance_km": 148}, # Habarana to Ramboda Falls
        {"place_id_from": 30, "place_id_to": 27, "distance_km": 188}, # Habarana to Tea Plantations
        {"place_id_from": 30, "place_id_to": 28, "distance_km": 17},  # Habarana to Sigiriya
        {"place_id_from": 30, "place_id_to": 29, "distance_km": 21},  # Habarana to Dambulla
        {"place_id_from": 30, "place_id_to": 31, "distance_km": 36},  # Habarana to Kawudulla
        {"place_id_from": 30, "place_id_to": 32, "distance_km": 13},  # Habarana to Pidurangala
        {"place_id_from": 30, "place_id_to": 33, "distance_km": 25},  # Habarana to Minneriya
        {"place_id_from": 30, "place_id_to": 34, "distance_km": 338}, # Habarana to Tangalle
        {"place_id_from": 30, "place_id_to": 35, "distance_km": 223}, # Habarana to Hiriketiya
        {"place_id_from": 30, "place_id_to": 36, "distance_km": 84},  # Habarana to Trincomalee
        {"place_id_from": 30, "place_id_to": 37, "distance_km": 84},  # Habarana to Marble Bay
        {"place_id_from": 30, "place_id_to": 38, "distance_km": 88},  # Habarana to Maritime & Naval History Museum
        {"place_id_from": 30, "place_id_to": 39, "distance_km": 115}, # Habarana to Pasikuda
        {"place_id_from": 30, "place_id_to": 40, "distance_km": 90},  # Habarana to ThiruKoneshwaram Kovil
        {"place_id_from": 30, "place_id_to": 41, "distance_km": 265}, # Habarana to Udawalawa
        {"place_id_from": 30, "place_id_to": 42, "distance_km": 297}, # Habarana to Weligama
        {"place_id_from": 30, "place_id_to": 43, "distance_km": 204}, # Habarana to Yala
        {"place_id_from": 30, "place_id_to": 44, "distance_km": 180}, # Habarana to Adam’s Peak
        {"place_id_from": 31, "place_id_to": 1, "distance_km": 205},  # Colombo
        {"place_id_from": 31, "place_id_to": 2, "distance_km": 259},  # Bentota
        {"place_id_from": 31, "place_id_to": 3, "distance_km": 258},  # Arugam Bay
        {"place_id_from": 31, "place_id_to": 4, "distance_km": 82},   # Anuradhapura
        {"place_id_from": 31, "place_id_to": 5, "distance_km": 189},  # Ella
        {"place_id_from": 31, "place_id_to": 6, "distance_km": 190},  # Little Adam’s Peak
        {"place_id_from": 31, "place_id_to": 7, "distance_km": 190},  # Nine Arch Bridge
        {"place_id_from": 31, "place_id_to": 8, "distance_km": 194},  # Ravana Waterfalls
        {"place_id_from": 31, "place_id_to": 9, "distance_km": 190},  # Ravana Zipline
        {"place_id_from": 31, "place_id_to": 10, "distance_km": 303}, # Galle Fort
        {"place_id_from": 31, "place_id_to": 11, "distance_km": 293}, # Hikkaduwa
        {"place_id_from": 31, "place_id_to": 12, "distance_km": 295}, # Turtle Beach
        {"place_id_from": 31, "place_id_to": 13, "distance_km": 224}, # Horton Plains
        {"place_id_from": 31, "place_id_to": 14, "distance_km": 148}, # World’s End (Sri Lanka)
        {"place_id_from": 31, "place_id_to": 15, "distance_km": 118}, # Kandy
        {"place_id_from": 31, "place_id_to": 16, "distance_km": 143}, # Ambuluwawa Tower
        {"place_id_from": 31, "place_id_to": 17, "distance_km": 126}, # Elephant Orphanage
        {"place_id_from": 31, "place_id_to": 18, "distance_km": 121}, # Temple of the Tooth Relic
        {"place_id_from": 31, "place_id_to": 19, "distance_km": 123}, # Royal Botanical Garden
        {"place_id_from": 31, "place_id_to": 20, "distance_km": 186}, # Kitulgala
        {"place_id_from": 31, "place_id_to": 21, "distance_km": 329}, # Mirissa
        {"place_id_from": 31, "place_id_to": 22, "distance_km": 176}, # Negombo
        {"place_id_from": 31, "place_id_to": 23, "distance_km": 209}, # Nuwara Eliya
        {"place_id_from": 31, "place_id_to": 24, "distance_km": 180}, # Damro Tea Factory
        {"place_id_from": 31, "place_id_to": 25, "distance_km": 207}, # Gregory Lake
        {"place_id_from": 31, "place_id_to": 26, "distance_km": 172}, # Ramboda Falls
        {"place_id_from": 31, "place_id_to": 27, "distance_km": 192}, # Tea Plantations
        {"place_id_from": 31, "place_id_to": 28, "distance_km": 38},  # Sigiriya
        {"place_id_from": 31, "place_id_to": 29, "distance_km": 46},  # Dambulla
        {"place_id_from": 31, "place_id_to": 30, "distance_km": 24},  # Habarana
        {"place_id_from": 31, "place_id_to": 32, "distance_km": 35},  # Pidurangala
        {"place_id_from": 31, "place_id_to": 33, "distance_km": 9.9}, # Minneriya
        {"place_id_from": 31, "place_id_to": 34, "distance_km": 330}, # Tangalle
        {"place_id_from": 31, "place_id_to": 35, "distance_km": 247}, # Hiriketiya
        {"place_id_from": 31, "place_id_to": 36, "distance_km": 77},  # Trincomalee
        {"place_id_from": 31, "place_id_to": 37, "distance_km": 77},  # Marble Bay
        {"place_id_from": 31, "place_id_to": 38, "distance_km": 81},  # Maritime & Naval History Museum
        {"place_id_from": 31, "place_id_to": 39, "distance_km": 100}, # Pasikuda
        {"place_id_from": 31, "place_id_to": 40, "distance_km": 82},  # ThiruKoneshwaram Kovil
        {"place_id_from": 31, "place_id_to": 41, "distance_km": 293}, # Udawalawa
        {"place_id_from": 31, "place_id_to": 42, "distance_km": 321}, # Weligama
        {"place_id_from": 31, "place_id_to": 43, "distance_km": 228}, # Yala
        {"place_id_from": 31, "place_id_to": 44, "distance_km": 204}, # Adam’s Peak
        {"place_id_from": 32, "place_id_to": 1, "distance_km": 176},  # Colombo
        {"place_id_from": 32, "place_id_to": 2, "distance_km": 233},  # Bentota
        {"place_id_from": 32, "place_id_to": 3, "distance_km": 248},  # Arugam Bay
        {"place_id_from": 32, "place_id_to": 4, "distance_km": 71},   # Anuradhapura
        {"place_id_from": 32, "place_id_to": 5, "distance_km": 183},  # Ella
        {"place_id_from": 32, "place_id_to": 6, "distance_km": 183},  # Little Adam's Peak
        {"place_id_from": 32, "place_id_to": 7, "distance_km": 183},  # Nine Arch Bridge
        {"place_id_from": 32, "place_id_to": 8, "distance_km": 187},  # Ravana Waterfalls
        {"place_id_from": 32, "place_id_to": 9, "distance_km": 183},  # Ravana Zipline
        {"place_id_from": 32, "place_id_to": 10, "distance_km": 277}, # Galle Fort
        {"place_id_from": 32, "place_id_to": 11, "distance_km": 267}, # Hikkaduwa
        {"place_id_from": 32, "place_id_to": 12, "distance_km": 269}, # Turtle Beach
        {"place_id_from": 32, "place_id_to": 13, "distance_km": 188}, # Horton Plains
        {"place_id_from": 32, "place_id_to": 14, "distance_km": 141}, # World’s End
        {"place_id_from": 32, "place_id_to": 15, "distance_km": 92},  # Kandy
        {"place_id_from": 32, "place_id_to": 16, "distance_km": 116}, # Ambuluwawa Tower
        {"place_id_from": 32, "place_id_to": 17, "distance_km": 100}, # Elephant Orphanage
        {"place_id_from": 32, "place_id_to": 18, "distance_km": 95},  # Temple of the Tooth Relic
        {"place_id_from": 32, "place_id_to": 19, "distance_km": 96},  # Royal Botanical Garden
        {"place_id_from": 32, "place_id_to": 20, "distance_km": 163}, # Kitulgala
        {"place_id_from": 32, "place_id_to": 21, "distance_km": 303}, # Mirissa
        {"place_id_from": 32, "place_id_to": 22, "distance_km": 150}, # Negombo
        {"place_id_from": 32, "place_id_to": 23, "distance_km": 167}, # Nuwara Eliya
        {"place_id_from": 32, "place_id_to": 24, "distance_km": 154}, # Damro Tea Factory
        {"place_id_from": 32, "place_id_to": 25, "distance_km": 165}, # Gregory Lake
        {"place_id_from": 32, "place_id_to": 26, "distance_km": 146}, # Ramboda Falls
        {"place_id_from": 32, "place_id_to": 27, "distance_km": 185}, # Tea Plantations
        {"place_id_from": 32, "place_id_to": 28, "distance_km": 3.7}, # Sigiriya
        {"place_id_from": 32, "place_id_to": 29, "distance_km": 20},  # Dambulla
        {"place_id_from": 32, "place_id_to": 30, "distance_km": 13},  # Habarana
        {"place_id_from": 32, "place_id_to": 31, "distance_km": 43},  # Kawudulla
        {"place_id_from": 32, "place_id_to": 33, "distance_km": 32},  # Minneriya
        {"place_id_from": 32, "place_id_to": 34, "distance_km": 336}, # Tangalle
        {"place_id_from": 32, "place_id_to": 35, "distance_km": 221}, # Hiriketiya
        {"place_id_from": 32, "place_id_to": 36, "distance_km": 96},  # Trincomalee
        {"place_id_from": 32, "place_id_to": 37, "distance_km": 96},  # Marble Bay
        {"place_id_from": 32, "place_id_to": 38, "distance_km": 99},  # Maritime & Naval History Museum
        {"place_id_from": 32, "place_id_to": 39, "distance_km": 122}, # Pasikuda
        {"place_id_from": 32, "place_id_to": 40, "distance_km": 101}, # ThiruKoneshwaram Kovil
        {"place_id_from": 32, "place_id_to": 41, "distance_km": 264}, # Udawalawa
        {"place_id_from": 32, "place_id_to": 42, "distance_km": 295}, # Weligama
        {"place_id_from": 32, "place_id_to": 43, "distance_km": 202}, # Yala
        {"place_id_from": 32, "place_id_to": 44, "distance_km": 178}, # Adam’s Peak
        {"place_id_from": 33, "place_id_to": 1, "distance_km": 206},
        {"place_id_from": 33, "place_id_to": 2, "distance_km": 260},
        {"place_id_from": 33, "place_id_to": 3, "distance_km": 228},
        {"place_id_from": 33, "place_id_to": 4, "distance_km": 83},
        {"place_id_from": 33, "place_id_to": 5, "distance_km": 180},
        {"place_id_from": 33, "place_id_to": 6, "distance_km": 181},
        {"place_id_from": 33, "place_id_to": 7, "distance_km": 180},
        {"place_id_from": 33, "place_id_to": 8, "distance_km": 184},
        {"place_id_from": 33, "place_id_to": 9, "distance_km": 180},
        {"place_id_from": 33, "place_id_to": 10, "distance_km": 304},
        {"place_id_from": 33, "place_id_to": 11, "distance_km": 294},
        {"place_id_from": 33, "place_id_to": 12, "distance_km": 295},
        {"place_id_from": 33, "place_id_to": 13, "distance_km": 214},
        {"place_id_from": 33, "place_id_to": 14, "distance_km": 139},
        {"place_id_from": 33, "place_id_to": 15, "distance_km": 127},
        {"place_id_from": 33, "place_id_to": 16, "distance_km": 151},
        {"place_id_from": 33, "place_id_to": 17, "distance_km": 127},
        {"place_id_from": 33, "place_id_to": 18, "distance_km": 126},
        {"place_id_from": 33, "place_id_to": 19, "distance_km": 131},
        {"place_id_from": 33, "place_id_to": 20, "distance_km": 187},
        {"place_id_from": 33, "place_id_to": 21, "distance_km": 330},
        {"place_id_from": 33, "place_id_to": 22, "distance_km": 177},
        {"place_id_from": 33, "place_id_to": 23, "distance_km": 199},
        {"place_id_from": 33, "place_id_to": 24, "distance_km": 208},
        {"place_id_from": 33, "place_id_to": 25, "distance_km": 198},
        {"place_id_from": 33, "place_id_to": 26, "distance_km": 181},
        {"place_id_from": 33, "place_id_to": 27, "distance_km": 182},
        {"place_id_from": 33, "place_id_to": 28, "distance_km": 35},
        {"place_id_from": 33, "place_id_to": 29, "distance_km": 47},
        {"place_id_from": 33, "place_id_to": 30, "distance_km": 25},
        {"place_id_from": 33, "place_id_to": 31, "distance_km": 18},
        {"place_id_from": 33, "place_id_to": 32, "distance_km": 32},
        {"place_id_from": 33, "place_id_to": 34, "distance_km": 320},
        {"place_id_from": 33, "place_id_to": 35, "distance_km": 248},
        {"place_id_from": 33, "place_id_to": 36, "distance_km": 107},
        {"place_id_from": 33, "place_id_to": 37, "distance_km": 108},
        {"place_id_from": 33, "place_id_to": 38, "distance_km": 111},
        {"place_id_from": 33, "place_id_to": 39, "distance_km": 90},
        {"place_id_from": 33, "place_id_to": 40, "distance_km": 113},
        {"place_id_from": 33, "place_id_to": 41, "distance_km": 284},
        {"place_id_from": 33, "place_id_to": 42, "distance_km": 322},
        {"place_id_from": 33, "place_id_to": 43, "distance_km": 210},
        {"place_id_from": 33, "place_id_to": 44, "distance_km": 213},
        {"place_id_from": 34, "place_id_to": 1, "distance_km": 186},
        {"place_id_from": 34, "place_id_to": 2, "distance_km": 128},
        {"place_id_from": 34, "place_id_to": 3, "distance_km": 225},
        {"place_id_from": 34, "place_id_to": 4, "distance_km": 367},
        {"place_id_from": 34, "place_id_to": 5, "distance_km": 144},
        {"place_id_from": 34, "place_id_to": 6, "distance_km": 148},
        {"place_id_from": 34, "place_id_to": 7, "distance_km": 147},
        {"place_id_from": 34, "place_id_to": 8, "distance_km": 139},
        {"place_id_from": 34, "place_id_to": 9, "distance_km": 147},
        {"place_id_from": 34, "place_id_to": 10, "distance_km": 73},
        {"place_id_from": 34, "place_id_to": 11, "distance_km": 94},
        {"place_id_from": 34, "place_id_to": 12, "distance_km": 96},
        {"place_id_from": 34, "place_id_to": 13, "distance_km": 185},
        {"place_id_from": 34, "place_id_to": 14, "distance_km": 265},
        {"place_id_from": 34, "place_id_to": 15, "distance_km": 280},
        {"place_id_from": 34, "place_id_to": 16, "distance_km": 279},
        {"place_id_from": 34, "place_id_to": 17, "distance_km": 251},
        {"place_id_from": 34, "place_id_to": 18, "distance_km": 282},
        {"place_id_from": 34, "place_id_to": 19, "distance_km": 273},
        {"place_id_from": 34, "place_id_to": 20, "distance_km": 243},
        {"place_id_from": 34, "place_id_to": 21, "distance_km": 50},
        {"place_id_from": 34, "place_id_to": 22, "distance_km": 212},
        {"place_id_from": 34, "place_id_to": 23, "distance_km": 199},
        {"place_id_from": 34, "place_id_to": 24, "distance_km": 215},
        {"place_id_from": 34, "place_id_to": 25, "distance_km": 201},
        {"place_id_from": 34, "place_id_to": 26, "distance_km": 219},
        {"place_id_from": 34, "place_id_to": 27, "distance_km": 219},
        {"place_id_from": 34, "place_id_to": 28, "distance_km": 331},
        {"place_id_from": 34, "place_id_to": 29, "distance_km": 315},
        {"place_id_from": 34, "place_id_to": 30, "distance_km": 336},
        {"place_id_from": 34, "place_id_to": 31, "distance_km": 344},
        {"place_id_from": 34, "place_id_to": 32, "distance_km": 344},
        {"place_id_from": 34, "place_id_to": 33, "distance_km": 331},
        {"place_id_from": 34, "place_id_to": 35, "distance_km": 130},
        {"place_id_from": 34, "place_id_to": 36, "distance_km": 420},
        {"place_id_from": 34, "place_id_to": 37, "distance_km": 387},
        {"place_id_from": 34, "place_id_to": 38, "distance_km": 424},
        {"place_id_from": 34, "place_id_to": 39, "distance_km": 297},
        {"place_id_from": 34, "place_id_to": 40, "distance_km": 426},
        {"place_id_from": 34, "place_id_to": 41, "distance_km": 57},
        {"place_id_from": 34, "place_id_to": 42, "distance_km": 51},
        {"place_id_from": 34, "place_id_to": 43, "distance_km": 145},
        {"place_id_from": 34, "place_id_to": 44, "distance_km": 173},
        {"place_id_from": 35, "place_id_to": 1, "distance_km": 176},  # Colombo
        {"place_id_from": 35, "place_id_to": 2, "distance_km": 111},  # Bentota
        {"place_id_from": 35, "place_id_to": 3, "distance_km": 232},  # Arugam Bay
        {"place_id_from": 35, "place_id_to": 4, "distance_km": 357},  # Anuradhapura
        {"place_id_from": 35, "place_id_to": 5, "distance_km": 149},  # Ella
        {"place_id_from": 35, "place_id_to": 6, "distance_km": 153},  # Little Adam’s Peak
        {"place_id_from": 35, "place_id_to": 7, "distance_km": 155},  # Nine Arch Bridge
        {"place_id_from": 35, "place_id_to": 8, "distance_km": 199},  # Ravana Waterfalls
        {"place_id_from": 35, "place_id_to": 9, "distance_km": 153},  # Ravana Zipline
        {"place_id_from": 35, "place_id_to": 10, "distance_km": 63},  # Galle Fort
        {"place_id_from": 35, "place_id_to": 11, "distance_km": 84},  # Hikkaduwa
        {"place_id_from": 35, "place_id_to": 12, "distance_km": 86},  # Turtle Beach
        {"place_id_from": 35, "place_id_to": 13, "distance_km": 190},  # Horton Plains
        {"place_id_from": 35, "place_id_to": 14, "distance_km": 145},  # World’s End
        {"place_id_from": 35, "place_id_to": 15, "distance_km": 269},  # Kandy
        {"place_id_from": 35, "place_id_to": 16, "distance_km": 241},  # Ambuluwawa Tower
        {"place_id_from": 35, "place_id_to": 17, "distance_km": 241},  # Elephant Orphanage
        {"place_id_from": 35, "place_id_to": 18, "distance_km": 290},  # Temple of the Tooth Relic
        {"place_id_from": 35, "place_id_to": 19, "distance_km": 250},  # Royal Botanical Garden
        {"place_id_from": 35, "place_id_to": 20, "distance_km": 205},  # Kitulgala
        {"place_id_from": 35, "place_id_to": 21, "distance_km": 34},  # Mirissa
        {"place_id_from": 35, "place_id_to": 22, "distance_km": 201},  # Negombo
        {"place_id_from": 35, "place_id_to": 23, "distance_km": 204},  # Nuwara Eliya
        {"place_id_from": 35, "place_id_to": 24, "distance_km": 220},  # Damro Tea Factory
        {"place_id_from": 35, "place_id_to": 25, "distance_km": 206},  # Gregory Lake
        {"place_id_from": 35, "place_id_to": 26, "distance_km": 233},  # Ramboda Falls
        {"place_id_from": 35, "place_id_to": 27, "distance_km": 224},  # Tea Plantations
        {"place_id_from": 35, "place_id_to": 28, "distance_km": 322},  # Sigiriya
        {"place_id_from": 35, "place_id_to": 29, "distance_km": 305},  # Dambulla
        {"place_id_from": 35, "place_id_to": 30, "distance_km": 327},  # Habarana
        {"place_id_from": 35, "place_id_to": 31, "distance_km": 346},  # Kawudulla
        {"place_id_from": 35, "place_id_to": 32, "distance_km": 325},  # Pidurangala
        {"place_id_from": 35, "place_id_to": 33, "distance_km": 336},  # Minneriya
        {"place_id_from": 35, "place_id_to": 34, "distance_km": 15},  # Tangalle
        {"place_id_from": 35, "place_id_to": 36, "distance_km": 407},  # Trincomalee
        {"place_id_from": 35, "place_id_to": 37, "distance_km": 396},  # Marble Bay
        {"place_id_from": 35, "place_id_to": 38, "distance_km": 411},  # Maritime & Naval History Museum
        {"place_id_from": 35, "place_id_to": 39, "distance_km": 306},  # Pasikuda
        {"place_id_from": 35, "place_id_to": 40, "distance_km": 412},  # ThiruKoneshwaram Kovil
        {"place_id_from": 35, "place_id_to": 41, "distance_km": 75},  # Udawalawa
        {"place_id_from": 35, "place_id_to": 42, "distance_km": 39},  # Weligama
        {"place_id_from": 35, "place_id_to": 43, "distance_km": 102},  # Yala
        {"place_id_from": 35, "place_id_to": 44, "distance_km": 193},  # Adam’s Peak
        {"place_id_from": 36, "place_id_to": 1, "distance_km": 265},  # Trincomalee to Colombo
        {"place_id_from": 36, "place_id_to": 2, "distance_km": 319},  # Trincomalee to Bentota
        {"place_id_from": 36, "place_id_to": 3, "distance_km": 247},  # Trincomalee to Arugam Bay
        {"place_id_from": 36, "place_id_to": 4, "distance_km": 108},  # Trincomalee to Anuradhapura
        {"place_id_from": 36, "place_id_to": 5, "distance_km": 266},  # Trincomalee to Ella
        {"place_id_from": 36, "place_id_to": 6, "distance_km": 266},  # Trincomalee to Little Adam’s Peak
        {"place_id_from": 36, "place_id_to": 7, "distance_km": 266},  # Trincomalee to Nine Arch Bridge
        {"place_id_from": 36, "place_id_to": 8, "distance_km": 270},  # Trincomalee to Ravana Waterfalls
        {"place_id_from": 36, "place_id_to": 9, "distance_km": 266},  # Trincomalee to Ravana Zipline
        {"place_id_from": 36, "place_id_to": 10, "distance_km": 363},  # Trincomalee to Galle Fort
        {"place_id_from": 36, "place_id_to": 11, "distance_km": 353},  # Trincomalee to Hikkaduwa
        {"place_id_from": 36, "place_id_to": 12, "distance_km": 388},  # Trincomalee to Turtle Beach
        {"place_id_from": 36, "place_id_to": 13, "distance_km": 274},  # Trincomalee to Horton Plains
        {"place_id_from": 36, "place_id_to": 14, "distance_km": 224},  # Trincomalee to World’s End (Sri Lanka)
        {"place_id_from": 36, "place_id_to": 15, "distance_km": 168},  # Trincomalee to Kandy
        {"place_id_from": 36, "place_id_to": 16, "distance_km": 202},  # Trincomalee to Ambuluwawa Tower
        {"place_id_from": 36, "place_id_to": 17, "distance_km": 186},  # Trincomalee to Elephant Orphanage
        {"place_id_from": 36, "place_id_to": 18, "distance_km": 181},  # Trincomalee to Temple of the Tooth Relic
        {"place_id_from": 36, "place_id_to": 19, "distance_km": 182},  # Trincomalee to Royal Botanical Garden
        {"place_id_from": 36, "place_id_to": 20, "distance_km": 237},  # Trincomalee to Kitulgala
        {"place_id_from": 36, "place_id_to": 21, "distance_km": 388},  # Trincomalee to Mirissa
        {"place_id_from": 36, "place_id_to": 22, "distance_km": 236},  # Trincomalee to Negombo
        {"place_id_from": 36, "place_id_to": 23, "distance_km": 253},  # Trincomalee to Nuwara Eliya
        {"place_id_from": 36, "place_id_to": 24, "distance_km": 240},  # Trincomalee to Damro Tea Factory
        {"place_id_from": 36, "place_id_to": 25, "distance_km": 251},  # Trincomalee to Gregory Lake
        {"place_id_from": 36, "place_id_to": 26, "distance_km": 232},  # Trincomalee to Ramboda Falls
        {"place_id_from": 36, "place_id_to": 27, "distance_km": 268},  # Trincomalee to Tea Plantations
        {"place_id_from": 36, "place_id_to": 28, "distance_km": 99},  # Trincomalee to Sigiriya
        {"place_id_from": 36, "place_id_to": 29, "distance_km": 106},  # Trincomalee to Dambulla
        {"place_id_from": 36, "place_id_to": 30, "distance_km": 84},  # Trincomalee to Habarana
        {"place_id_from": 36, "place_id_to": 31, "distance_km": 68},  # Trincomalee to Kawudulla
        {"place_id_from": 36, "place_id_to": 32, "distance_km": 96},  # Trincomalee to Pidurangala
        {"place_id_from": 36, "place_id_to": 33, "distance_km": 86},  # Trincomalee to Minneriya
        {"place_id_from": 36, "place_id_to": 34, "distance_km": 392},  # Trincomalee to Tangalle
        {"place_id_from": 36, "place_id_to": 35, "distance_km": 307},  # Trincomalee to Hiriketiya
        {"place_id_from": 36, "place_id_to": 37, "distance_km": 15},  # Trincomalee to Marble Bay
        {"place_id_from": 36, "place_id_to": 38, "distance_km": 3.8},  # Trincomalee to Maritime & Naval History Museum
        {"place_id_from": 36, "place_id_to": 39, "distance_km": 109},  # Trincomalee to Pasikuda
        {"place_id_from": 36, "place_id_to": 40, "distance_km": 5},  # Trincomalee to ThiruKoneshwaram Kovil
        {"place_id_from": 36, "place_id_to": 41, "distance_km": 354},  # Trincomalee to Udawalawa
        {"place_id_from": 36, "place_id_to": 42, "distance_km": 381},  # Trincomalee to Weligama
        {"place_id_from": 36, "place_id_to": 43, "distance_km": 288},  # Trincomalee to Yala
        {"place_id_from": 36, "place_id_to": 44, "distance_km": 264},  # Trincomalee to Adam’s Peak
        {"place_id_from": 37, "place_id_to": 1, "distance_km": 266},  # Colombo
        {"place_id_from": 37, "place_id_to": 2, "distance_km": 319},  # Bentota
        {"place_id_from": 37, "place_id_to": 3, "distance_km": 236},  # Arugam Bay
        {"place_id_from": 37, "place_id_to": 4, "distance_km": 120},  # Anuradhapura
        {"place_id_from": 37, "place_id_to": 5, "distance_km": 274},  # Ella
        {"place_id_from": 37, "place_id_to": 6, "distance_km": 274},  # Little Adam’s Peak
        {"place_id_from": 37, "place_id_to": 7, "distance_km": 274},  # Nine Arch Bridge
        {"place_id_from": 37, "place_id_to": 8, "distance_km": 291},  # Ravana Waterfalls
        {"place_id_from": 37, "place_id_to": 9, "distance_km": 274},  # Ravana Zipline
        {"place_id_from": 37, "place_id_to": 10, "distance_km": 363},  # Galle Fort
        {"place_id_from": 37, "place_id_to": 11, "distance_km": 353},  # Hikkaduwa
        {"place_id_from": 37, "place_id_to": 12, "distance_km": 388},  # Turtle Beach
        {"place_id_from": 37, "place_id_to": 13, "distance_km": 308},  # Horton Plains
        {"place_id_from": 37, "place_id_to": 14, "distance_km": 225},  # World’s End
        {"place_id_from": 37, "place_id_to": 15, "distance_km": 179},  # Kandy
        {"place_id_from": 37, "place_id_to": 16, "distance_km": 203},  # Ambuluwawa Tower
        {"place_id_from": 37, "place_id_to": 17, "distance_km": 186},  # Elephant Orphanage
        {"place_id_from": 37, "place_id_to": 18, "distance_km": 181},  # Temple of the Tooth Relic
        {"place_id_from": 37, "place_id_to": 19, "distance_km": 183},  # Royal Botanical Garden
        {"place_id_from": 37, "place_id_to": 20, "distance_km": 266},  # Kitulgala
        {"place_id_from": 37, "place_id_to": 21, "distance_km": 389},  # Mirissa
        {"place_id_from": 37, "place_id_to": 22, "distance_km": 237},  # Negombo
        {"place_id_from": 37, "place_id_to": 23, "distance_km": 293},  # Nuwara Eliya
        {"place_id_from": 37, "place_id_to": 24, "distance_km": 241},  # Damro Tea Factory
        {"place_id_from": 37, "place_id_to": 25, "distance_km": 291},  # Gregory Lake
        {"place_id_from": 37, "place_id_to": 26, "distance_km": 237},  # Ramboda Falls
        {"place_id_from": 37, "place_id_to": 27, "distance_km": 276},  # Tea Plantations
        {"place_id_from": 37, "place_id_to": 28, "distance_km": 99},  # Sigiriya
        {"place_id_from": 37, "place_id_to": 29, "distance_km": 106},  # Dambulla
        {"place_id_from": 37, "place_id_to": 30, "distance_km": 85},  # Habarana
        {"place_id_from": 37, "place_id_to": 31, "distance_km": 71},  # Kawudulla
        {"place_id_from": 37, "place_id_to": 32, "distance_km": 96},  # Pidurangala
        {"place_id_from": 37, "place_id_to": 33, "distance_km": 86},  # Minneriya
        {"place_id_from": 37, "place_id_to": 34, "distance_km": 381},  # Tangalle
        {"place_id_from": 37, "place_id_to": 35, "distance_km": 308},  # Hiriketiya
        {"place_id_from": 37, "place_id_to": 36, "distance_km": 15},  # Trincomalee
        {"place_id_from": 37, "place_id_to": 38, "distance_km": 19},  # Maritime & Naval History Museum
        {"place_id_from": 37, "place_id_to": 39, "distance_km": 98},  # Pasikuda
        {"place_id_from": 37, "place_id_to": 40, "distance_km": 21},  # ThiruKoneshwaram Kovil
        {"place_id_from": 37, "place_id_to": 41, "distance_km": 343},  # Udawalawa
        {"place_id_from": 37, "place_id_to": 42, "distance_km": 382},  # Weligama
        {"place_id_from": 37, "place_id_to": 43, "distance_km": 288},  # Yala
        {"place_id_from": 37, "place_id_to": 44, "distance_km": 264},  # Adam’s Peak
        {"place_id_from": 38, "place_id_to": 1, "distance_km": 266},
        {"place_id_from": 38, "place_id_to": 2, "distance_km": 322},
        {"place_id_from": 38, "place_id_to": 3, "distance_km": 251},
        {"place_id_from": 38, "place_id_to": 4, "distance_km": 111},
        {"place_id_from": 38, "place_id_to": 5, "distance_km": 269},
        {"place_id_from": 38, "place_id_to": 6, "distance_km": 270},
        {"place_id_from": 38, "place_id_to": 7, "distance_km": 270},
        {"place_id_from": 38, "place_id_to": 8, "distance_km": 274},
        {"place_id_from": 38, "place_id_to": 9, "distance_km": 270},
        {"place_id_from": 38, "place_id_to": 10, "distance_km": 367},
        {"place_id_from": 38, "place_id_to": 11, "distance_km": 357},
        {"place_id_from": 38, "place_id_to": 12, "distance_km": 391},
        {"place_id_from": 38, "place_id_to": 13, "distance_km": 304},
        {"place_id_from": 38, "place_id_to": 14, "distance_km": 228},
        {"place_id_from": 38, "place_id_to": 15, "distance_km": 182},
        {"place_id_from": 38, "place_id_to": 16, "distance_km": 206},
        {"place_id_from": 38, "place_id_to": 17, "distance_km": 190},
        {"place_id_from": 38, "place_id_to": 18, "distance_km": 185},
        {"place_id_from": 38, "place_id_to": 19, "distance_km": 186},
        {"place_id_from": 38, "place_id_to": 20, "distance_km": 250},
        {"place_id_from": 38, "place_id_to": 21, "distance_km": 392},
        {"place_id_from": 38, "place_id_to": 22, "distance_km": 240},
        {"place_id_from": 38, "place_id_to": 23, "distance_km": 272},
        {"place_id_from": 38, "place_id_to": 24, "distance_km": 244},
        {"place_id_from": 38, "place_id_to": 25, "distance_km": 270},
        {"place_id_from": 38, "place_id_to": 26, "distance_km": 240},
        {"place_id_from": 38, "place_id_to": 27, "distance_km": 272},
        {"place_id_from": 38, "place_id_to": 28, "distance_km": 103},
        {"place_id_from": 38, "place_id_to": 29, "distance_km": 109},
        {"place_id_from": 38, "place_id_to": 30, "distance_km": 88},
        {"place_id_from": 38, "place_id_to": 31, "distance_km": 74},
        {"place_id_from": 38, "place_id_to": 32, "distance_km": 99},
        {"place_id_from": 38, "place_id_to": 33, "distance_km": 90},
        {"place_id_from": 38, "place_id_to": 34, "distance_km": 425},
        {"place_id_from": 38, "place_id_to": 35, "distance_km": 311},
        {"place_id_from": 38, "place_id_to": 36, "distance_km": 3.8},
        {"place_id_from": 38, "place_id_to": 37, "distance_km": 19},
        {"place_id_from": 38, "place_id_to": 39, "distance_km": 113},
        {"place_id_from": 38, "place_id_to": 40, "distance_km": 1.7},
        {"place_id_from": 38, "place_id_to": 41, "distance_km": 358},
        {"place_id_from": 38, "place_id_to": 42, "distance_km": 385},
        {"place_id_from": 38, "place_id_to": 43, "distance_km": 292},
        {"place_id_from": 38, "place_id_to": 44, "distance_km": 268},
        {"place_id_from": 39, "place_id_to": 1, "distance_km": 297},
        {"place_id_from": 39, "place_id_to": 2, "distance_km": 350},
        {"place_id_from": 39, "place_id_to": 3, "distance_km": 146},
        {"place_id_from": 39, "place_id_to": 4, "distance_km": 172},
        {"place_id_from": 39, "place_id_to": 5, "distance_km": 183},
        {"place_id_from": 39, "place_id_to": 6, "distance_km": 184},
        {"place_id_from": 39, "place_id_to": 7, "distance_km": 184},
        {"place_id_from": 39, "place_id_to": 8, "distance_km": 201},
        {"place_id_from": 39, "place_id_to": 9, "distance_km": 184},
        {"place_id_from": 39, "place_id_to": 10, "distance_km": 351},
        {"place_id_from": 39, "place_id_to": 11, "distance_km": 372},
        {"place_id_from": 39, "place_id_to": 12, "distance_km": 328},
        {"place_id_from": 39, "place_id_to": 13, "distance_km": 218},
        {"place_id_from": 39, "place_id_to": 14, "distance_km": 155},
        {"place_id_from": 39, "place_id_to": 15, "distance_km": 189},
        {"place_id_from": 39, "place_id_to": 16, "distance_km": 215},
        {"place_id_from": 39, "place_id_to": 17, "distance_km": 218},
        {"place_id_from": 39, "place_id_to": 18, "distance_km": 187},
        {"place_id_from": 39, "place_id_to": 19, "distance_km": 195},
        {"place_id_from": 39, "place_id_to": 20, "distance_km": 250},
        {"place_id_from": 39, "place_id_to": 21, "distance_km": 328},
        {"place_id_from": 39, "place_id_to": 22, "distance_km": 268},
        {"place_id_from": 39, "place_id_to": 23, "distance_km": 203},
        {"place_id_from": 39, "place_id_to": 24, "distance_km": 211},
        {"place_id_from": 39, "place_id_to": 25, "distance_km": 201},
        {"place_id_from": 39, "place_id_to": 26, "distance_km": 220},
        {"place_id_from": 39, "place_id_to": 27, "distance_km": 186},
        {"place_id_from": 39, "place_id_to": 28, "distance_km": 125},
        {"place_id_from": 39, "place_id_to": 29, "distance_km": 136},
        {"place_id_from": 39, "place_id_to": 30, "distance_km": 115},
        {"place_id_from": 39, "place_id_to": 31, "distance_km": 102},
        {"place_id_from": 39, "place_id_to": 32, "distance_km": 122},
        {"place_id_from": 39, "place_id_to": 33, "distance_km": 90},
        {"place_id_from": 39, "place_id_to": 34, "distance_km": 291},
        {"place_id_from": 39, "place_id_to": 35, "distance_km": 339},
        {"place_id_from": 39, "place_id_to": 36, "distance_km": 109},
        {"place_id_from": 39, "place_id_to": 37, "distance_km": 98},
        {"place_id_from": 39, "place_id_to": 38, "distance_km": 113},
        {"place_id_from": 39, "place_id_to": 40, "distance_km": 114},
        {"place_id_from": 39, "place_id_to": 41, "distance_km": 253},
        {"place_id_from": 39, "place_id_to": 42, "distance_km": 329},
        {"place_id_from": 39, "place_id_to": 43, "distance_km": 319},
        {"place_id_from": 39, "place_id_to": 44, "distance_km": 270},
        {"place_id_from": 40, "place_id_to": 1, "distance_km": 271},
        {"place_id_from": 40, "place_id_to": 2, "distance_km": 324},
        {"place_id_from": 40, "place_id_to": 3, "distance_km": 253},
        {"place_id_from": 40, "place_id_to": 4, "distance_km": 113},
        {"place_id_from": 40, "place_id_to": 5, "distance_km": 271},
        {"place_id_from": 40, "place_id_to": 6, "distance_km": 272},
        {"place_id_from": 40, "place_id_to": 7, "distance_km": 271},
        {"place_id_from": 40, "place_id_to": 8, "distance_km": 276},
        {"place_id_from": 40, "place_id_to": 9, "distance_km": 272},
        {"place_id_from": 40, "place_id_to": 10, "distance_km": 368},
        {"place_id_from": 40, "place_id_to": 11, "distance_km": 357},
        {"place_id_from": 40, "place_id_to": 12, "distance_km": 393},
        {"place_id_from": 40, "place_id_to": 13, "distance_km": 306},
        {"place_id_from": 40, "place_id_to": 14, "distance_km": 229},
        {"place_id_from": 40, "place_id_to": 15, "distance_km": 183},
        {"place_id_from": 40, "place_id_to": 16, "distance_km": 208},
        {"place_id_from": 40, "place_id_to": 17, "distance_km": 190},
        {"place_id_from": 40, "place_id_to": 18, "distance_km": 185},
        {"place_id_from": 40, "place_id_to": 19, "distance_km": 187},
        {"place_id_from": 40, "place_id_to": 20, "distance_km": 252},
        {"place_id_from": 40, "place_id_to": 21, "distance_km": 393},
        {"place_id_from": 40, "place_id_to": 22, "distance_km": 241},
        {"place_id_from": 40, "place_id_to": 23, "distance_km": 274},
        {"place_id_from": 40, "place_id_to": 24, "distance_km": 245},
        {"place_id_from": 40, "place_id_to": 25, "distance_km": 272},
        {"place_id_from": 40, "place_id_to": 26, "distance_km": 242},
        {"place_id_from": 40, "place_id_to": 27, "distance_km": 273},
        {"place_id_from": 40, "place_id_to": 28, "distance_km": 103},
        {"place_id_from": 40, "place_id_to": 29, "distance_km": 110},
        {"place_id_from": 40, "place_id_to": 30, "distance_km": 89},
        {"place_id_from": 40, "place_id_to": 31, "distance_km": 75},
        {"place_id_from": 40, "place_id_to": 32, "distance_km": 100},
        {"place_id_from": 40, "place_id_to": 33, "distance_km": 91},
        {"place_id_from": 40, "place_id_to": 34, "distance_km": 427},
        {"place_id_from": 40, "place_id_to": 35, "distance_km": 312},
        {"place_id_from": 40, "place_id_to": 36, "distance_km": 4.5},
        {"place_id_from": 40, "place_id_to": 37, "distance_km": 20},
        {"place_id_from": 40, "place_id_to": 38, "distance_km": 1.7},
        {"place_id_from": 40, "place_id_to": 39, "distance_km": 113},
        {"place_id_from": 40, "place_id_to": 41, "distance_km": 359},
        {"place_id_from": 40, "place_id_to": 42, "distance_km": 386},
        {"place_id_from": 40, "place_id_to": 43, "distance_km": 292},
        {"place_id_from": 40, "place_id_to": 44, "distance_km": 269},
        {"place_id_from": 41, "place_id_to": 1, "distance_km": 155},  # Udawalawa to Colombo
        {"place_id_from": 41, "place_id_to": 2, "distance_km": 178},  # Udawalawa to Bentota
        {"place_id_from": 41, "place_id_to": 3, "distance_km": 181},  # Udawalawa to Arugam Bay
        {"place_id_from": 41, "place_id_to": 4, "distance_km": 297},  # Udawalawa to Anuradhapura
        {"place_id_from": 41, "place_id_to": 5, "distance_km": 100},  # Udawalawa to Ella
        {"place_id_from": 41, "place_id_to": 6, "distance_km": 104},  # Udawalawa to Little Adam’s Peak
        {"place_id_from": 41, "place_id_to": 7, "distance_km": 103},  # Udawalawa to Nine Arch Bridge
        {"place_id_from": 41, "place_id_to": 8, "distance_km": 95},   # Udawalawa to Ravana Waterfalls
        {"place_id_from": 41, "place_id_to": 9, "distance_km": 104},  # Udawalawa to Ravana Zipline
        {"place_id_from": 41, "place_id_to": 10, "distance_km": 124}, # Udawalawa to Galle Fort
        {"place_id_from": 41, "place_id_to": 11, "distance_km": 145}, # Udawalawa to Hikkaduwa
        {"place_id_from": 41, "place_id_to": 12, "distance_km": 101}, # Udawalawa to Turtle Beach
        {"place_id_from": 41, "place_id_to": 13, "distance_km": 89},  # Udawalawa to Horton Plains
        {"place_id_from": 41, "place_id_to": 14, "distance_km": 221}, # Udawalawa to World’s End
        {"place_id_from": 41, "place_id_to": 15, "distance_km": 195}, # Udawalawa to Kandy
        {"place_id_from": 41, "place_id_to": 16, "distance_km": 181}, # Udawalawa to Ambuluwawa Tower
        {"place_id_from": 41, "place_id_to": 17, "distance_km": 168}, # Udawalawa to Elephant Orphanage
        {"place_id_from": 41, "place_id_to": 18, "distance_km": 198}, # Udawalawa to Temple of the Tooth Relic
        {"place_id_from": 41, "place_id_to": 19, "distance_km": 190}, # Udawalawa to Royal Botanical Garden
        {"place_id_from": 41, "place_id_to": 20, "distance_km": 145}, # Udawalawa to Kitulgala
        {"place_id_from": 41, "place_id_to": 21, "distance_km": 100}, # Udawalawa to Mirissa
        {"place_id_from": 41, "place_id_to": 22, "distance_km": 262}, # Udawalawa to Negombo
        {"place_id_from": 41, "place_id_to": 23, "distance_km": 129}, # Udawalawa to Nuwara Eliya
        {"place_id_from": 41, "place_id_to": 24, "distance_km": 145}, # Udawalawa to Damro Tea Factory
        {"place_id_from": 41, "place_id_to": 25, "distance_km": 131}, # Udawalawa to Gregory Lake
        {"place_id_from": 41, "place_id_to": 26, "distance_km": 154}, # Udawalawa to Ramboda Falls
        {"place_id_from": 41, "place_id_to": 27, "distance_km": 177}, # Udawalawa to Tea Plantations
        {"place_id_from": 41, "place_id_to": 28, "distance_km": 262}, # Udawalawa to Sigiriya
        {"place_id_from": 41, "place_id_to": 29, "distance_km": 245}, # Udawalawa to Dambulla
        {"place_id_from": 41, "place_id_to": 30, "distance_km": 266}, # Udawalawa to Habarana
        {"place_id_from": 41, "place_id_to": 31, "distance_km": 296}, # Udawalawa to Kawudulla
        {"place_id_from": 41, "place_id_to": 32, "distance_km": 265}, # Udawalawa to Pidurangala
        {"place_id_from": 41, "place_id_to": 33, "distance_km": 284}, # Udawalawa to Minneriya
        {"place_id_from": 41, "place_id_to": 34, "distance_km": 54},  # Udawalawa to Tangalle
        {"place_id_from": 41, "place_id_to": 35, "distance_km": 181}, # Udawalawa to Hiriketiya
        {"place_id_from": 41, "place_id_to": 36, "distance_km": 354}, # Udawalawa to Trincomalee
        {"place_id_from": 41, "place_id_to": 37, "distance_km": 344}, # Udawalawa to Marble Bay
        {"place_id_from": 41, "place_id_to": 38, "distance_km": 358}, # Udawalawa to Maritime & Naval
        {"place_id_from": 41, "place_id_to": 39, "distance_km": 253}, # Udawalawa to Pasikuda
        {"place_id_from": 41, "place_id_to": 40, "distance_km": 360}, # Udawalawa to Thirukoneshwaram Kovil
        {"place_id_from": 41, "place_id_to": 42, "distance_km": 102}, # Udawalawa to Weligama
        {"place_id_from": 41, "place_id_to": 43, "distance_km": 122}, # Udawalawa to Yala
        {"place_id_from": 41, "place_id_to": 44, "distance_km": 118}, # Udawalawa to Adam's Peak
        {"place_id_from": 42, "place_id_to": 1, "distance_km": 148},
        {"place_id_from": 42, "place_id_to": 2, "distance_km": 89},
        {"place_id_from": 42, "place_id_to": 3, "distance_km": 261},
        {"place_id_from": 42, "place_id_to": 4, "distance_km": 328},
        {"place_id_from": 42, "place_id_to": 5, "distance_km": 177},
        {"place_id_from": 42, "place_id_to": 6, "distance_km": 181},
        {"place_id_from": 42, "place_id_to": 7, "distance_km": 180},
        {"place_id_from": 42, "place_id_to": 8, "distance_km": 172},
        {"place_id_from": 42, "place_id_to": 9, "distance_km": 181},
        {"place_id_from": 42, "place_id_to": 10, "distance_km": 34},
        {"place_id_from": 42, "place_id_to": 11, "distance_km": 56},
        {"place_id_from": 42, "place_id_to": 12, "distance_km": 7.1},
        {"place_id_from": 42, "place_id_to": 13, "distance_km": 222},
        {"place_id_from": 42, "place_id_to": 14, "distance_km": 302},
        {"place_id_from": 42, "place_id_to": 15, "distance_km": 240},
        {"place_id_from": 42, "place_id_to": 16, "distance_km": 240},
        {"place_id_from": 42, "place_id_to": 17, "distance_km": 212},
        {"place_id_from": 42, "place_id_to": 18, "distance_km": 243},
        {"place_id_from": 42, "place_id_to": 19, "distance_km": 235},
        {"place_id_from": 42, "place_id_to": 20, "distance_km": 205},
        {"place_id_from": 42, "place_id_to": 21, "distance_km": 8},
        {"place_id_from": 42, "place_id_to": 22, "distance_km": 173},
        {"place_id_from": 42, "place_id_to": 23, "distance_km": 232},
        {"place_id_from": 42, "place_id_to": 24, "distance_km": 248},
        {"place_id_from": 42, "place_id_to": 25, "distance_km": 234},
        {"place_id_from": 42, "place_id_to": 26, "distance_km": 257},
        {"place_id_from": 42, "place_id_to": 27, "distance_km": 254},
        {"place_id_from": 42, "place_id_to": 28, "distance_km": 293},
        {"place_id_from": 42, "place_id_to": 29, "distance_km": 276},
        {"place_id_from": 42, "place_id_to": 30, "distance_km": 298},
        {"place_id_from": 42, "place_id_to": 31, "distance_km": 334},
        {"place_id_from": 42, "place_id_to": 32, "distance_km": 296},
        {"place_id_from": 42, "place_id_to": 33, "distance_km": 323},
        {"place_id_from": 42, "place_id_to": 34, "distance_km": 54},
        {"place_id_from": 42, "place_id_to": 35, "distance_km": 92},
        {"place_id_from": 42, "place_id_to": 36, "distance_km": 382},
        {"place_id_from": 42, "place_id_to": 37, "distance_km": 382},
        {"place_id_from": 42, "place_id_to": 38, "distance_km": 386},
        {"place_id_from": 42, "place_id_to": 39, "distance_km": 334},
        {"place_id_from": 42, "place_id_to": 40, "distance_km": 387},
        {"place_id_from": 42, "place_id_to": 41, "distance_km": 103},
        {"place_id_from": 42, "place_id_to": 43, "distance_km": 130},
        {"place_id_from": 42, "place_id_to": 44, "distance_km": 248},
        {"place_id_from": 43, "place_id_to": 1, "distance_km": 221},  # Yala to Colombo
        {"place_id_from": 43, "place_id_to": 2, "distance_km": 213},  # Yala to Bentota
        {"place_id_from": 43, "place_id_to": 3, "distance_km": 104},  # Yala to Arugam Bay
        {"place_id_from": 43, "place_id_to": 4, "distance_km": 264},  # Yala to Anuradhapura
        {"place_id_from": 43, "place_id_to": 5, "distance_km": 59},   # Yala to Ella
        {"place_id_from": 43, "place_id_to": 6, "distance_km": 62},   # Yala to Little Adam’s Peak
        {"place_id_from": 43, "place_id_to": 7, "distance_km": 64},   # Yala to Nine Arch Bridge
        {"place_id_from": 43, "place_id_to": 8, "distance_km": 107},  # Yala to Ravana Waterfalls
        {"place_id_from": 43, "place_id_to": 9, "distance_km": 62},   # Yala to Ravana Zipline
        {"place_id_from": 43, "place_id_to": 10, "distance_km": 166}, # Yala to Galle Fort
        {"place_id_from": 43, "place_id_to": 11, "distance_km": 183}, # Yala to Hikkaduwa
        {"place_id_from": 43, "place_id_to": 12, "distance_km": 183}, # Yala to Turtle Beach
        {"place_id_from": 43, "place_id_to": 13, "distance_km": 94},  # Yala to Horton Plains
        {"place_id_from": 43, "place_id_to": 14, "distance_km": 154}, # Yala to World’s End (Sri Lanka)
        {"place_id_from": 43, "place_id_to": 15, "distance_km": 183}, # Yala to Kandy
        {"place_id_from": 43, "place_id_to": 16, "distance_km": 178}, # Yala to Ambuluwawa Tower
        {"place_id_from": 43, "place_id_to": 17, "distance_km": 225}, # Yala to Elephant Orphanage
        {"place_id_from": 43, "place_id_to": 18, "distance_km": 185}, # Yala to Temple of the Tooth Relic
        {"place_id_from": 43, "place_id_to": 19, "distance_km": 188}, # Yala to Royal Botanical Garden
        {"place_id_from": 43, "place_id_to": 20, "distance_km": 184}, # Yala to Kitulgala
        {"place_id_from": 43, "place_id_to": 21, "distance_km": 137}, # Yala to Mirissa
        {"place_id_from": 43, "place_id_to": 22, "distance_km": 240}, # Yala to Negombo
        {"place_id_from": 43, "place_id_to": 23, "distance_km": 113}, # Yala to Nuwara Eliya
        {"place_id_from": 43, "place_id_to": 24, "distance_km": 129}, # Yala to Damro Tea Factory
        {"place_id_from": 43, "place_id_to": 25, "distance_km": 115}, # Yala to Gregory Lake
        {"place_id_from": 43, "place_id_to": 26, "distance_km": 141}, # Yala to Ramboda Falls
        {"place_id_from": 43, "place_id_to": 27, "distance_km": 123}, # Yala to Tea Plantations
        {"place_id_from": 43, "place_id_to": 28, "distance_km": 212}, # Yala to Sigiriya
        {"place_id_from": 43, "place_id_to": 29, "distance_km": 200}, # Yala to Dambulla
        {"place_id_from": 43, "place_id_to": 30, "distance_km": 221}, # Yala to Habarana
        {"place_id_from": 43, "place_id_to": 31, "distance_km": 219}, # Yala to Kawudulla
        {"place_id_from": 43, "place_id_to": 32, "distance_km": 215}, # Yala to Pidurangala
        {"place_id_from": 43, "place_id_to": 33, "distance_km": 210}, # Yala to Minneriya
        {"place_id_from": 43, "place_id_to": 34, "distance_km": 88},  # Yala to Tangalle
        {"place_id_from": 43, "place_id_to": 35, "distance_km": 195}, # Yala to Hiriketiya
        {"place_id_from": 43, "place_id_to": 36, "distance_km": 289}, # Yala to Trincomalee
        {"place_id_from": 43, "place_id_to": 37, "distance_km": 270}, # Yala to Marble Bay
        {"place_id_from": 43, "place_id_to": 38, "distance_km": 284}, # Yala to Maritime & Naval History Museum
        {"place_id_from": 43, "place_id_to": 39, "distance_km": 179}, # Yala to Pasikuda
        {"place_id_from": 43, "place_id_to": 40, "distance_km": 286}, # Yala to ThiruKoneshwaram Kovil
        {"place_id_from": 43, "place_id_to": 41, "distance_km": 74},  # Yala to Udawalawa
        {"place_id_from": 43, "place_id_to": 42, "distance_km": 140}, # Yala to Weligama
        {"place_id_from": 43, "place_id_to": 44, "distance_km": 151}, # Yala to Adam’s Peak
        {"place_id_from": 44, "place_id_to": 1, "distance_km": 128},  # Adam's Peak to Colombo
        {"place_id_from": 44, "place_id_to": 2, "distance_km": 179},  # Adam's Peak to Bentota
        {"place_id_from": 44, "place_id_to": 3, "distance_km": 253},  # Adam's Peak to Arugam Bay
        {"place_id_from": 44, "place_id_to": 4, "distance_km": 243},  # Adam's Peak to Anuradhapura
        {"place_id_from": 44, "place_id_to": 5, "distance_km": 125},  # Adam's Peak to Ella
        {"place_id_from": 44, "place_id_to": 6, "distance_km": 126},  # Adam's Peak to Little Adam's Peak
        {"place_id_from": 44, "place_id_to": 7, "distance_km": 125},  # Adam's Peak to Nine Arch Bridge
        {"place_id_from": 44, "place_id_to": 8, "distance_km": 129},  # Adam's Peak to Ravana Waterfalls
        {"place_id_from": 44, "place_id_to": 9, "distance_km": 125},  # Adam's Peak to Ravana Zipline
        {"place_id_from": 44, "place_id_to": 10, "distance_km": 223},  # Adam's Peak to Galle Fort
        {"place_id_from": 44, "place_id_to": 11, "distance_km": 213},  # Adam's Peak to Hikkaduwa
        {"place_id_from": 44, "place_id_to": 12, "distance_km": 215},  # Adam's Peak to Turtle Beach
        {"place_id_from": 44, "place_id_to": 13, "distance_km": 90},   # Adam's Peak to Horton Plains
        {"place_id_from": 44, "place_id_to": 14, "distance_km": 135},  # Adam's Peak to World’s End
        {"place_id_from": 44, "place_id_to": 15, "distance_km": 87},   # Adam's Peak to Kandy
        {"place_id_from": 44, "place_id_to": 16, "distance_km": 73},   # Adam's Peak to Ambuluwawa Tower
        {"place_id_from": 44, "place_id_to": 17, "distance_km": 109},  # Adam's Peak to Elephant Orphanage
        {"place_id_from": 44, "place_id_to": 18, "distance_km": 91},   # Adam's Peak to Temple of the Tooth Relic
        {"place_id_from": 44, "place_id_to": 19, "distance_km": 82},   # Adam's Peak to Royal Botanical Garden
        {"place_id_from": 44, "place_id_to": 20, "distance_km": 43},   # Adam's Peak to Kitulgala
        {"place_id_from": 44, "place_id_to": 21, "distance_km": 215},  # Adam's Peak to Mirissa
        {"place_id_from": 44, "place_id_to": 22, "distance_km": 141},  # Adam's Peak to Negombo
        {"place_id_from": 44, "place_id_to": 23, "distance_km": 72},   # Adam's Peak to Nuwara Eliya
        {"place_id_from": 44, "place_id_to": 24, "distance_km": 82},   # Adam's Peak to Damro Tea Factory
        {"place_id_from": 44, "place_id_to": 25, "distance_km": 70},   # Adam's Peak to Gregory Lake
        {"place_id_from": 44, "place_id_to": 26, "distance_km": 84},   # Adam's Peak to Ramboda Falls
        {"place_id_from": 44, "place_id_to": 27, "distance_km": 87},   # Adam's Peak to Tea Plantations
        {"place_id_from": 44, "place_id_to": 28, "distance_km": 176},  # Adam's Peak to Sigiriya
        {"place_id_from": 44, "place_id_to": 29, "distance_km": 159},  # Adam's Peak to Dambulla
        {"place_id_from": 44, "place_id_to": 30, "distance_km": 181},  # Adam's Peak to Habarana
        {"place_id_from": 44, "place_id_to": 31, "distance_km": 209},  # Adam's Peak to Kawudulla
        {"place_id_from": 44, "place_id_to": 32, "distance_km": 179},  # Adam's Peak to Pidurangala
        {"place_id_from": 44, "place_id_to": 33, "distance_km": 206},  # Adam's Peak to Minneriya
        {"place_id_from": 44, "place_id_to": 34, "distance_km": 169},  # Adam's Peak to Tangalle
        {"place_id_from": 44, "place_id_to": 35, "distance_km": 145},  # Adam's Peak to Hiriketiya
        {"place_id_from": 44, "place_id_to": 36, "distance_km": 265},  # Adam's Peak to Trincomalee
        {"place_id_from": 44, "place_id_to": 37, "distance_km": 265},  # Adam's Peak to Marble Bay
        {"place_id_from": 44, "place_id_to": 38, "distance_km": 269},  # Adam's Peak to Maritime & Naval History Museum
        {"place_id_from": 44, "place_id_to": 39, "distance_km": 271},  # Adam's Peak to Pasikuda
        {"place_id_from": 44, "place_id_to": 40, "distance_km": 270},  # Adam's Peak to ThiruKoneshwaram Kovil
        {"place_id_from": 44, "place_id_to": 41, "distance_km": 123},  # Adam's Peak to Udawalawa
        {"place_id_from": 44, "place_id_to": 42, "distance_km": 242},  # Adam's Peak to Weligama
        {"place_id_from": 44, "place_id_to": 43, "distance_km": 128},  # Adam's Peak to Yala

    ]
    
    if __name__ == "__main__":

        # Check if running as a script with command-line arguments (from Node.js)
        if len(sys.argv) > 1:
            # Parse input from Node.js
            params = json.loads(sys.argv[1])

        result = generate_travel_itinerary(location_data, distance_data, params)
        print(json.dumps(result))