import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { CartService } from "../../services/cartService";
import nodemailer from "nodemailer";

const emailSchema = z.object({
  email: z.string().email()
});

export const createEmailCartTool = (userId: number) =>
  new DynamicTool({
    name: "notifications.emailCart",
    description: "Emails the user's cart summary to a specified email address. You must ask the user for their email address first if you don't know it.",
    func: async (input: string) => {
      let emailData: any;
      try {
        emailData = JSON.parse(input);
        const parsed = emailSchema.safeParse(emailData);
        if (!parsed.success) {
          return JSON.stringify({
            success: false,
            error: "Invalid email format",
            expected: "JSON with valid email address"
          });
        }
        emailData = parsed.data;
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: "Invalid JSON input format"
        });
      }

      try {
        const cartService = new CartService();
        const cart = await cartService.getUserCartWithProductDetails(userId);
        
        if (!cart || cart.products.length === 0) {
          return JSON.stringify({
            success: false,
            error: "Cannot send email because the cart is empty."
          });
        }

        // Check if email configuration is available
        if (!process.env.EMAIL_HOST) {
          return JSON.stringify({
            success: false,
            error: "Email service is not configured on the server."
          });
        }

        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT) || 587,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const total = cart.products.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        
        const textBody = `Hello! Here is your NextShop cart summary:\n\n` + 
          cart.products.map((p: any) => `${p.quantity}x ${p.title} - $${p.price}`).join('\n') +
          `\n\nTotal: $${total.toFixed(2)}\n\nThank you for shopping with NextShop!`;

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@nextshop.com',
          to: emailData.email,
          subject: "Your NextShop Cart Summary",
          text: textBody,
        });

        return JSON.stringify({
          success: true,
          message: `Successfully sent the cart summary to ${emailData.email}.`,
          email: emailData.email,
          itemCount: cart.products.length,
          total: total
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });
