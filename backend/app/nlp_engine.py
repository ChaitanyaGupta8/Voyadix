import spacy
from spacy.matcher import PhraseMatcher

class TRIPLinguist:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        
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
            "destination": "Tokyo",    
            "duration_days": 1,      
            "max_budget": None,       
            "search_query": "",       
            "detected_categories": set()
        }

        for ent in doc.ents:

            if ent.label_ in ["GPE", "LOC"]: 
                extracted_data["destination"] = ent.text.title()
                
            elif ent.label_ == "MONEY": 
                clean_money = "".join([c for c in ent.text if c.isdigit() or c == '.'])
                if clean_money:
                    extracted_data["max_budget"] = float(clean_money)

            elif ent.label_ in ["DATE", "CARDINAL"]:
                if "day" in ent.text.lower():
                    clean_days = "".join([c for c in ent.text if c.isdigit()])
                    if clean_days:
                        extracted_data["duration_days"] = int(clean_days)

        matches = self.matcher(doc)
        for match_id, start, end in matches:
            category_label = self.nlp.vocab.strings[match_id]
            extracted_data["detected_categories"].add(category_label)

        extracted_data["detected_categories"] = list(extracted_data["detected_categories"])

        extracted_data["search_query"] = " ".join(extracted_data["detected_categories"])
        
        if not extracted_data["search_query"]:
            important_words = [token.text for token in doc if token.pos_ in ["NOUN", "ADJ"]]
            extracted_data["search_query"] = " ".join(important_words)

        return extracted_data

if __name__ == "__main__":
    linguist = TRIPLinguist()
    
    test_phrase = "I want a 3 days vacation. I highly prefer ancient temples and historical culture, keep the budget under 50 dollars."
    
    print("--- Parsing Input Sentence ---")
    print(f"User Said: \"{test_phrase}\"\n")
    
    parsed_json = linguist.extract_constraints(test_phrase)
    
    print("--- Extracted JSON Parameters ---")
    for key, value in parsed_json.items():
        print(f"{key}: {value}")