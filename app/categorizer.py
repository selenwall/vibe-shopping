import os
from dataclasses import dataclass
from typing import Optional, Dict, List
from rapidfuzz import process, fuzz

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore


DEFAULT_CATEGORIES = {
    "mejeri": ["mjölk", "smör", "yoghurt", "grädde", "ost", "filmjölk", "creme fraiche"],
    "bröd": ["bröd", "fralla", "baguette", "knäckebröd", "tortilla"],
    "frukt & grönt": ["äpple", "banan", "lök", "tomat", "gurka", "morot", "paprika", "potatis", "citron"],
    "kött & fisk": ["kyckling", "nötfärs", "lax", "fläsk", "korv", "bacon"],
    "skafferi": ["pasta", "ris", "socker", "mjöl", "olja", "salt", "peppar", "ketchup", "senap"],
    "dryck": ["läsk", "juice", "vatten", "kaffe", "te"],
    "hushåll": ["toalettpapper", "diskmedel", "tvättmedel", "soppåse"],
    "frys": ["glass", "frysta bär", "frysta grönsaker"],
}


@dataclass
class CategorizeResult:
    category: Optional[str]
    source: str


def _normalize(text: str) -> str:
    return text.strip().lower()


def categorize_with_rules(item_name: str, categories: Optional[Dict[str, List[str]]] = None) -> CategorizeResult:
    name = _normalize(item_name)
    categories = categories or DEFAULT_CATEGORIES

    for cat, examples in categories.items():
        if name in (_normalize(e) for e in examples):
            return CategorizeResult(category=cat, source="rule:exact")

    # fuzzy across all example lists
    example_to_cat = {ex: cat for cat, exs in categories.items() for ex in exs}
    choices = list(example_to_cat.keys())
    match, score, _ = process.extractOne(name, choices, scorer=fuzz.WRatio) if choices else (None, 0, None)
    if match and score >= 85:
        return CategorizeResult(category=example_to_cat[match], source=f"rule:fuzzy:{score}")

    # simple keyword hints
    hints = [
        ("mejeri", ["mjölk", "smör", "yoghurt", "grädde", "ost"]),
        ("frukt & grönt", ["äpple", "banan", "tomat", "gurka", "morot", "lök"]),
        ("skafferi", ["pasta", "ris", "mjöl", "socker"]),
    ]
    for cat, kws in hints:
        if any(kw in name for kw in kws):
            return CategorizeResult(category=cat, source="rule:kw")

    return CategorizeResult(category=None, source="rule:none")


def categorize_with_ai(item_name: str) -> CategorizeResult:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not api_key or OpenAI is None:
        return CategorizeResult(category=None, source="ai:disabled")

    client = OpenAI(api_key=api_key)
    system = (
        "Du är en assistent som klassificerar dagligvaror till svenska kategorier för inköpslista. "
        "Svara ENBART med kategorin: mejeri, bröd, frukt & grönt, kött & fisk, skafferi, dryck, hushåll, frys. "
        "Om okänt, svara 'okänt'."
    )
    user = f"Vara: {item_name}"

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0,
        )
        text = resp.choices[0].message.content.strip().lower()
        text = text.replace("&", "&")  # normalize
        allowed = set(DEFAULT_CATEGORIES.keys()) | {"okänt"}
        category = text if text in allowed else None
        return CategorizeResult(category=category if category != "okänt" else None, source="ai")
    except Exception:
        return CategorizeResult(category=None, source="ai:error")


def categorize(item_name: str) -> CategorizeResult:
    ai = categorize_with_ai(item_name)
    if ai.category:
        return ai
    rule = categorize_with_rules(item_name)
    return rule