from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from typing import List
from dotenv import load_dotenv
from .db import init_db, get_session
from .models import (
    ShoppingList,
    ShoppingListCreate,
    ShoppingListRead,
    ShoppingListReadWithItems,
    Item,
    ItemCreate,
    ItemRead,
)
from .categorizer import categorize

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = BASE_DIR / "static"
INDEX_FILE = STATIC_DIR / "index.html"

app = FastAPI(title="Inköpslista")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    return HTMLResponse(INDEX_FILE.read_text(encoding="utf-8"))


# Shopping list endpoints
@app.post("/api/lists", response_model=ShoppingListRead)
def create_list(list_in: ShoppingListCreate, session: Session = Depends(get_session)) -> ShoppingListRead:
    shopping_list = ShoppingList(name=list_in.name)
    session.add(shopping_list)
    session.commit()
    session.refresh(shopping_list)
    return ShoppingListRead.model_validate(shopping_list)


@app.get("/api/lists", response_model=List[ShoppingListRead])
def list_lists(session: Session = Depends(get_session)) -> List[ShoppingListRead]:
    lists = session.exec(select(ShoppingList)).all()
    return [ShoppingListRead.model_validate(l) for l in lists]


@app.get("/api/lists/{list_id}", response_model=ShoppingListReadWithItems)
def get_list(list_id: int, session: Session = Depends(get_session)) -> ShoppingListReadWithItems:
    shopping_list = session.get(ShoppingList, list_id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")
    return ShoppingListReadWithItems(
        id=shopping_list.id,
        name=shopping_list.name,
        items=[ItemRead.model_validate(i) for i in shopping_list.items],
    )


# Item endpoints
@app.post("/api/lists/{list_id}/items", response_model=ItemRead)
def add_item(list_id: int, item_in: ItemCreate, session: Session = Depends(get_session)) -> ItemRead:
    shopping_list = session.get(ShoppingList, list_id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    cat = categorize(item_in.name)
    item = Item(
        name=item_in.name,
        quantity=item_in.quantity or 1,
        unit=item_in.unit,
        category=cat.category,
        list_id=list_id,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return ItemRead.model_validate(item)


@app.get("/api/lists/{list_id}/items", response_model=List[ItemRead])
def list_items(list_id: int, session: Session = Depends(get_session)) -> List[ItemRead]:
    shopping_list = session.get(ShoppingList, list_id)
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")
    return [ItemRead.model_validate(i) for i in shopping_list.items]


@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, session: Session = Depends(get_session)) -> dict:
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}


@app.post("/api/categorize")
def categorize_endpoint(payload: dict) -> dict:
    name = payload.get("name", "")
    result = categorize(name)
    return {"category": result.category, "source": result.source}