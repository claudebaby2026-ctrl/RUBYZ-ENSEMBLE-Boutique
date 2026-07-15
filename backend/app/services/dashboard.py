from sqlalchemy.orm import Session

from app.crud import order as order_crud
from app.crud import product as product_crud


def get_dashboard_stats(db: Session) -> dict:
    return {
        "todayOrders": order_crud.count_today_orders(db),
        "pendingOrders": order_crud.count_pending_orders(db),
        "revenueToday": order_crud.sum_revenue(db),
        "lowStockItems": product_crud.count_low_stock(db),
    }
