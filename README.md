# Grafton Liquor - Mobile App

A React Native + Expo mobile e-commerce app for Grafton Liquor (graftonliquor.co.nz), powered by Wix Stores headless API.

## Features

- 🍺 Browse liquor products by category (RTD, Whiskey, Beer, Vodka, Gin, Rum, Champagne, Liqueur)
- 🔍 Search products
- 🛒 Add to cart functionality
- 💳 Wix-powered checkout (redirects to Wix checkout)
- 👤 Member authentication
- 🔞 Age verification gate (18+ for New Zealand)
- 📱 Native iOS and Android support

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio for development
- Wix site with Stores installed

## Setup

### 1. Get your Wix Client ID

1. Go to your Wix Dashboard
2. Navigate to **Settings** > **Headless Settings**
3. Create a new OAuth App or use existing
4. Copy the **Client ID**

### 2. Configure Environment

Update the `.env` file in the project root:

```env
EXPO_PUBLIC_WIX_CLIENT_ID=your-wix-client-id-here
EXPO_PUBLIC_DISPLAY_COLLECTIONS_SLUGS=rtd-pre-mixed whiskey beers vodka gin rum champagne liqueur
EXPO_PUBLIC_NEW_COLLECTION_SLUG=new
EXPO_PUBLIC_STORE_URL=https://www.graftonliquor.co.nz
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

```bash
# Start development server
npx expo start

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator  
npx expo run:android
```

## Project Structure

```
├── App.js                    # Main app entry point
├── authentication/           # Wix authentication & session management
├── components/               # Reusable UI components
│   ├── AgeVerification/      # Age gate (18+)
│   ├── Hero/                 # Home page hero section
│   ├── ShopCollectionsHome/  # Category grid
│   └── ...
├── screens/                  # App screens
│   ├── home/                 # Home screen
│   ├── store/                # Store, Products, Product, Cart screens
│   └── members/              # Member area
├── styles/                   # Styling & theme
│   └── theme.js              # Grafton Liquor color theme
├── data/                     # Static data & tabs config
└── routes/                   # Navigation routes
```

## Wix Store Integration

This app uses the Wix Headless SDK to fetch:
- Product catalog
- Collections/categories
- Cart management
- Checkout (redirects to Wix hosted checkout)

The checkout is handled by Wix's hosted checkout page via WebView, ensuring:
- PCI compliance for payments
- Full Wix payment integration
- Order management in Wix Dashboard

## Customization

### Colors & Theme
Edit `styles/theme.js` to customize the color palette.

### Categories
Update `EXPO_PUBLIC_DISPLAY_COLLECTIONS_SLUGS` in `.env` with your Wix collection slugs.

### Branding
- Update `app.json` for app name, icons
- Replace assets in `/assets` folder
- Modify hero section in `components/Hero/HeroSection.js`

## Legal Notice

This app includes age verification as required by New Zealand liquor licensing laws.

**Licence:** 007/OFF/9130/2022  
**Licensee:** Guru Krupa Investments Ltd

*It is an offence to supply alcohol to a person under the age of 18 years.*

## Support

- Website: https://www.graftonliquor.co.nz
- Email: sales@graftonliquor.co.nz
- Phone: +64 22 303 9580

---

## Original Template

This app is based on the [Wix Headless react-native Example](https://github.com/wix/headless-templates).

### Original Features Covered

- Wix Headless Session Management
- Wix Headless Ecommerce
- Member Authentication

For detailed implementation guides, see the `/docs` folder.
