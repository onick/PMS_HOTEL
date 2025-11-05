// ===========================================
// SHARED VALIDATION SCHEMAS
// ===========================================
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Payment Intent Schema
export const PaymentIntentSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(10000000, 'Amount exceeds maximum allowed'), // $100,000 max
  currency: z.enum(['usd', 'eur', 'gbp', 'mxn'], {
    errorMap: () => ({ message: 'Invalid currency' })
  }).default('usd'),
  reservationId: z.string().uuid('Invalid reservation ID'),
  metadata: z.record(z.string()).optional().default({}),
});

// Reservation Schema
export const ReservationSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
  guestName: z.string().min(2, 'Guest name too short').max(100),
  guestEmail: z.string().email('Invalid email'),
  checkIn: z.string().datetime('Invalid check-in date'),
  checkOut: z.string().datetime('Invalid check-out date'),
  roomTypeId: z.string().uuid('Invalid room type ID'),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10).default(0),
});

// Subscription Checkout Schema
export const SubscriptionCheckoutSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
});

/**
 * Validate request body against schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}
