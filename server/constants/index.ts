// src/constants/index.ts

import { Frequency, Weekday } from '../types/config/config.enums';

// Derive allowed frequencies from the Frequency enum
export const ALLOWED_NEWSLETTER_FREQUENCIES = Object.values(Frequency) as Frequency[];

// Derive allowed days from the Weekday enum
export const ALLOWED_NEWSLETTER_DAYS = Object.values(Weekday) as Weekday[];

// Time format regex remains unchanged
export const TIME_FORMAT_REGEX = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
