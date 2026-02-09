/**
 * Zalo Notification Service
 *
 * Handles Zalo-specific notifications:
 * - Follow Official Account prompts
 * - Share booking to Zalo chat
 * - Open Zalo customer service chat
 */

import {
  followOA,
  openShareSheet,
  openChat,
  getPhoneNumber,
  getUserInfo,
} from 'zmp-sdk';
import { BRAND_CONFIG } from '../config';

// Official Account ID - configured in app.json
const OA_ID = BRAND_CONFIG.zaloOAId || '';

/**
 * Prompt user to follow Official Account
 * This enables receiving notifications from the salon
 */
export async function promptFollowOA(): Promise<boolean> {
  try {
    if (!OA_ID) {
      console.warn('Zalo OA ID not configured');
      return false;
    }

    await followOA({
      id: OA_ID,
    });
    return true;
  } catch (error: any) {
    // User declined or error occurred
    console.log('Follow OA failed:', error.message);
    return false;
  }
}

/**
 * Check if user is following the Official Account
 */
export async function checkFollowingOA(): Promise<boolean> {
  // Note: This requires user authorization
  // The actual check is done server-side via Zalo API
  return false; // Default to false, let server determine
}

export interface ShareBookingData {
  bookingCode: string;
  salonName: string;
  date: string;
  time: string;
  services: string[];
  totalAmount?: number;
}

export interface ShareSalonData {
  salonName: string;
  address: string;
  phone?: string;
  rating?: number;
  id?: string;
  image?: string;
}

/**
 * Share booking details to Zalo chat
 */
export async function shareBooking(data: ShareBookingData): Promise<boolean> {
  try {
    const servicesText = data.services.join(', ');
    const amountText = data.totalAmount
      ? new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(data.totalAmount)
      : '';

    const description = `${data.date} lúc ${data.time} - ${servicesText}${amountText ? ` - ${amountText}` : ''}`;

    await openShareSheet({
      type: 'zmp',
      data: {
        title: `Đặt lịch ${data.salonName}`,
        description: description,
        thumbnail: BRAND_CONFIG.logoUrl,
        path: `/booking-detail?code=${data.bookingCode}`,
      },
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Share booking failed:', error);
    return false;
  }
}

/**
 * Share salon to Zalo chat
 */
export async function shareSalon(data: ShareSalonData): Promise<boolean> {
  try {
    const ratingText = data.rating ? `(${data.rating.toFixed(1)})` : '';
    await openShareSheet({
      type: 'zmp',
      data: {
        title: `${data.salonName} ${ratingText}`.trim(),
        description: data.address,
        thumbnail: data.image || BRAND_CONFIG.logoUrl,
        path: data.id ? `/salon-detail?id=${data.id}` : '/',
      },
    });
    return true;
  } catch (error) {
    console.error('Share salon failed:', error);
    return false;
  }
}

/**
 * Open chat with salon's Official Account
 */
export async function openSalonChat(message?: string): Promise<boolean> {
  try {
    if (!OA_ID) {
      console.warn('Zalo OA ID not configured');
      return false;
    }

    await openChat({
      type: 'oa',
      id: OA_ID,
      message: message || `Xin chào! Tôi cần hỗ trợ về đặt lịch.`,
    });
    return true;
  } catch (error) {
    console.error('Open chat failed:', error);
    return false;
  }
}

/**
 * Get user's phone number for booking
 * Requires user permission
 */
export async function requestPhoneNumber(): Promise<string | null> {
  try {
    const { number } = await getPhoneNumber({});
    return number || null;
  } catch (error) {
    console.error('Get phone number failed:', error);
    return null;
  }
}

/**
 * Get user info from Zalo
 */
export async function getZaloUserInfo(): Promise<{
  id: string;
  name: string;
  avatar: string;
} | null> {
  try {
    const info = await getUserInfo({});
    if (info?.userInfo) {
      return {
        id: info.userInfo.id,
        name: info.userInfo.name,
        avatar: info.userInfo.avatar,
      };
    }
    return null;
  } catch (error) {
    console.error('Get user info failed:', error);
    return null;
  }
}
