# NextShop E-commerce Platform - Complete API Documentation

## Overview
NextShop is a modern e-commerce platform built with Next.js, TypeScript, Express.js, and AI integration. This document provides comprehensive technical details for scaling and AI enhancement in Google AI Studio.

## Architecture Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, TypeScript
- **AI Integration**: Model Context Protocol (MCP) Server
- **Authentication**: JWT-based with localStorage persistence
- **State Management**: Zustand for UI state, React hooks for auth
- **Database**: FakeStore API integration (ready for real database)

---

## Backend API Endpoints

### Base Configuration
```
Base URL: http://localhost:3001/api
Content-Type: application/json
Authentication: Bearer JWT token (where required)
```

### Authentication Routes

#### POST /auth/login
**Purpose:** User authentication with JWT token generation

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiam9obmQiLCJpYXQiOjE2Mzk1NzIzNDUsImV4cCI6MTYzOTU3NTk0NX0.signature",
  "userId": 1
}
```

**Error Response (401):**
```json
{
  "error": "Authentication failed"
}
```

### Product Routes

#### GET /products
**Purpose:** Retrieve all products with optional filtering and pagination

**Query Parameters:**
- `limit`: number (1-50, default: 20)
- `sort`: string ('asc' | 'desc', default: 'asc')
- `category`: string (filter by category)

**Success Response (200):**
```json
[
  {
    "id": 1,
    "title": "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    "price": 109.95,
    "description": "Your perfect pack for everyday use and walks in the forest...",
    "category": "men's clothing",
    "image": "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
    "rating": {
      "rate": 3.9,
      "count": 120
    }
  }
]
```

#### GET /products/:id
**Purpose:** Get single product by ID

**URL Parameters:**
- `id`: number (product ID)

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Product Name",
  "price": 109.95,
  "description": "Product description",
  "category": "electronics",
  "image": "https://example.com/image.jpg",
  "rating": {
    "rate": 3.9,
    "count": 120
  }
}
```

**Error Response (404):**
```json
{
  "error": "Product not found"
}
```

#### GET /products/categories
**Purpose:** Get all available product categories

**Success Response (200):**
```json
[
  "electronics",
  "jewelery", 
  "men's clothing",
  "women's clothing"
]
```

#### GET /products/category/:category
**Purpose:** Get products filtered by specific category

**URL Parameters:**
- `category`: string (category name)

**Query Parameters:** Same as GET /products

**Success Response (200):** Array of products in specified category

### Cart Routes

#### GET /carts
**Purpose:** Get all carts (admin functionality)

**Query Parameters:**
- `startdate`: string (YYYY-MM-DD)
- `enddate`: string (YYYY-MM-DD)
- `limit`: number
- `sort`: string ('asc' | 'desc')

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "date": "2020-03-02T00:00:00.000Z",
    "products": [
      {
        "productId": 1,
        "quantity": 4
      },
      {
        "productId": 2,
        "quantity": 1
      }
    ]
  }
]
```

#### GET /carts/user/:userId
**Purpose:** Get all carts for specific user

**URL Parameters:**
- `userId`: number (user ID)

**Success Response (200):** Array of user's carts

#### GET /carts/:id
**Purpose:** Get single cart by ID

**URL Parameters:**
- `id`: number (cart ID)

**Success Response (200):** Single cart object

#### POST /carts
**Purpose:** Create new cart

**Request Body:**
```json
{
  "userId": 1,
  "date": "2024-01-01",
  "products": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ]
}
```

**Success Response (200):**
```json
{
  "id": 6,
  "userId": 1,
  "date": "2024-01-01T00:00:00.000Z",
  "products": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ]
}
```

#### PUT /carts/:id
**Purpose:** Update existing cart

**URL Parameters:**
- `id`: number (cart ID)

**Request Body:** Same as POST /carts

**Success Response (200):** Updated cart object

#### DELETE /carts/:id
**Purpose:** Delete cart

**URL Parameters:**
- `id`: number (cart ID)

**Success Response (200):**
```json
{
  "message": "Cart deleted successfully"
}
```

### User Routes

#### GET /users
**Purpose:** Get all users

**Query Parameters:**
- `limit`: number
- `sort`: string ('asc' | 'desc')

**Success Response (200):**
```json
[
  {
    "id": 1,
    "email": "john@gmail.com",
    "username": "johnd",
    "password": "m38rmF$",
    "name": {
      "firstname": "john",
      "lastname": "doe"
    },
    "address": {
      "city": "kilcoole",
      "street": "7835 new road",
      "number": 3,
      "zipcode": "12926-3874",
      "geolocation": {
        "lat": "-37.3159",
        "long": "81.1496"
      }
    },
    "phone": "1-570-236-7033"
  }
]
```

#### GET /users/:id
**Purpose:** Get single user by ID

**URL Parameters:**
- `id`: number (user ID)

**Success Response (200):** Single user object

#### POST /users
**Purpose:** Create new user

**Request Body:**
```json
{
  "email": "john@gmail.com",
  "username": "johnd",
  "password": "m38rmF$",
  "name": {
    "firstname": "john",
    "lastname": "doe"
  },
  "address": {
    "city": "kilcoole",
    "street": "7835 new road",
    "number": 3,
    "zipcode": "12926-3874",
    "geolocation": {
      "lat": "-37.3159",
      "long": "81.1496"
    }
  },
  "phone": "1-570-236-7033"
}
```

**Success Response (200):** Created user object with ID

#### PUT /users/:id
**Purpose:** Update user

**URL Parameters:**
- `id`: number (user ID)

**Request Body:** Partial user object (only fields to update)

**Success Response (200):** Updated user object

#### DELETE /users/:id
**Purpose:** Delete user

**URL Parameters:**
- `id`: number (user ID)

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## AI Assistant Client Code

### Main Component Structure

```typescript
// Main AI Assistant Component
interface Message {
  id: string;
  text: string;
  sender: "user" | "nex";
  timestamp: Date;
}

