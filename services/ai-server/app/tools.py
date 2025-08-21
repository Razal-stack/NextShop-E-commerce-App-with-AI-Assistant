# app/tools.py
import httpx
from langchain.tools import tool
from .config import settings

@tool
async def list_products(category: str = None, query: str = None) -> str:
    """Searches for products. Use this to find items based on category, price, or keywords."""
    async with httpx.AsyncClient() as client:
        params = {k: v for k, v in {"category": category, "query": query}.items() if v}
        try:
            response = await client.get(f"{settings.EXPRESS_API_BASE}/products", params=params)
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            return f"Error: Failed to fetch products. Status code: {e.response.status_code}"

@tool
async def get_product_details(product_id: int) -> str:
    """Get detailed information about a specific product by ID."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.EXPRESS_API_BASE}/products/{product_id}")
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            return f"Error: Failed to fetch product {product_id}. Status code: {e.response.status_code}"

@tool
async def get_categories() -> str:
    """Get all available product categories."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.EXPRESS_API_BASE}/products/categories")
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            return f"Error: Failed to fetch categories. Status code: {e.response.status_code}"

@tool
async def get_user_cart(user_id: int) -> str:
    """Get the current user's cart contents."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.EXPRESS_API_BASE}/carts/user/{user_id}")
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            return f"Error: Failed to fetch cart for user {user_id}. Status code: {e.response.status_code}"

@tool
async def add_to_cart(user_id: int, product_id: int, quantity: int = 1) -> str:
    """Add a product to the user's cart."""
    async with httpx.AsyncClient() as client:
        try:
            cart_data = {
                "userId": user_id,
                "date": "2024-01-01",
                "products": [{"productId": product_id, "quantity": quantity}]
            }
            response = await client.post(f"{settings.EXPRESS_API_BASE}/carts", json=cart_data)
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            return f"Error: Failed to add product to cart. Status code: {e.response.status_code}"
