export type GoalSlug = 'fatloss' | 'gain';

export type AppRoute =
  | 'home'
  | 'checkout'
  | 'payment-success'
  | 'payment-failed'
  | 'privacy-policy'
  | 'terms'
  | 'refund-policy'
  | 'admin';

export interface ProductDto {
  id: GoalSlug;
  slug: string;
  name: string;
  description: string;
  pricePaise: number;
  active: boolean;
  pdfFilename: string;
  updatedAt: string;
}

export interface SiteConfigDto {
  brandName: string;
  whatsappNumber: string;
  supportEmail: string;
  instagramUrl: string;
  youtubeUrl: string;
  instagramFollowers: string;
  youtubeSubscribers: string;
  totalAudience: string;
  referencePriceInr: number | null;
  heroHeadline: string;
  heroDescription: string;
  maintenanceMode: boolean;
}

export interface PublicConfigResponse {
  siteConfig: SiteConfigDto;
  products: ProductDto[];
  razorpay: {
    keyId: string | null;
    mode: 'razorpay' | 'test-sandbox' | 'unconfigured';
  };
}

export interface OrderCreateResponse {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: 'INR';
  productName: string;
  keyId: string | null;
  mode: 'razorpay' | 'test-sandbox';
}

export interface PaymentVerifiedState {
  orderId: string;
  paymentId: string;
  productId: GoalSlug;
  productName: string;
  downloadToken: string;
  customerName: string;
  customerPhone: string;
}

export interface TransformationCardItem {
  id: string;
  name: string;
  goalLabel: 'Fat Loss' | 'Weight Gain';
  beforeKg: number;
  afterKg: number;
  deltaLabel: string;
  duration: string;
  image: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LeadPrefillProfile {
  name: string;
  phone: string;
  email: string;
  goal: GoalSlug;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  heightCm: string;
  weightKg: string;
  dietPreference: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';
}