export default function AIAssistant() {
  // State Management
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm Nex, your AI shopping assistant. How can I help you find the perfect products today?",
      sender: "nex",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // UI Store Integration
  const { setCartOpen, setWishlistOpen, isCartOpen, isWishlistOpen } = useUIStore();
  
  // Message handling
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // AI Response Simulation (Replace with actual MCP server call)
    setTimeout(() => {
      const responses = [
        "I'd be happy to help you find that! Let me search our products for you.",
        "Great question! Based on your preferences, here are some recommendations I found.",
        "I found some amazing products that match what you're looking for! Would you like to see more details?",
        "That's a popular choice! Here are the top-rated products in that category.",
        "I can help you compare these options. Let me break down the key features for you.",
      ];

      const nexMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "nex",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, nexMessage]);
      setIsTyping(false);
    }, 1500);
  };
}
```

### Key Features

1. **Draggable Interface**
   - Floating AI assistant that can be repositioned
   - Responsive to cart/wishlist states
   - Dynamic z-index management

2. **State Management**
   - Message history with timestamps
   - Typing indicators
   - Expanded/collapsed states
   - Position tracking

3. **UI Integration**
   - Smart interaction with cart and wishlist
   - Visual feedback for user actions
   - Suggested questions for quick interaction

4. **Message Flow**
   - Real-time message exchange
   - Simulated AI responses (ready for MCP integration)
   - Scroll-to-bottom functionality
   - Quick action buttons

### Suggested Questions Array
```typescript
const suggestedQuestions = [
  "Show me trending products",
  "Find electronics under £100",
  "What's the best rated product?",
  "Help me find a gift for someone",
  "Show me today's deals",
  "Compare products for me",
];
```

---

## Authentication Management

### JWT Token Implementation

**Storage Strategy:**
- Primary: localStorage with key `nextshop_token`
- User Data: localStorage with key `nextshop_user`
- Session Persistence: Auto-restore on application initialization

### Authentication Hook Pattern

```typescript
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Cart and wishlist store integration
  const { clearCart, loadCartFromData } = useCartStore();
  const { clearWishlist } = useWishlistStore();

  // Auto-initialization on app mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('nextshop_token');
      const storedUser = localStorage.getItem('nextshop_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Login method with comprehensive cart synchronization
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Authenticate with backend
      const result = await UserService.login(credentials);
      
      // Decode JWT to get real user ID
      let realUserId = result.userId;
      try {
        const decoded = JSON.parse(atob(result.token.split('.')[1]));
        realUserId = decoded.userId || decoded.sub || result.userId;
      } catch (error) {
        console.error('Failed to decode token, using backend userId:', error);
        realUserId = result.userId;
      }

      // Fetch complete user data
      const userData = await UserService.getUser(realUserId);
      
      // Set authentication state
      setToken(result.token);
      setUser(userData);
      
      // Persist to localStorage
      localStorage.setItem('nextshop_token', result.token);
      localStorage.setItem('nextshop_user', JSON.stringify(userData));
      
      // Sync user cart data from backend
      try {
        const userCart = await CartService.getUserCart(realUserId);
        
        if (userCart.products && userCart.products.length > 0) {
          // Fetch full product details for each cart item
          const cartItemsPromises = userCart.products.map(async (item) => {
            try {
              const product = await ProductService.getProduct(item.productId);
              return {
                ...product,
                quantity: item.quantity,
                cartId: userCart.id
              };
            } catch (error) {
              console.error(`Failed to fetch product ${item.productId}:`, error);
              return null;
            }
          });

          const cartItems = await Promise.all(cartItemsPromises);
          const validCartItems = cartItems.filter(item => item !== null);
          
          if (validCartItems.length > 0) {
            loadCartFromData(validCartItems, userCart.id);
          }
        }
      } catch (error) {
        console.error('Failed to load user cart:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout with cleanup
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nextshop_token');
    localStorage.removeItem('nextshop_user');
    clearCart();
    clearWishlist();
  }, [clearCart, clearWishlist]);

  // Computed authentication state
  const isAuthenticated = Boolean(user && token);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    register: async (data: RegisterData) => {
      // Registration implementation
    }
  };
}
```

### Protected Route Implementation
```typescript
// Authentication check pattern used throughout the app
const isAuthenticated = Boolean(user && token);

