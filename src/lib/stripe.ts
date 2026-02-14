import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe only if key is configured
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const stripePromise = stripeKey ? loadStripe(stripeKey) : Promise.resolve(null);
