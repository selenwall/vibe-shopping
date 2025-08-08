from __future__ import annotations
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


# Base models (non-table) used for input/output schemas
class ShoppingListBase(SQLModel):
    name: str


class ShoppingListCreate(ShoppingListBase):
    pass


class ItemBase(SQLModel):
    name: str
    quantity: float = 1.0
    unit: Optional[str] = None
    category: Optional[str] = None


class ItemCreate(SQLModel):
    name: str
    quantity: float = 1.0
    unit: Optional[str] = None


# Table models
class ShoppingList(ShoppingListBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    items: List["Item"] = Relationship(back_populates="list")


class Item(ItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    list_id: int = Field(foreign_key="shoppinglist.id")
    list: Optional[ShoppingList] = Relationship(back_populates="items")


# Read models (to avoid circular refs)
class ItemRead(SQLModel):
    id: int
    name: str
    quantity: float
    unit: Optional[str]
    category: Optional[str]
    list_id: int


class ShoppingListRead(SQLModel):
    id: int
    name: str


class ShoppingListReadWithItems(ShoppingListRead):
    items: List[ItemRead] = Field(default_factory=list)