// Automatic cart/wishlist synchronization on login
// Session management with proper cleanup on logout
// JWT token validation and refresh logic
```

---

## MCP Server Integration

### Available Tools and Methods

#### Authentication Tools
```typescript
// auth.login - User authentication
{
  name: 'auth.login',
  description: 'Authenticate user with FakeStore API',
  inputSchema: {
    type: 'object',
    properties: {
      username: { type: 'string', description: 'Username for authentication' },
      password: { type: 'string', description: 'Password for authentication' }
    },
    required: ['username', 'password']
  }
}
```

#### Product Tools
```typescript
// products.list - Get products with filtering
{
  name: 'products.list',
  description: 'Get list of products with optional filters',
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Filter by category' },
      limit: { type: 'number', description: 'Limit number of results (1-50)', minimum: 1, maximum: 50 },
      sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
    }
  }
}

// products.get - Get specific product
{
  name: 'products.get',
  description: 'Get a specific product by ID',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'number', description: 'Product ID to fetch' }
    },
    required: ['productId']
  }
}

// products.categories - Get all categories
{
  name: 'products.categories',
  description: 'Get all available product categories',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}
```

#### Cart Management Tools
```typescript
// cart.get - Get current user cart
{
  name: 'cart.get',
  description: 'Get current user cart',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}

// cart.add - Add product to cart
{
  name: 'cart.add',
  description: 'Add product to cart',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'number', description: 'Product ID to add' },
      quantity: { type: 'number', description: 'Quantity to add', minimum: 1 }
    },
    required: ['productId']
  }
}

// cart.update - Update cart item quantity
{
  name: 'cart.update',
  description: 'Update product quantity in cart',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'number', description: 'Product ID to update' },
      quantity: { type: 'number', description: 'New quantity (0 to remove)', minimum: 0 }
    },
    required: ['productId', 'quantity']
  }
}

// cart.remove - Remove product from cart
{
  name: 'cart.remove',
  description: 'Remove product from cart',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'number', description: 'Product ID to remove' }
    },
    required: ['productId']
  }
}

// cart.clear - Clear all cart items
{
  name: 'cart.clear',
  description: 'Clear all items from cart',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}
```

### Session Management
- In-memory session storage with userId and token
- Authentication required for cart operations
- Consistent error handling and JSON responses
- Session timeout and cleanup mechanisms

### Tool Response Format
```typescript
// Success Response
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        success: true,
        data: {...},
        message: "Operation completed successfully"
      })
    }
  ]
}

