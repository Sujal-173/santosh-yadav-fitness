import type { FaqItem, TransformationCardItem } from '../types';

export const GENERATED_IMAGES = {
  brandLogoFull: '/src/assets/images/santosh_brand_logo_full_1794856626099.jpg',
  brandEmblem: '/src/assets/images/santosh_brand_emblem_1794856625180.jpg',
  heroBg: '/src/assets/images/santosh_hero_desktop_v2_1794854568982.jpg',
  heroMobilePortrait: '/src/assets/images/santosh_hero_mobile_v2_1794854563754.jpg',
  strugglingBw: '/src/assets/images/struggling_model_bw_1794847842216.jpg',
  indianThali: '/src/assets/images/indian_thali_warm_v2_1794856305932.jpg',
  journeyOutdoor: '/src/assets/images/santosh_journey_v2_1794855134375.jpg',
  storyPortrait: '/src/assets/images/santosh_story_portrait_1794857709908.jpg',
  goalFatLoss: '/src/assets/images/santosh_fat_loss_v2_1794855138384.jpg',
  goalWeightGain: '/src/assets/images/santosh_weight_gain_v2_1794855141332.jpg',
  dietPlanBook: '/src/assets/images/diet_plan_book_mockup_1794847845272.jpg',
  transform1: '/src/assets/images/real_transform_fatloss_1_1794855996472.jpg',
  transform2: '/src/assets/images/real_transform_gain_2_1794855996237.jpg',
  transform3: '/src/assets/images/real_transform_fatloss_3_1794855995864.jpg',
  transform4: '/src/assets/images/real_transform_gain_4_1794855997554.jpg',
  formShaker: '/src/assets/images/form_shaker_portrait_1794847847984.jpg',
  paymentSuccessBg: '/src/assets/images/payment_success_bg_1794847844724.jpg',
} as const;

export const REAL_TRANSFORMATIONS: TransformationCardItem[] = [
  {
    id: 'tr-1',
    name: 'Rohit S.',
    goalLabel: 'Fat Loss',
    beforeKg: 86,
    afterKg: 72,
    deltaLabel: '-14 kg',
    duration: '6 Months · Ghar ka Khaana',
    image: GENERATED_IMAGES.transform1,
  },
  {
    id: 'tr-2',
    name: 'Aman K.',
    goalLabel: 'Weight Gain',
    beforeKg: 58,
    afterKg: 68,
    deltaLabel: '+10 kg',
    duration: '8 Months · Lean Gain',
    image: GENERATED_IMAGES.transform2,
  },
  {
    id: 'tr-3',
    name: 'Vikash M.',
    goalLabel: 'Fat Loss',
    beforeKg: 92,
    afterKg: 78,
    deltaLabel: '-14 kg',
    duration: '7 Months · Home Diet',
    image: GENERATED_IMAGES.transform3,
  },
  {
    id: 'tr-4',
    name: 'Deepak R.',
    goalLabel: 'Weight Gain',
    beforeKg: 56,
    afterKg: 65,
    deltaLabel: '+9 kg',
    duration: '6 Months · Budget Diet',
    image: GENERATED_IMAGES.transform4,
  },
];

