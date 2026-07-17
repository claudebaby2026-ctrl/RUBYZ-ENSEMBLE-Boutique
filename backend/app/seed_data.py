from sqlalchemy.orm import Session

from app.config import settings
from app.crud.attribute import create_attribute
from app.models.product import Product
from app.models.user import User
from app.security import hash_password

# Sensible starting options for the owner dashboard's dropdowns, on top of
# whatever INITIAL_PRODUCTS already use. Purely a convenience seed — the
# owner can add any further value from the dashboard at any time.
DEFAULT_ATTRIBUTES = {
    "category": [
        "Pakistani Suits",
        "Party Wear",
        "Wedding Collection",
        "Luxury Edit",
        "Summer Collection",
        "Tailoring Services",
    ],
    "occasion": ["Wedding", "Festive", "Office", "Casual", "Party Wear", "Eid", "Diwali"],
    "color": ["Rose", "Gold", "Ivory", "Emerald", "Maroon", "Black", "Navy", "Blush"],
    "fabric": ["Cotton", "Georgette", "Silk", "Net", "Velvet", "Chiffon", "Lawn"],
}

INITIAL_PRODUCTS = [
    dict(
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
        stock=8,
        badge="BESTSELLER",
        description="An architectural hand-embroidered anarkali featuring rose thread work, a flattering flared silhouette, and premium georgette drape.",
        care=["Dry clean recommended", "Store on padded hanger", "Avoid direct sunlight"],
        sizes=["S", "M", "L", "XL"],
        availability="In stock",
        is_featured=True,
        is_bestseller=True,
    ),
    dict(
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
        stock=2,
        badge="HANDPICKED",
        description="A lavish kurta set crafted in rich silk with tonal zardozi work, shaped for celebratory evenings and bridal-adjacent styling.",
        care=["Dry clean only", "Use soft brush for embroidery", "Wrap in muslin"],
        sizes=["S", "M", "L"],
        availability="Limited stock",
        is_featured=True,
    ),
    dict(
        slug="ivory-chikankari-suit",
        name="Ivory Chikankari Suit",
        category="Pakistani Suits",
        fabric="Cotton",
        occasion="Festive",
        color="Ivory",
        price=2799,
        mrp=3599,
        rating=4.7,
        sold=51,
        stock=14,
        badge="NEW",
        description="A soft ivory chikankari suit with breathable cotton and delicate white-on-ivory detailing for everyday grace.",
        care=["Gentle hand wash", "Steam lightly", "Avoid bleach"],
        sizes=["XS", "S", "M", "L"],
        availability="In stock",
        is_new=True,
    ),
    dict(
        slug="emerald-sequin-sharara",
        name="Emerald Sequin Sharara",
        category="Party Wear",
        fabric="Net",
        occasion="Party Wear",
        color="Green",
        price=4299,
        mrp=5999,
        rating=4.6,
        sold=22,
        stock=1,
        badge="LIMITED",
        description="A luminous sharara with emerald sequin detailing, sculpted for high-energy evenings and festive glamour.",
        care=["Dry clean only", "Handle sequins gently", "Store flat"],
        sizes=["M", "L", "XL"],
        availability="Low stock",
    ),
    dict(
        slug="blush-organza-saree",
        name="Blush Organza Saree",
        category="Wedding Collection",
        fabric="Organza",
        occasion="Wedding",
        color="Pink",
        price=5499,
        mrp=7499,
        rating=4.9,
        sold=40,
        stock=6,
        badge="EXCLUSIVE",
        description="A modern blush organza drape with a light sheen and graceful fall, designed for weddings and celebratory evenings.",
        care=["Dry clean only", "Do not wrinkle harshly", "Use tissue between folds"],
        sizes=["Free Size"],
        availability="In stock",
    ),
    dict(
        slug="sky-cotton-coord-set",
        name="Sky Cotton Co-ord Set",
        category="Summer Collection",
        fabric="Cotton",
        occasion="Casual",
        color="Blue",
        price=1899,
        mrp=2499,
        rating=4.5,
        sold=63,
        stock=20,
        badge="NEW",
        description="A breezy cotton co-ord set in sky blue, ideal for warm weather dressing and understated elegance.",
        care=["Machine wash cold", "Air dry", "Use mild detergent"],
        sizes=["S", "M", "L"],
        availability="In stock",
        is_new=True,
        is_bestseller=True,
    ),
    dict(
        slug="onyx-velvet-sharara",
        name="Onyx Velvet Sharara",
        category="Party Wear",
        fabric="Velvet",
        occasion="Party Wear",
        color="Black",
        price=4799,
        mrp=6299,
        rating=4.8,
        sold=29,
        stock=9,
        badge="BESTSELLER",
        description="A dramatic velvet sharara with a rich, plush finish and fluid silhouette that whispers luxury on every step.",
        care=["Dry clean only", "Steam gently", "Store away from moisture"],
        sizes=["M", "L", "XL"],
        availability="In stock",
        is_bestseller=True,
    ),
    dict(
        slug="sabyasachi-inspired-lehenga",
        name="Sabyasachi Inspired Lehenga",
        category="Wedding Collection",
        fabric="Silk",
        occasion="Wedding",
        color="Maroon",
        price=8999,
        mrp=11999,
        rating=5.0,
        sold=18,
        stock=3,
        badge="EXCLUSIVE",
        description="An heirloom-inspired lehenga in rich maroon silk with regal texture and an opulent bridal finish.",
        care=["Dry clean only", "Store in breathable cover", "Avoid perfume contact"],
        sizes=["S", "M", "L"],
        availability="Limited stock",
    ),
]


def seed_if_empty(db: Session) -> None:
    """Populate the products table on first run only. Once the DB has any
    rows, this is a no-op — the database is the single source of truth from
    then on, and the owner dashboard is the only way to add/edit/remove
    products."""
    if db.query(Product).count() > 0:
        return
    db.bulk_save_objects([Product(**data) for data in INITIAL_PRODUCTS])
    db.commit()


def seed_attributes(db: Session) -> None:
    """Ensure the default taxonomy options exist. Safe to call on every
    startup — create_attribute() is a no-op for values that already exist,
    so this only ever adds missing defaults, never duplicates or resets
    anything the owner has since added or renamed via the dashboard."""
    for type_, values in DEFAULT_ATTRIBUTES.items():
        for value in values:
            create_attribute(db, type_, value)
    for data in INITIAL_PRODUCTS:
        for field in ("category", "occasion", "color", "fabric"):
            create_attribute(db, field, data[field])


def seed_owner(db: Session) -> None:
    """Ensure exactly one owner account exists, credentials from env/.env.
    Safe to call on every startup: creates the owner once, and if the env
    password changes, updates the stored hash to match so the printed
    credentials always work."""
    owner = db.query(User).filter(User.role == "owner").first()
    if owner is None:
        owner = User(
            name=settings.OWNER_NAME,
            email=settings.OWNER_EMAIL.lower(),
            phone="",
            hashed_password=hash_password(settings.OWNER_PASSWORD),
            role="owner",
        )
        db.add(owner)
        db.commit()
        print(f"[seed] Created owner account: {settings.OWNER_EMAIL}")