// Error Response
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: "Error message"
      })
    }
  ],
  isError: true
}
```

---

## Frontend State Management

### UI Store (Zustand)
```typescript
interface UIState {
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setWishlistOpen: (open: boolean) => void;
}
```

### Cart Store
```typescript
interface CartState {
  items: CartItem[];
  cartId: number | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadCartFromData: (items: CartItem[], cartId: number) => void;
}
```

### Wishlist Store
```typescript
interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}
```

---

## Navigation and Filtering System

### Smart Homepage Navigation
```typescript
// Navigation utility for filter-based routing
class NavigationHelper {
  static navigateToProductsWithFilters(router: any, options: FilteredNavigationOptions = {}) {
    const { filters = {}, showFilters = true } = options;
    
    // Build query parameters from filters
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.priceMax !== undefined) queryParams.set('priceMax', filters.priceMax.toString());
    if (filters.sort) queryParams.set('sort', filters.sort);
    if (filters.search) queryParams.set('search', filters.search);
    if (showFilters) queryParams.set('showFilters', 'true');
    
    const queryString = queryParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    
    router.push(url);
  }
}
```

### Widget Filter Configurations
```typescript
// Budget Picks: Auto-applies £25 price filter + price sorting
budget: {
  filters: {
    priceMax: 25,
    sort: 'price-low',
    type: 'budget'
  },
  showFilters: true
}

// Featured Products: Auto-applies rating sorting
featured: {
  filters: {
    sort: 'rating',
    type: 'featured'
  },
  showFilters: true
}

