import { z } from 'zod';

export const createAddressSchema = {
  body: z.object({
    fullName: z
      .string({ required_error: 'Recipient full name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'),
    addressLine1: z
      .string({ required_error: 'Address line 1 is required' })
      .trim()
      .min(3, 'Address line 1 must be at least 3 characters')
      .max(150, 'Address line 1 cannot exceed 150 characters'),
    addressLine2: z.string().trim().max(150).optional().nullable(),
    city: z
      .string({ required_error: 'City is required' })
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(60, 'City cannot exceed 60 characters'),
    state: z
      .string({ required_error: 'State is required' })
      .trim()
      .min(2, 'State must be at least 2 characters')
      .max(60, 'State cannot exceed 60 characters'),
    pincode: z
      .string({ required_error: 'PIN code is required' })
      .trim()
      .regex(/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit Indian PIN code'),
    addressType: z.enum(['home', 'office', 'other']).default('home'),
    isDefaultShipping: z.boolean().optional().default(false),
    isDefaultBilling: z.boolean().optional().default(false)
  })
};

export const updateAddressSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address identifier')
  }),
  body: createAddressSchema.body.partial()
};

export const addressIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address identifier')
  })
};

export default {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema
};
