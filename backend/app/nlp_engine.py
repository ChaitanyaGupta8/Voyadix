import spacy
from spacy.matcher import PhraseMatcher

class TRIPLinguist:
    def __init__(self):
        # Load the lightweight English NLP model we downloaded
        self.nlp = spacy.load("en_core_web_sm")
        
        # Initialize phrase matchers for category detection
        self.matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        self._setup_category_keywords()

    def _setup_category_keywords(self):
        """Defines keyword buckets to map raw text onto our dataset categories."""
        keywords = {
            "history": ["temple", "shrine", "historic", "ancient", "culture"],
            "nature": ["garden", "park", "nature", "forest", "peaceful", "relaxation"],
            "modern": ["skyscrapers", "skyline", "modern", "futuristic", "tower"],
            "nightlife": ["nightlife", "bars", "clubs", "entertainment", "neon"]
        }
        
        # Register these patterns into spaCy's fast matching engine
        for category, phrases in keywords.items():
            patterns = [self.nlp.make_doc(text) for text in phrases]
            self.matcher.add(category, patterns)

    def extract_constraints(self, user_prompt: str) -> dict:
        """
        Parses a natural language string and extracts structured system parameters.
        """
        #doc = self.nlp(user_prompt)

        doc = self.nlp(user_prompt.title())
        
        # Default fallback values
        extracted_data = {
            "destination": "Tokyo",        # this is default city , just in case
            "duration_days": 1,        # Default to 1 day if not found
            "max_budget": None,        # No budget limit default
            "search_query": "",        # Extracted keyword soup for recommender
            "detected_categories": set()
        }

        # 1. Extract Entities using spaCy's built-in NER
        # for ent in doc.ents:
        #     # 
        #     # <--- ADD THIS ELIF BLOCK  -> for taing this project gloabl--->
        #     if ent.label_ == "GPE": 
        #         # GPE stands for Geopolitical Entity (Cities, Countries, States)
        #         extracted_data["destination"] = ent.text
        #     # <--------------------------->
        #     # Look for monetary constraints (e.g., "$50", "100 dollars")
        #     if ent.label_ == "MONEY":
        #         # Clean up string tokens to extract numeric value
        #         clean_money = "".join([c for c in ent.text if c.isdigit() or c == '.'])
        #         if clean_money:
        #             extracted_data["max_budget"] = float(clean_money)
            
        #     # Look for trip durations (e.g., "3 days", "4-day trip")
        #     elif ent.label_ in ["DATE", "CARDINAL"]:
        #         if "day" in ent.text.lower():
        #             clean_days = "".join([c for c in ent.text if c.isdigit()])
        #             if clean_days:
        #                 extracted_data["duration_days"] = int(clean_days)

        # 1. Extract Entities using spaCy's built-in NER
        for ent in doc.ents:
            
            # THE FIX: Broaden the spatial net to catch both GPEs and LOCs
            if ent.label_ in ["GPE", "LOC"]: 
                # GPE = Cities/States/Countries. LOC = Islands/Regions/Natural Features.
                extracted_data["destination"] = ent.text.title()
                
            # Look for monetary constraints (e.g., "$50", "100 dollars")
            elif ent.label_ == "MONEY": # Changed to elif for cleaner logic
                # Clean up string tokens to extract numeric value
                clean_money = "".join([c for c in ent.text if c.isdigit() or c == '.'])
                if clean_money:
                    extracted_data["max_budget"] = float(clean_money)
            
            # Look for trip durations (e.g., "3 days", "4-day trip")
            elif ent.label_ in ["DATE", "CARDINAL"]:
                if "day" in ent.text.lower():
                    clean_days = "".join([c for c in ent.text if c.isdigit()])
                    if clean_days:
                        extracted_data["duration_days"] = int(clean_days)

        # 2. Extract Custom Categories using our Phrase Matcher
        matches = self.matcher(doc)
        for match_id, start, end in matches:
            category_label = self.nlp.vocab.strings[match_id]
            extracted_data["detected_categories"].add(category_label)

        # Convert set to a standard list for JSON compatibility
        extracted_data["detected_categories"] = list(extracted_data["detected_categories"])

        # 3. Formulate the clean fallback query string for our vector engine
        # We combine any identified category keywords to feed into the TF-IDF calculator
        extracted_data["search_query"] = " ".join(extracted_data["detected_categories"])
        
        # If no specific categories were found, fall back to the raw nouns/adjectives in the text
        if not extracted_data["search_query"]:
            important_words = [token.text for token in doc if token.pos_ in ["NOUN", "ADJ"]]
            extracted_data["search_query"] = " ".join(important_words)

        return extracted_data

# Unit testing block to verify our string transformations work perfectly
if __name__ == "__main__":
    linguist = TRIPLinguist()
    
    test_phrase = "I want a 3 days vacation. I highly prefer ancient temples and historical culture, keep the budget under 50 dollars."
    
    print("--- Parsing Input Sentence ---")
    print(f"User Said: \"{test_phrase}\"\n")
    
    parsed_json = linguist.extract_constraints(test_phrase)
    
    print("--- Extracted JSON Parameters ---")
    for key, value in parsed_json.items():
        print(f"{key}: {value}")