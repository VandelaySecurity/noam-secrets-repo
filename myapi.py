from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Data model for request and response
class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = False

@app.get("/wer")
def read_root():
    return {"message": "Welcome to the API!"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "query": q}

@app.post("/items/blah")
def create_item(item: Item):
    return {"item": item}

@app.get("/wow")
def create_item():
    return {"item": "no sedfvgedf"}
