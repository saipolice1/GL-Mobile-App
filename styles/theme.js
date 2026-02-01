// Grafton Liquor Theme Configuration
// Clean, modern Uber Eats-inspired design

export const theme = {
  colors: {
    // Primary brand colors - Clean & Modern
    primary: '#FFFFFF',        // White - main background
    secondary: '#4A2C2A',      // Dark brown - brand color for accents
    accent: '#4A2C2A',         // Dark brown - CTA buttons (brand color)
    
    // Background colors
    background: '#FFFFFF',     // Main background - pure white
    surface: '#F6F6F6',        // Card backgrounds - light gray
    surfaceVariant: '#EEEEEE', // Elevated surfaces
    
    // Text colors
    text: '#000000',           // Primary text - black
    textSecondary: '#545454',  // Secondary text - dark gray
    textMuted: '#8A8A8A',      // Muted text - medium gray
    textLight: '#FFFFFF',      // Light text for dark backgrounds
    
    // Accent colors
    gold: '#4A2C2A',           // Dark brown for premium elements (brand color)
    amber: '#D4632A',          // Brand orange
    wine: '#C41E3A',           // Wine red for specials
    whiskey: '#D4A574',        // Whiskey brown
    
    // UI colors
    success: '#4A2C2A',
    error: '#E53935',
    warning: '#F9A825',
    info: '#1976D2',
    
    // Tab bar - Clean white with brand brown active
    tabBar: '#FFFFFF',
    tabBarActive: '#4A2C2A',
    tabBarInactive: '#8A8A8A',
    
    // Cart/checkout
    cartBackground: '#F6F6F6',
    checkoutButton: '#000000',
    
    // Borders
    border: '#E8E8E8',
    borderLight: '#F0F0F0',
    
    // Category chips
    chipBackground: '#F6F6F6',
    chipActive: '#000000',
    chipText: '#000000',
    chipActiveText: '#FFFFFF',
  },
  
  fonts: {
    // Using system fonts for clean Uber-style look
    regular: 'System',
    bold: 'System',
    // Keep Fraunces as fallback
    serif: 'Fraunces-Regular',
    serifBold: 'Fraunces-Bold',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 9999,
  },
  
  // Shadows for elevation (Uber Eats style)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Image aspect ratios
  imageRatio: {
    square: 1,
    product: 1,          // 1:1 for product images
    category: 1.2,       // Slightly taller for category cards
    banner: 0.5,         // Wide banner
    thumbnail: 1,
  },
};

export default theme;
