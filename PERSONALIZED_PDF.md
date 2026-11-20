# Personalized diet PDF generation

The application generates a separate PDF for each verified paid order from the shared PDF content template in `server/pdfService.ts`. No uploaded base PDF or Blob token is required for this generation path.

## Profile data used
- Goal: fat loss or weight gain
- Age
- Gender
- Height (cm)
- Current weight (kg)
- Diet preference: vegetarian, eggetarian, or non-vegetarian

## What changes per customer
- Customer name and order reference on the PDF
- BMI calculation and adult-range interpretation (adult categories are not applied to under-18 customers)
- Estimated energy starting point and protein guide for adults
- Portion quantities scaled to the estimated energy starting point
- Protein/food options based on the selected diet preference
- Under-18 safety note and medical-condition/allergy disclaimer

## Generation and access control
- The PDF is rendered only from the protected download endpoint after the server confirms the order has a verified captured payment.
- A shared static PDF is never returned for a new order.
- The download attempt is counted only after the per-order PDF has been generated successfully.
- The customer's profile is read from the order stored in MongoDB; it is not accepted from the download URL or browser at download time.

## Nutrition limitations to resolve before claiming clinical personalization
- The checkout does not currently collect activity level, training schedule, allergies, medical conditions, medications, or food budget.
- Estimated energy uses a sedentary baseline and is a starting estimate, not a measured calorie requirement.
- The generated document is general nutrition guidance, not a medical prescription. Under-18 customers and customers with medical conditions should receive qualified parent/guardian and registered dietitian/doctor review.
- Have a qualified nutrition professional review the meal template, portion scaling, and nutrition estimates before using it as a paid personalized nutrition service.