export const WHAT_IS_INSIDE_FEATURES = [
  {
    id: 'meal-plan',
    title: 'Daily Meal Plan',
    subtitle: 'Breakfast se dinner tak',
    detail: 'Subah se raat tak ka poora Indian diet chart — roti, dal, sabzi, paneer, eggs aur bahut kuch.',
  },
  {
    id: 'calorie-protein',
    title: 'Calorie & Protein Guide',
    subtitle: 'Aapke goal ke hisaab se',
    detail: 'Fat Loss ya Weight Gain ke liye calories aur protein kaise track karein — step by step.',
  },
  {
    id: 'budget-friendly',
    title: 'Budget-Friendly Options',
    subtitle: 'Ghar ke affordable ingredients',
    detail: 'Mehengi supplements ki zarurat nahi. Ghar ke saste aur aasani se milne wale ingredients.',
  },
  {
    id: 'food-swap',
    title: 'Food Swap List',
    subtitle: 'Alternatives for more variety',
    detail: 'Koi cheez pasand nahi ya ghar mein nahi hai? Uski jagah kya kha sakte ho — poori list.',
  },
  {
    id: 'meal-timing',
    title: 'Meal Timing Tips',
    subtitle: 'Sahi time par sahi food',
    detail: 'Kab khaana hai, workout se pehle aur baad mein kya lena hai — simple timing guide.',
  },
  {
    id: 'common-mistakes',
    title: 'Common Mistakes',
    subtitle: 'Jo results ko slow karte',
    detail: 'Wo galtiyan jo log roz karte hain aur progress ruk jaati hai — unse kaise bachein.',
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Plan kis format mein milega?',
    answer:
      'Plan aapko instant downloadable PDF format mein milega. UPI payment server par confirm hote hi isi website par aapka secure Download button activate ho jaayega.',
  },
  {
    id: 'faq-2',
    question: 'Kya yeh vegetarian logon ke liye bhi hai?',
    answer:
      'Haan bilkul. Plan mein vegetarian aur non-vegetarian dono Indian ghar ke khane ke options diye gaye hain. Food Swap List se aap apni pasand ke hisaab se meals badal sakte ho.',
  },
  {
    id: 'faq-3',
    question: 'Payment ke kaun se options hain?',
    answer:
      'Aap Google Pay, PhonePe, Paytm ya kisi bhi supported UPI app se order ke liye generate hua unique QR scan karke checkout par dikhayi gayi price pay kar sakte ho.',
  },
  {
    id: 'faq-4',
    question: 'Payment kaise karna hai?',
    answer:
      'Bas apna goal (Fat Loss ya Weight Gain) select karein, naam aur WhatsApp number daalein aur "Proceed to Pay" par click karein. Aapke order ke liye unique UPI QR generate hoga; payment server par automatically check hoga.',
  },
  {
    id: 'faq-5',
    question: 'Payment successful hone ke baad PDF kaise milega?',
    answer:
      'Payment capture aur verify hote hi aapko Payment Successful screen dikhegi jahan se aap seedha apna goal-based Diet Plan PDF download kar sakte ho. Aap Order ID se baad mein bhi PDF recover kar sakte ho.',
  },
  {
    id: 'faq-6',
    question: 'Refund policy kya hai?',
    answer:
      'Kyunki yeh ek instant digital downloadable PDF product hai, payment verify hone aur download access milne ke baad refund ya return available nahi hai. Kripya sahi goal select karke order karein.',
  },
  {
    id: 'faq-7',
    question: 'Payment fail ho gaya toh kya karein?',
    answer:
      'Agar aapke bank se paise kat gaye lekin status pending hai, toh QR window khuli rakhein. Server Paytm transaction status automatically check karega. Order ID aur registered mobile number support par share karke manual help bhi le sakte hain.',
  },
  {
    id: 'faq-8',
    question: 'Kya results guaranteed hain?',
    answer:
      'Yeh ek practical goal-based diet guide hai, koi magic shortcut nahi. Results aapki daily consistency, sleep, workout aur lifestyle par depend karte hain.',
  },
  {
    id: 'faq-9',
    question: 'Kya diet plan medical advice hai?',
    answer:
      'Nahi. Yeh PDF sirf general nutrition aur fitness education ke liye hai. Agar aapko koi medical condition, diabetes, thyroid ya food allergy hai, toh diet shuru karne se pehle apne doctor se salah zaroor lein.',
  },
];

export interface SampleMealRow {
  time: string;
  title: string;
  fatLoss: string;
  weightGain: string;
  swap: string;
}

export const SAMPLE_MEAL_SCHEDULE: SampleMealRow[] = [
  {
    time: '07:00 AM',
    title: 'Morning Kickstart',
    fatLoss: '500ml gunguna paani + 5 bheege badam (bina cheeni chai/coffee optional)',
    weightGain: '500ml paani + 1 kela + 8 bheege badam aur 4 kaju',
    swap: 'Jeera water ya normal warm water',
  },
  {
    time: '08:30 AM',
    title: 'Breakfast',
    fatLoss: '2 Moong dal chilla pudina chutney ke saath + 150g low-fat dahi',
    weightGain: '80g masala oats 300ml full-cream doodh mein + 2 uble ande / 75g paneer',
    swap: '3 Egg whites + 2 multigrain toast YA 60g poha roasted peanuts ke saath',
  },
  {
    time: '11:30 AM',
    title: 'Mid-Morning',
    fatLoss: '1 Seasonal fruit (seb/amrood) + 1 glass chaas roasted jeera ke saath',
    weightGain: '300ml doodh + 1 kela + 2 tbsp peanut butter shake',
    swap: '40g bhuna chana + nimbu paani',
  },
  {
    time: '01:30 PM',
    title: 'Lunch (Ghar Ka Khaana)',
    fatLoss: '2 Roti + 1 katori dal + 100g paneer/chicken + cucumber salad',
    weightGain: '3 Roti + 150g chawal + 1.5 katori dal/rajma + 150g paneer/chicken sabzi',
    swap: 'Roti ki jagah 120g chawal + dahi le sakte ho',
  },
  {
    time: '05:00 PM',
    title: 'Pre-Workout',
    fatLoss: '1 Black coffee + 30g roasted makhana ya 1 chhota kela',
    weightGain: '2 Uble aalu (150g) sendha namak ke saath + 1 kela',
    swap: '2 Khajoor + black coffee',
  },
  {
    time: '08:00 PM',
    title: 'Dinner',
    fatLoss: '50g boiled soya chunks stir-fry YA 120g grilled paneer/chicken + 1 roti + sabzi',
    weightGain: '2 Roti + 100g chawal + 150g paneer bhurji ya egg curry + salad',
    swap: '200g Moong dal khichdi + 100g low-fat paneer',
  },
];
