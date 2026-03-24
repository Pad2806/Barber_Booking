import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/** All valid setting keys with their types */
export const SETTINGS_KEYS = {
  // General
  businessName: 'string',
  contactEmail: 'string',
  contactPhone: 'string',
  website: 'string',
  address: 'string',

  // Booking
  defaultOpenTime: 'string',
  defaultCloseTime: 'string',
  slotDuration: 'number',
  maxAdvanceDays: 'number',
  reminderHours: 'number',

  // Shifts
  shiftMorningStart: 'string',
  shiftMorningEnd: 'string',
  shiftAfternoonStart: 'string',
  shiftAfternoonEnd: 'string',
  shiftEveningStart: 'string',
  shiftEveningEnd: 'string',

  // Payment (system-wide)
  bankName: 'string',
  bankCode: 'string',
  bankAccount: 'string',
  bankAccountName: 'string',
  sepayApiKey: 'string',
  bankMode: 'string',                // 'UNIFIED' | 'PER_BRANCH'
  defaultTransferTemplate: 'string', // e.g. 'RB {ma}'

  // Notifications
  notify_new_booking: 'boolean',
  notify_payment: 'boolean',
  notify_review: 'boolean',

  // Branding
  logo: 'string',
  primaryColor: 'string',
} as const;

export type SettingKey = keyof typeof SETTINGS_KEYS;

const DEFAULTS: Partial<Record<SettingKey, any>> = {
  defaultOpenTime: '08:00',
  defaultCloseTime: '20:00',
  slotDuration: 30,
  maxAdvanceDays: 30,
  reminderHours: 2,
  shiftMorningStart: '08:00',
  shiftMorningEnd: '12:00',
  shiftAfternoonStart: '12:00',
  shiftAfternoonEnd: '16:00',
  shiftEveningStart: '16:00',
  shiftEveningEnd: '20:00',
  notify_new_booking: true,
  notify_payment: true,
  notify_review: true,
  primaryColor: '#D4A574',
  bankMode: 'UNIFIED',
  defaultTransferTemplate: 'RB {ma}',
};

/** Keys safe to expose without auth */
const PUBLIC_KEYS: SettingKey[] = [
  'businessName', 'contactPhone', 'contactEmail', 'website', 'address',
  'logo', 'primaryColor',
  'defaultOpenTime', 'defaultCloseTime', 'slotDuration', 'maxAdvanceDays',
  'shiftMorningStart', 'shiftMorningEnd',
  'shiftAfternoonStart', 'shiftAfternoonEnd',
  'shiftEveningStart', 'shiftEveningEnd',
];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<Record<string, any>> {
    const rows = await this.prisma.setting.findMany();
    const result: Record<string, any> = { ...DEFAULTS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async getPublic(): Promise<Record<string, any>> {
    const all = await this.getAll();
    const result: Record<string, any> = {};
    for (const key of PUBLIC_KEYS) {
      if (all[key] !== undefined) {
        result[key] = all[key];
      }
    }
    return result;
  }

  async get<T = any>(key: SettingKey, defaultValue?: T): Promise<T> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (row) return row.value as T;
    if (defaultValue !== undefined) return defaultValue;
    return (DEFAULTS[key] ?? null) as T;
  }

  async updateAll(data: Record<string, any>): Promise<Record<string, any>> {
    const validKeys = Object.keys(SETTINGS_KEYS);
    const updates = Object.entries(data)
      .filter(([key]) => validKeys.includes(key))
      .map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          update: { value: value as any },
          create: { key, value: value as any },
        }),
      );
    await Promise.all(updates);
    return this.getAll();
  }

  /** Get shift times for a given shift type */
  async getShiftConfig(): Promise<{
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
    evening: { start: string; end: string };
    fullDay: { start: string; end: string };
  }> {
    const s = await this.getAll();
    return {
      morning: {
        start: s.shiftMorningStart || '08:00',
        end: s.shiftMorningEnd || '12:00',
      },
      afternoon: {
        start: s.shiftAfternoonStart || '12:00',
        end: s.shiftAfternoonEnd || '16:00',
      },
      evening: {
        start: s.shiftEveningStart || '16:00',
        end: s.shiftEveningEnd || '20:00',
      },
      fullDay: {
        start: s.defaultOpenTime || '08:00',
        end: s.defaultCloseTime || '20:00',
      },
    };
  }

  /** Get bank config for payment QR */
  async getBankConfig(): Promise<{
    bankName: string | null;
    bankCode: string | null;
    bankAccount: string | null;
    bankAccountName: string | null;
  }> {
    const s = await this.getAll();
    return {
      bankName: s.bankName || null,
      bankCode: s.bankCode || null,
      bankAccount: s.bankAccount || null,
      bankAccountName: s.bankAccountName || null,
    };
  }
  /** Get bank mode: UNIFIED or PER_BRANCH */
  async getBankMode(): Promise<'UNIFIED' | 'PER_BRANCH'> {
    const mode = await this.get('bankMode', 'UNIFIED');
    return mode === 'PER_BRANCH' ? 'PER_BRANCH' : 'UNIFIED';
  }

  /** Get default transfer content template */
  async getDefaultTransferTemplate(): Promise<string> {
    return this.get('defaultTransferTemplate', 'RB {ma}');
  }
}
