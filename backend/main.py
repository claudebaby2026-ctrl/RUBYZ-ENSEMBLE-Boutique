from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="RUBYZ Ensemble API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Product(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    fabric: str
    occasion: str
    color: str
    price: int
    mrp: int
    rating: float
    sold: int
    badge: str
    description: str
    care: List[str]
    sizes: List[str]
    availability: str
    isFeatured: Optional[bool] = False
    isNew: Optional[bool] = False
    isBestseller: Optional[bool] = False


class OrderItem(BaseModel):
    productId: int
    name: str
    quantity: int
    price: int


class Order(BaseModel):
    id: str
    customerName: str
    phone: str
    mode: str
    status: str
    items: List[OrderItem]
    total: int


products_db: List[Product] = [
    Product(
        id=1,
        slug="rose-embroidered-anarkali",
        name="Rose Embroidered Anarkali",
        category="Pakistani Suits",
        fabric="Georgette",
        occasion="Party Wear",
        color="Rose",
        price=3499,
        mrp=4999,
        rating=4.8,
        sold=78,
        badge="BESTSELLER",
        description="An architectural hand-embroidered anarkali featuring rose thread work.",
        care=["Dry clean recommended", "Store on padded hanger"],
        sizes=["S", "M", "L", "XL"],
        availability="In stock",
        isFeatured=True,
        isBestseller=True,
    ),
    Product(
        id=2,
        slug="champagne-zardozi-kurta-set",
        name="Champagne Zardozi Kurta Set",
        category="Luxury Edit",
        fabric="Silk",
        occasion="Wedding",
        color="Gold",
        price=6999,
        mrp=8999,
        rating=4.9,
        sold=34,
        badge="HANDPICKED",
        description="A lavish silk kurta set with tonal zardozi work.",
        care=["Dry clean only", "Use soft brush for embroidery"],
        sizes=["S", "M", "L"],
        availability="Limited stock",
        isFeatured=True,
    ),
]

orders_db: List[Order] = [
    Order(
        id="#235",
        customerName="Riya Sharma",
        phone="98xxxxxx21",
        mode="Delivery",
        status="Pending",
        items=[OrderItem(productId=1, name="Rose Embroidered Anarkali", quantity=1, price=3499)],
        total=3499,
    )
]


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "rubyz-ensemble-api"}


@app.get("/products", response_model=List[Product])
def list_products() -> List[Product]:
    return products_db


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int) -> Product:
    for product in products_db:
        if product.id == product_id:
            return product
    raise ValueError("Product not found")


@app.get("/orders", response_model=List[Order])
def list_orders() -> List[Order]:
    return orders_db


@app.post("/orders", response_model=Order)
def create_order(order: Order) -> Order:
    orders_db.append(order)
    return order


@app.get("/admin/dashboard")
def admin_dashboard() -> dict:
    return {
        "todayOrders": 12,
        "pendingOrders": 3,
        "revenueToday": 34200,
        "lowStockItems": 2,
    }
