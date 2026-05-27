from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math

# NLP imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="EventHub Feed Ranking API", version="1.0.0")

# -------- CORS (allow React dev server) --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Data Models --------
class Post(BaseModel):
    id: str = ""
    likes: int
    comments: int
    shares: int
    hours: float
    category: str
    hashtags: list[str]

class User(BaseModel):
    interests: list[str]

class FeedRequest(BaseModel):
    user: User
    posts: list[Post]

# -------- 1. Engagement Score --------
def engagement_score(likes, comments, shares, hours):
    raw = (likes + comments * 2 + shares * 3) * math.exp(-hours / 24)
    return min(raw / 100, 1.0)  # normalized, capped at 1.0

# -------- 2. Interest-Based Score (Relevance) --------
def interest_score(user_interests, category, hashtags):
    score = 0
    if category.lower() in [i.lower() for i in user_interests]:
        score += 2
    score += len(set([i.lower() for i in user_interests]).intersection(
                set([h.lower() for h in hashtags])))
    return min(score / 5, 1.0)  # normalized, capped at 1.0

# -------- 3. Collaborative Filtering --------
def collaborative_score(user, post_category, all_users):
    similar_users = []
    for other in all_users:
        similarity = len(set(user["interests"]).intersection(set(other["interests"])))
        if similarity > 0:
            similar_users.append(other)

    if not similar_users:
        return 0

    liked_count = sum(1 for u in similar_users if post_category in u["liked_categories"])
    return liked_count / len(similar_users)

# -------- 4. Content Similarity (NLP / TF-IDF) --------
def content_score(post_text, history_texts):
    if not history_texts:
        return 0
    docs = history_texts + [post_text]
    try:
        vectorizer = TfidfVectorizer()
        tfidf = vectorizer.fit_transform(docs)
        sim = cosine_similarity(tfidf[-1], tfidf[:-1])
        return float(sim.mean())
    except Exception:
        return 0

# -------- 5. Diversity Score --------
def diversity_score(post_category, shown_categories):
    if post_category in shown_categories:
        return 0.2
    return 1.0

# -------- Final Combined Score --------
def combined_score(e, r, c, cs, d):
    return (
        e  * 0.30 +
        r  * 0.25 +
        c  * 0.20 +
        cs * 0.15 +
        d  * 0.10
    )

# -------- Root --------
@app.get("/")
def home():
    return {
        "message": "EventHub Feed Ranking API is running",
        "algorithms": ["Engagement", "Interest-Based", "Collaborative Filtering", "Content Similarity (TF-IDF)", "Diversity"],
        "version": "1.0.0"
    }

# -------- Health Check --------
@app.get("/health")
def health():
    return {"status": "ok"}

# -------- Ranking Endpoint --------
@app.post("/rank-feed")
def rank_feed(data: FeedRequest):
    # Simulated user pool for collaborative filtering
    all_users = [
        {"id": 1, "interests": ["tech", "ai"],      "liked_categories": ["tech", "ai"]},
        {"id": 2, "interests": ["travel", "food"],   "liked_categories": ["travel"]},
        {"id": 3, "interests": ["ai", "science"],    "liked_categories": ["tech", "science"]},
        {"id": 4, "interests": ["sports", "health"], "liked_categories": ["sports"]},
        {"id": 5, "interests": ["design", "tech"],   "liked_categories": ["design", "tech"]},
    ]

    user = {"interests": [i.lower() for i in data.user.interests]}

    # Simulated reading history for NLP content similarity
    history_texts = [
        "AI is transforming technology and machine learning",
        "Latest innovations in tech startups",
        "Deep learning neural networks research",
        "Social events networking professional development",
    ]

    shown_categories = []
    ranked = []

    for post in data.posts:
        e  = engagement_score(post.likes, post.comments, post.shares, post.hours)
        r  = interest_score(data.user.interests, post.category, post.hashtags)
        c  = collaborative_score(user, post.category.lower(), all_users)
        text = post.category + " " + " ".join(post.hashtags)
        cs = content_score(text, history_texts)
        d  = diversity_score(post.category, shown_categories)

        final = combined_score(e, r, c, cs, d)
        shown_categories.append(post.category)

        ranked.append({
            "id": post.id,
            "scores": {
                "engagement":    round(e,  4),
                "relevance":     round(r,  4),
                "collaborative": round(c,  4),
                "content_sim":   round(cs, 4),
                "diversity":     round(d,  4),
                "final":         round(final, 4),
            }
        })

    ranked.sort(key=lambda x: x["scores"]["final"], reverse=True)
    return ranked
