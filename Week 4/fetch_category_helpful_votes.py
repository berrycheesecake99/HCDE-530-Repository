import csv
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

API_URL = "https://hcde530-week4-api.onrender.com/reviews"
TARGET_CATEGORIES = ("field research", "usability testing")
OUTPUT_CSV = Path(__file__).with_name("top_ratings_field_usability.csv")


def fetch_json(url):
    """Fetch and decode JSON from a URL."""
    with urlopen(url) as response:
        data = response.read().decode("utf-8")
        return json.loads(data)


def fetch_all_reviews(page_size=100):
    """Fetch all review records from the paginated API."""
    offset = 0
    reviews = []

    while True:
        params = urlencode({"limit": page_size, "offset": offset})
        payload = fetch_json(f"{API_URL}?{params}")
        batch = payload.get("reviews", [])
        if not batch:
            break

        reviews.extend(batch)
        offset += len(batch)

        if len(batch) < page_size:
            break

    return reviews


def parse_int(value, default=0):
    """Safely parse an integer from API values."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def extract_top_rated_rows(records):
    """Extract top-rated rows for target categories."""
    category_max_ratings = {category: None for category in TARGET_CATEGORIES}
    filtered_records = []

    for item in records or []:
        if not isinstance(item, dict):
            continue

        category = str(item.get("category", "")).strip().lower()
        if category not in TARGET_CATEGORIES:
            continue

        rating = parse_int(item.get("rating"))
        filtered_records.append(item)

        previous_max = category_max_ratings[category]
        if previous_max is None or rating > previous_max:
            category_max_ratings[category] = rating

    rows = []
    for item in filtered_records:
        category = str(item.get("category", "")).strip().lower()
        rating = parse_int(item.get("rating"))
        if rating != category_max_ratings.get(category):
            continue

        rows.append(
            {
                "review_id": parse_int(item.get("id")),
                "app": str(item.get("app", "")).strip(),
                "category": category,
                "rating": rating,
                "helpful_votes": parse_int(item.get("helpful_votes")),
            }
        )

    return rows


def write_csv(rows, filename):
    """Write extracted rows to CSV."""
    fieldnames = ["review_id", "app", "category", "rating", "helpful_votes"]
    with open(filename, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    try:
        reviews = fetch_all_reviews()
    except (HTTPError, URLError, json.JSONDecodeError) as error:
        print(f"Could not fetch data from API: {error}")
        return

    rows = extract_top_rated_rows(reviews)
    if not rows:
        print("No top-rated rows found for field research/usability testing.")
        return

    for row in rows:
        print(
            f"Category: {row['category']} | Top rating: {row['rating']} "
            f"| Helpful votes: {row['helpful_votes']}"
        )

    write_csv(rows, OUTPUT_CSV)
    print(f"Saved {len(rows)} rows to {OUTPUT_CSV.name}")


if __name__ == "__main__":
    main()
