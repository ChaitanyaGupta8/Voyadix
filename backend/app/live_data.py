import requests
import pandas as pd
import math

class LiveDataManager:
    def __init__(self):
        self.headers = {
            'User-Agent': 'AITravelConciergeProductEngine/12.0 (contact@itineraryworkspace.com)'
        }
        self.api_url = "https://en.wikipedia.org/w/api.php"

    @staticmethod
    def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates the exact distance in kilometers between two points on the Earth's surface.
        This is the ultimate fail-safe against text-search geographical hallucinations.
        """
        R = 6371.0 # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2)**2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    def get_city_center(self, city_name: str) -> tuple:
        search_params = {
            "action": "query",
            "list": "search",
            "srsearch": city_name,
            "srlimit": 5,
            "format": "json"
        }
        
        search_response = requests.get(self.api_url, params=search_params, headers=self.headers)
        search_response.raise_for_status()
        search_results = search_response.json().get("query", {}).get("search", [])
        
        if not search_results:
            raise ValueError(f"No search results found on Wikipedia for '{city_name}'.")
            
        page_ids = [str(item["pageid"]) for item in search_results]

        coord_params = {
            "action": "query",
            "prop": "coordinates",
            "pageids": "|".join(page_ids),
            "format": "json"
        }
        
        coord_response = requests.get(self.api_url, params=coord_params, headers=self.headers)
        coord_response.raise_for_status()
        pages = coord_response.json().get("query", {}).get("pages", {})
        
        for item in search_results:
            pid = str(item["pageid"])
            page_info = pages.get(pid, {})
            if "coordinates" in page_info and page_info["coordinates"]:
                coords = page_info["coordinates"][0]
                return coords["lat"], coords["lon"]
                
        raise ValueError(f"Wikipedia pages found for '{city_name}', but none contain geographical coordinates.")

    # def fetch_live_pois_by_city(self, city_name: str, duration_days: int = 2) -> pd.DataFrame:
    #     try:
    #         city_lat, city_lon = self.get_city_center(city_name)
    #     except Exception as e:
    #         print(f"City center resolution failed: {str(e)}")
    #         return pd.DataFrame()

    #     # 1. Broad Semantic Seed (Targeting Master Brands explicitly)
    #     seed_params = {
    #         "action": "query",
    #         "list": "search",
    #         "srsearch": f"intitle:{city_name} AND (landmark OR attraction OR museum OR monument)",
    #         "srlimit": 30,
    #         "format": "json"
    #     }
    #     seed_response = requests.get(self.api_url, params=seed_params, headers=self.headers)
    #     seed_results = seed_response.json().get("query", {}).get("search", [])
    #     seed_ids = [str(item["pageid"]) for item in seed_results]

    #     # 2. Expanded Geospatial Sweep
    #     geo_params = {
    #         "action": "query",
    #         "list": "geosearch",
    #         "gscoord": f"{city_lat}|{city_lon}",
    #         "gsradius": 10000, 
    #         "gslimit": 300, 
    #         "format": "json"
    #     }
    #     geo_response = requests.get(self.api_url, params=geo_params, headers=self.headers)
    #     places = geo_response.json().get("query", {}).get("geosearch", [])
    #     geo_ids = [str(p["pageid"]) for p in places]

    #     all_page_ids = list(set(seed_ids + geo_ids))
    #     if not all_page_ids:
    #         return pd.DataFrame()

    #     # 3. Micro-ruins and minor infrastructure blacklist
    #     noise_blacklist = [
    #         'history of', 'geography of', 'demographics', 'railway station', 'airport', 
    #         'district', 'township', 'lacus', 'regia', 'altar', 'stairs', 'rostra', 
    #         'umbilicus', 'vulcanal', 'column of', 'arch of', 'inscription', 'excavations',
    #         'house of the', 'curia', 'elagabalium', 'juturnae', 'cordonata', 'statue of'
    #     ]

    #     parsed_data = []
    #     chunk_size = 50
        
    #     for i in range(0, len(all_page_ids), chunk_size):
    #         chunk = all_page_ids[i:i + chunk_size]
            
    #         detail_params = {
    #             "action": "query",
    #             "prop": "description|coordinates|pageviews|pageimages",
    #             "piprop": "thumbnail",                                  # <-- Request thumbnail
    #             "pithumbsize": 400,
    #             "pageids": "|".join(chunk),
    #             "format": "json"
    #         }
            
    #         detail_response = requests.get(self.api_url, params=detail_params, headers=self.headers)
    #         pages_data = detail_response.json().get("query", {}).get("pages", {})

    #         for pid, page in pages_data.items():
    #             title = page.get("title")
    #             coords = page.get("coordinates", [{}])
    #             if not coords or not coords[0]:
    #                 continue
                    
    #             plat = coords[0].get("lat")
    #             plon = coords[0].get("lon")
                
    #             if not plat or not plon:
    #                 continue

    #             # =========================================================
    #             # THE HAVERSINE KILL SWITCH
    #             # If Wikipedia hallucinated a location outside a 15km radius (like NY or Liverpool), destroy it.
    #             # =========================================================
    #             distance_from_center = self.calculate_haversine_distance(city_lat, city_lon, plat, plon)
    #             if distance_from_center > 15.0:
    #                 continue 
    #             # =========================================================
                
    #             if any(word in title.lower() for word in noise_blacklist):
    #                 continue

    #             category = "culture"
    #             title_lower = title.lower()
    #             if any(w in title_lower for w in ['temple', 'mosque', 'church', 'fort', 'tomb', 'palace', 'monument', 'museum', 'colosseum', 'pantheon', 'basilica', 'fountain', 'piazza', 'vatican', 'gallery']):
    #                 category = "history"
    #             elif any(w in title_lower for w in ['park', 'garden', 'lake', 'beach', 'valley', 'waterfall', 'mountain', 'river', 'hills']):
    #                 category = "nature"

    #             pageviews = page.get("pageviews", {})
    #             valid_views = [v for v in pageviews.values() if isinstance(v, int)]
                
    #             # Boost major international traffic artificially to guarantee master brands win
    #             base_fame = sum(valid_views) if valid_views else 0
    #             if any(w in title_lower for w in ['colosseum', 'pantheon', 'trevi', 'vatican', 'burj', 'taj mahal']):
    #                 base_fame *= 10 

    #             # 2. EXTRACT THE IMAGE URL (Fallback to a null string if no image exists)
    #             image_url = ""
    #             if "thumbnail" in page:
    #                 image_url = page["thumbnail"].get("source", "")

    #             parsed_data.append({
    #                 'poi_id': pid,
    #                 'name': title,
    #                 'latitude': plat,
    #                 'longitude': plon,
    #                 'category': category,
    #                 'description': page.get("description", f"Major landmark: {title}."),
    #                 'fame_score': base_fame,
    #                 'image_url': image_url,
    #                 'opening_hour': 9,
    #                 'closing_hour': 18,
    #                 'average_cost': 0.0
    #             })
                
    #     df = pd.DataFrame(parsed_data)
        
    #     if not df.empty:
    #         df = df.sort_values(by="fame_score", ascending=False)
    #         top_limit = max(20, duration_days * 6)
    #         df = df.head(top_limit)
            
    #     return df

    def fetch_live_pois_by_city(self, city_name: str, duration_days: int = 2) -> pd.DataFrame:
        try:
            city_lat, city_lon = self.get_city_center(city_name)
        except Exception as e:
            print(f"City center resolution failed: {str(e)}")
            return pd.DataFrame()

        # --- THE FIX: DYNAMIC GEOSPATIAL SCALE ---
        # Detect if searching for known large islands, states, or regional provinces
        regional_keywords = ['bali', 'wyoming', 'hawaii', 'goa', 'phuket', 'ibiza', 'okinawa']
        is_regional = any(keyword in city_name.lower() for keyword in regional_keywords)
        
        # Expand bounds if it's a massive island or region instead of a compact city center
        search_radius = 50000 if is_regional else 10000  # 50km vs 10km
        kill_switch_radius = 60.0 if is_regional else 15.0  # 60km vs 15km
        print(f" Using search radius: {search_radius}m and kill-switch: {kill_switch_radius}km")
        # -----------------------------------------

        # 1. Broad Semantic Seed (Targeting Master Brands explicitly)
        seed_params = {
            "action": "query",
            "list": "search",
            "srsearch": f"intitle:{city_name} AND (landmark OR attraction OR museum OR monument OR temple OR beach)",
            "srlimit": 40,
            "format": "json"
        }
        seed_response = requests.get(self.api_url, params=seed_params, headers=self.headers)
        seed_results = seed_response.json().get("query", {}).get("search", [])
        seed_ids = [str(item["pageid"]) for item in seed_results]

        # 2. Expanded Geospatial Sweep (Using dynamic search_radius)
        geo_params = {
            "action": "query",
            "list": "geosearch",
            "gscoord": f"{city_lat}|{city_lon}",
            "gsradius": search_radius, 
            "gslimit": 300, 
            "format": "json"
        }
        geo_response = requests.get(self.api_url, params=geo_params, headers=self.headers)
        places = geo_response.json().get("query", {}).get("geosearch", [])
        geo_ids = [str(p["pageid"]) for p in places]

        all_page_ids = list(set(seed_ids + geo_ids))
        if not all_page_ids:
            return pd.DataFrame()

        # 3. Micro-ruins and minor infrastructure blacklist
        noise_blacklist = [
            'history of', 'geography of', 'demographics', 'railway station', 'airport', 
            'district', 'township', 'lacus', 'regia', 'altar', 'stairs', 'rostra', 
            'umbilicus', 'vulcanal', 'column of', 'arch of', 'inscription', 'excavations',
            'house of the', 'curia', 'elagabalium', 'juturnae', 'cordonata', 'statue of'
        ]

        parsed_data = []
        chunk_size = 50
        
        for i in range(0, len(all_page_ids), chunk_size):
            chunk = all_page_ids[i:i + chunk_size]
            
            detail_params = {
                "action": "query",
                "prop": "description|coordinates|pageviews|pageimages",
                "piprop": "thumbnail",
                "pithumbsize": 400,
                "pageids": "|".join(chunk),
                "format": "json"
            }
            
            detail_response = requests.get(self.api_url, params=detail_params, headers=self.headers)
            pages_data = detail_response.json().get("query", {}).get("pages", {})

            for pid, page in pages_data.items():
                title = page.get("title")
                coords = page.get("coordinates", [{}])
                if not coords or not coords[0]:
                    continue
                    
                plat = coords[0].get("lat")
                plon = coords[0].get("lon")
                
                if not plat or not plon:
                    continue

                # =========================================================
                # THE DYNAMIC HAVERSINE KILL SWITCH
                # Evaluates against our context-aware distance bounding box
                # =========================================================
                distance_from_center = self.calculate_haversine_distance(city_lat, city_lon, plat, plon)
                if distance_from_center > kill_switch_radius:
                    continue 
                # =========================================================

                if title.lower() == city_name.lower():  # fix to avoid getting same city name as recommendation 
                    continue
                
                if any(word in title.lower() for word in noise_blacklist):
                    continue

                category = "culture"
                title_lower = title.lower()
                if any(w in title_lower for w in ['temple', 'mosque', 'church', 'fort', 'tomb', 'palace', 'monument', 'museum', 'colosseum', 'pantheon', 'basilica', 'fountain', 'piazza', 'vatican', 'gallery']):
                    category = "history"
                elif any(w in title_lower for w in ['park', 'garden', 'lake', 'beach', 'valley', 'waterfall', 'mountain', 'river', 'hills', 'sanctuary', 'cliff']):
                    category = "nature"

                pageviews = page.get("pageviews", {})
                valid_views = [v for v in pageviews.values() if isinstance(v, int)]
                
                base_fame = sum(valid_views) if valid_views else 0
                # Artificial ranking boost for prominent spots
                if any(w in title_lower for w in ['colosseum', 'pantheon', 'trevi', 'vatican', 'burj', 'taj mahal', 'ubud', 'uluwatu', 'tanah lot']):
                    base_fame *= 10 

                image_url = ""
                if "thumbnail" in page:
                    image_url = page["thumbnail"].get("source", "")

                parsed_data.append({
                    'poi_id': pid,
                    'name': title,
                    'latitude': plat,
                    'longitude': plon,
                    'category': category,
                    'description': page.get("description", f"Major landmark: {title}."),
                    'fame_score': base_fame,
                    'image_url': image_url,
                    'opening_hour': 9,
                    'closing_hour': 18,
                    'average_cost': 0.0
                })
                
        df = pd.DataFrame(parsed_data)
        
        if not df.empty:
            df = df.sort_values(by="fame_score", ascending=False)
            top_limit = max(20, duration_days * 6)
            df = df.head(top_limit)
            
        return df