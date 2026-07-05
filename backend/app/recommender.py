
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class DynamicPOIRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def fit_and_recommend(self, df: pd.DataFrame, query: str, max_budget: float = None, top_n: int = 5) -> pd.DataFrame:
        """
        Dynamically vectorizes the live dataframe and calculates cosine similarity.
        """
        if df.empty:
            return pd.DataFrame()

        #  Combine category and description for the live data
        df['metadata_soup'] = df['category'] + " " + df['description']
        
        #  Fit the TF-IDF matrix on the fly
        tfidf_matrix = self.vectorizer.fit_transform(df['metadata_soup'])

        #  Vectorize user query and score
        query_vector = self.vectorizer.transform([query])
        similarity_scores = cosine_similarity(query_vector, tfidf_matrix).flatten()

        #  Rank and filter
        df['similarity_score'] = similarity_scores
        
        if max_budget is not None:
            df = df[df['average_cost'] <= max_budget]

        ranked_df = df.sort_values(by='similarity_score', ascending=False)
        return ranked_df.head(top_n)