// Categories: Auto-applies category filter
category: {
  filters: {
    category: selectedCategory
  },
  showFilters: true
}
```

---

## Scaling Considerations

### Performance Optimizations
- Component lazy loading with React.lazy()
- Image optimization with Next.js Image component
- API response caching and memoization
- Virtual scrolling for large product lists
- Debounced search inputs

### Database Migration Path
- Current: FakeStore API integration
- Future: PostgreSQL/MongoDB with Prisma ORM
- User data, cart persistence, order history
- Product inventory management
- Analytics and user behavior tracking

### AI Enhancement Opportunities
- Personalized product recommendations
- Natural language product search
- Image-based product discovery
- Chat-based shopping assistance
- Inventory and pricing optimization
- Customer service automation

### Microservices Architecture
- Product service (catalog, search, recommendations)
- User service (authentication, profiles, preferences)
- Cart service (shopping cart, checkout, orders)
- Payment service (transactions, billing)
- Analytics service (tracking, insights, reports)
- AI service (recommendations, chat, search)

---

## Project Folder Structure

NextShop follows a modern monorepo architecture using pnpm workspaces and Turbo for build optimization. Here's the complete folder structure:

```
NextShop E-commerce App with AI Assistant/
├── 📄 package.json                     # Root package.json with workspace configuration
├── 📄 pnpm-lock.yaml                   # pnpm lockfile for dependency management
├── 📄 pnpm-workspace.yaml              # pnpm workspace configuration
├── 📄 turbo.json                       # Turborepo configuration for build pipeline
├── 📄 NEXTSHOP_API_DOCUMENTATION.md    # This comprehensive API documentation
├── 📄 fakestore_api_reference.pdf      # External API reference documentation
├── 📄 MCP Server Assignment (1) (2).pdf # MCP server assignment documentation
│
├── 📁 apps/                            # Main applications directory
│   ├── 📁 backend/                     # Express.js API server
│   │   ├── 📄 package.json             # Backend dependencies and scripts
│   │   ├── 📄 tsconfig.json            # TypeScript configuration for backend
│   │   │
│   │   └── 📁 src/                     # Backend source code
│   │       ├── 📄 index.ts             # Main server entry point
│   │       ├── 📄 index_new.ts         # Alternative server configuration
│   │       │
│   │       ├── 📁 controllers/         # Route handlers and business logic
│   │       │   ├── 📄 index.ts         # Controller exports
│   │       │   ├── 📄 authController.ts # Authentication endpoints
│   │       │   ├── 📄 cartController.ts # Cart management endpoints
│   │       │   ├── 📄 cartsController.ts # Multiple carts operations
│   │       │   ├── 📄 categoryController.ts # Category management
│   │       │   ├── 📄 productController.ts # Product CRUD operations
│   │       │   └── 📄 userController.ts # User management endpoints
│   │       │
│   │       ├── 📁 lib/                 # Shared libraries and utilities
│   │       │
│   │       ├── 📁 mcp/                 # Model Context Protocol integration
│   │       │   └── 📄 server.ts        # MCP server implementation with 9 tools
│   │       │
│   │       ├── 📁 middleware/          # Express middleware
│   │       │   ├── 📄 index.ts         # Middleware exports
│   │       │   └── 📄 validation.ts    # Request validation middleware
│   │       │
│   │       ├── 📁 routes/              # Express route definitions
│   │       │   ├── 📄 index.ts         # Route exports and main router
│   │       │   ├── 📄 authRoutes.ts    # Authentication routes
│   │       │   ├── 📄 cartRoutes.ts    # Cart management routes
│   │       │   ├── 📄 cartsRoutes.ts   # Multiple carts routes
│   │       │   ├── 📄 categoryRoutes.ts # Category routes
│   │       │   ├── 📄 productRoutes.ts # Product routes
│   │       │   └── 📄 userRoutes.ts    # User management routes
│   │       │
│   │       ├── 📁 schemas/             # Data validation schemas
│   │       │   ├── 📄 index.ts         # Schema exports
│   │       │   └── 📄 validation.ts    # Zod validation schemas
│   │       │
│   │       ├── 📁 services/            # Business logic services
│   │       │   ├── 📄 index.ts         # Service exports
│   │       │   ├── 📄 authService.ts   # Authentication business logic
│   │       │   ├── 📄 cartService.ts   # Cart operations service
│   │       │   ├── 📄 cartsService.ts  # Multiple carts service
│   │       │   ├── 📄 categoryService.ts # Category management service
│   │       │   ├── 📄 fakeStore.ts     # FakeStore API integration
│   │       │   ├── 📄 productService.ts # Product management service
│   │       │   ├── 📄 session.ts       # Session management
│   │       │   └── 📄 userService.ts   # User management service
│   │       │
│   │       ├── 📁 types/               # TypeScript type definitions
│   │       │   └── 📄 index.ts         # Backend type exports
│   │       │
│   │       └── 📁 utils/               # Utility functions
│   │           └── 📄 validation.ts    # Validation utilities
│   │
│   └── 📁 web/                         # Next.js frontend application
│       ├── 📄 package.json             # Frontend dependencies and scripts
│       ├── 📄 tsconfig.json            # TypeScript configuration for frontend
│       ├── 📄 tsconfig.tsbuildinfo     # TypeScript build cache
│       ├── 📄 next.config.js           # Next.js configuration
│       ├── 📄 postcss.config.js        # PostCSS configuration
│       ├── 📄 tailwind.config.ts       # Tailwind CSS configuration
│       ├── 📄 next-env.d.ts            # Next.js type definitions
│       │
│       ├── 📁 app/                     # Next.js 14 App Router directory
│       │   ├── 📄 layout.tsx           # Root layout component
│       │   ├── 📄 page.tsx             # Homepage component
│       │   ├── 📄 globals.css          # Global CSS styles
│       │   ├── 📄 providers.tsx        # App providers (Auth, UI stores)
│       │   │
│       │   ├── 📁 account/             # User account pages
│       │   │   ├── 📄 page.tsx         # Account page
│       │   │   └── 📄 UserProfile.tsx  # User profile component
│       │   │
│       │   ├── 📁 auth/                # Authentication pages
│       │   │   ├── 📄 layout.tsx       # Auth layout
│       │   │   ├── 📁 register/        # Registration flow
│       │   │   │   └── 📄 page.tsx     # Registration page
│       │   │   └── 📁 signin/          # Sign in flow
│       │   │       └── 📄 page.tsx     # Sign in page
│       │   │
│       │   └── 📁 products/            # Product pages
│       │       ├── 📄 page.tsx         # Products listing page
│       │       └── 📁 [id]/            # Dynamic product detail pages
│       │           ├── 📄 page.tsx     # Product detail page
│       │           ├── 📄 loading.tsx  # Loading component
│       │           └── 📄 error.tsx    # Error component
│       │
│       └── 📁 src/                     # Source code directory
│           ├── 📄 index.ts             # Main exports
│           │
│           ├── 📁 components/          # React components
│           │   ├── 📁 features/        # Feature-specific components
│           │   │   ├── 📁 auth/        # Authentication components
│           │   │   ├── 📁 cart/        # Shopping cart components
│           │   │   ├── 📁 homepage/    # Homepage widgets and sections
│           │   │   ├── 📁 product-detail/ # Product detail components
│           │   │   ├── 📁 products/    # Product listing components
│           │   │   └── 📁 wishlist/    # Wishlist components
│           │   │
│           │   ├── 📁 layout/          # Layout components
│           │   │   # Header, Footer, Navigation, AI Assistant
│           │   │
│           │   ├── 📁 shared/          # Shared/reusable components
│           │   │   # Common components used across features
│           │   │
│           │   └── 📁 ui/              # Base UI components
│           │       # Buttons, inputs, modals, etc.
│           │
│           ├── 📁 constants/           # Application constants
│           │   └── 📄 app.ts           # App-wide constants
│           │
│           ├── 📁 contexts/            # React contexts
│           │   └── 📄 AuthContext.tsx  # Authentication context
│           │
│           ├── 📁 hooks/               # Custom React hooks
│           │   ├── 📄 index.ts         # Hook exports
│           │   ├── 📄 useApi.ts        # API interaction hook
│           │   ├── 📄 useAuth.ts       # Authentication hook
│           │   ├── 📄 useBudgetProducts.ts # Budget products hook
│           │   ├── 📄 useCart.ts       # Cart management hook
│           │   ├── 📄 useCategories.ts # Categories hook
│           │   ├── 📄 useFeaturedProducts.ts # Featured products hook
│           │   ├── 📄 useImages.ts     # Image handling hook
│           │   ├── 📄 useProducts.ts   # Products hook
│           │   └── 📄 useTopRatedProducts.ts # Top rated products hook
│           │
│           ├── 📁 lib/                 # Shared libraries
│           │   ├── 📄 mcpClient.ts     # MCP client for AI integration
│           │   ├── 📄 store.tsx        # Zustand store configuration
│           │   ├── 📄 types.ts         # Frontend type definitions
│           │   └── 📄 utils.ts         # Utility functions
│           │
│           ├── 📁 services/            # Frontend service layer
│           │   ├── 📄 index.ts         # Service exports
│           │   ├── 📄 backendApi.ts    # Backend API client
│           │   ├── 📄 cartService.ts   # Cart service
│           │   ├── 📄 imageService.ts  # Image handling service
│           │   ├── 📄 productService.ts # Product service
│           │   └── 📄 userService.ts   # User service
│           │
│           ├── 📁 types/               # TypeScript definitions
│           │   └── 📄 index.ts         # Frontend type exports
│           │
│           └── 📁 utils/               # Utility functions
│               ├── 📄 format.ts        # Formatting utilities
│               └── 📄 navigation.ts    # Navigation helpers
│
├── 📁 configs/                         # Configuration files
│   # Shared configuration files for the monorepo
│
├── 📁 packages/                        # Shared packages
│   └── 📁 shared-schemas/              # Shared TypeScript schemas
│       ├── 📄 package.json             # Shared schemas package config
│       ├── 📄 tsconfig.json            # TypeScript config for schemas
│       │
│       └── 📁 src/                     # Schema source code
│           ├── 📄 index.ts             # Schema exports
│           └── 📄 intents.ts           # Intent definitions for AI
│
└── 📁 scripts/                         # Build and deployment scripts
    # Automation scripts for development and deployment
```

### Architecture Highlights

**🏗️ Monorepo Structure:**
- **pnpm workspaces** for efficient dependency management
- **Turborepo** for optimized build pipeline and caching
- **Shared schemas** package for type consistency across apps

**🎯 Frontend Architecture:**
- **Next.js 14** with App Router for modern React development
- **Feature-based component organization** for scalability
- **Custom hooks** for reusable business logic
- **Zustand stores** for lightweight state management

**⚡ Backend Architecture:**
- **Express.js** with TypeScript for type safety
- **Service layer pattern** for clean business logic separation
- **Controller-Route-Service** architecture for maintainability
- **MCP integration** for AI capabilities

**🔧 Development Features:**
- **Hot reloading** in development with turbo dev
- **Type sharing** between frontend and backend
- **Consistent code style** with shared configurations
- **AI integration** ready with MCP server

This structure provides excellent **scalability**, **maintainability**, and **developer experience** for growing the NextShop platform with AI enhancements.

---

This comprehensive documentation provides all the technical details needed for scaling NextShop in Google AI Studio, including complete API specifications, client code structure, authentication patterns, and integration points for AI enhancement.
