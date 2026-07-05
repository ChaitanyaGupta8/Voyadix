import pandas as pd
import numpy as np

class ItineraryOptimizer:
    def __init__(self):
        pass

    def generate_plan(self, recommended_pois: pd.DataFrame, duration_days: int) -> dict:
        """
        Groups POIs into separate days and sequences them efficiently.
        """
        if recommended_pois.empty:
            return {}

        # Convert our POI DataFrame into a list of dictionaries for row manipulation
        pois = recommended_pois.to_dict(orient='records')
        
        # Limit our maximum stops to fit a realistic schedule (e.g., max 3 stops per day)
        max_stops = duration_days * 3
        pois = pois[:max_stops]

        #  Assign POIs to days using basic spatial grouping
        # Sort by latitude so locations close to each other North/South get grouped together
        pois = sorted(pois, key=lambda x: x['latitude'])
        
        itinerary = {}
        for day in range(1, duration_days + 1):
            itinerary[f"Day {day}"] = []

        # Distribute the grouped locations evenly across our available days
        for idx, poi in enumerate(pois):
            assigned_day = (idx % duration_days) + 1
            itinerary[f"Day {assigned_day}"].append(poi)

        # Optimize the sequence within each day (Greedy Routing Heuristic)
        for day, day_pois in itinerary.items():
            if not day_pois:
                continue
                
            optimized_route = []
            # Start the day at the first location in the sub-cluster
            current_poi = day_pois.pop(0)
            current_time = max(9, current_poi['opening_hour']) # Start the day at 9 AM or opening hour
            
            current_poi['scheduled_time'] = f"{int(current_time)}:00"
            optimized_route.append(current_poi)

            # Find the nearest remaining location for the current day
            while day_pois:
                # Calculate Euclidean distance to all other remaining stops for this day
                distances = []
                for candidate in day_pois:
                    dist = np.sqrt(
                        (current_poi['latitude'] - candidate['latitude'])**2 + 
                        (current_poi['longitude'] - candidate['longitude'])**2
                    )
                    distances.append((dist, candidate))
                
                # Sort by distance (closest first)
                distances.sort(key=lambda x: x[0])
                _, next_poi = distances[0]
                
                # Remove from remaining pool and update clock
                day_pois.remove(next_poi)
                current_time += 2.0  # Assume 2 hours spent visiting the previous location
                current_time += 0.5  # Assume 30 mins average transit overhead
                
                # Attach timing details to the itinerary dictionary
                next_poi['scheduled_time'] = f"{int(current_time)}:00"
                optimized_route.append(next_poi)
                current_poi = next_poi
                
            itinerary[day] = optimized_route

        return itinerary

if __name__ == "__main__":
    from recommender import POIRecommender
    import os

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'points_of_interest.csv')
    
    recommender = POIRecommender(data_path)
    optimizer = ItineraryOptimizer()
    
    # Get top 6 matches for history
    top_matches = recommender.recommend(query="history temple culture", max_budget=100.0, top_n=6)
    
    print("--- Executing Routing Algorithm (2-Day Split) ---")
    final_itinerary = optimizer.generate_plan(top_matches, duration_days=2)
    
    for day, slots in final_itinerary.items():
        print(f"\n===== {day} =====")
        for spot in slots:
            print(f"[{spot['scheduled_time']}] {spot['name']} (Lat: {spot['latitude']:.3f}, Lon: {spot['longitude']:.3f})")