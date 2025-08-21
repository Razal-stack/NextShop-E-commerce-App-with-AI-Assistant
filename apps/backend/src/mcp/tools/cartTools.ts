import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { CartService } from "../../services/cartService";
import Papa from "papaparse";

const addToCartSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1)
});

export const createAddToCartTool = (userId: number) =>
  new DynamicTool({
    name: "cart.add",
    description: "Adds a specific product to the user's cart.",
    func: async (input: string) => {
      let productData: any;
      try {
        productData = JSON.parse(input);
        const parsed = addToCartSchema.safeParse(productData);
        if (!parsed.success) {
          return JSON.stringify({
            success: false,
            error: "Invalid input format",
            expected: "JSON with productId (number) and quantity (number)"
          });
        }
        productData = parsed.data;
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: "Invalid JSON input format"
        });
      }

      try {
        const cartService = new CartService();
        await cartService.addItemToCart(userId, productData.productId, productData.quantity);
        
        return JSON.stringify({
          success: true,
          message: `Added product ${productData.productId} (x${productData.quantity}) to cart.`,
          productId: productData.productId,
          quantity: productData.quantity
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to add to cart: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });

export const createGetCartTool = (userId: number) =>
  new DynamicTool({
    name: "cart.get",
    description: "Fetches the current user's shopping cart with product details.",
    func: async () => {
      try {
        const cartService = new CartService();
        const cart = await cartService.getUserCart(userId);
        
        if (!cart || !cart.products || cart.products.length === 0) {
          return JSON.stringify({
            success: true,
            cart: { products: [], total: 0 },
            message: "Your cart is currently empty."
          });
        }

        // Calculate total
        const total = cart.products.reduce((sum: number, item: any) => {
          return sum + (item.price * item.quantity);
        }, 0);

        return JSON.stringify({
          success: true,
          cart: {
            ...cart,
            total: total
          },
          message: `Your cart contains ${cart.products.length} item${cart.products.length > 1 ? 's' : ''}.`
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to get cart: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });

export const createExportCartToCSVTool = (userId: number) =>
  new DynamicTool({
    name: "cart.exportCSV",
    description: "Exports the user's current cart to a CSV formatted string. Use this when the user wants to download their cart.",
    func: async () => {
      try {
        const cartService = new CartService();
        const cart = await cartService.getUserCartWithProductDetails(userId);
        
        if (!cart || cart.products.length === 0) {
          return JSON.stringify({
            success: false,
            error: "The cart is empty."
          });
        }

        const csvData = cart.products.map((item: any) => ({
          productId: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }));

        const csvString = Papa.unparse(csvData);

        return JSON.stringify({
          success: true,
          csvData: csvString,
          message: "Cart exported to CSV successfully."
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to export cart: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });
