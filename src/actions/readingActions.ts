
'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { SavedReading, SavedReadingCard } from '@/types';
import { getCardById } from '@/lib/tarot-data';
import { SaveReadingInputSchema, type SaveReadingInput } from '@/types';


export async function saveUserReading(
  input: SaveReadingInput
): Promise<{ success: boolean; readingId?: string; error?: string | object }> {
  try {
    // Validate the input using the centralized schema from types/index.ts
    const validationResult = SaveReadingInputSchema.safeParse(input);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().fieldErrors };
    }

    const { userId, question, spreadName, spreadNumCards, drawnCards, interpretationText } = validationResult.data;

    const readingData = {
      userId,
      question,
      spreadName,
      spreadNumCards,
      drawnCards, // Saves the simplified, validated card info
      interpretationText,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('userReadings').add(readingData);
    console.log(`User reading saved successfully with ID: ${docRef.id} for user ${userId}.`);
    return { success: true, readingId: docRef.id };

  } catch (error) {
    console.error('Error saving user reading to Firestore:', error);
    return { success: false, error: error instanceof Error ? error.message : '리딩 저장 중 알 수 없는 오류가 발생했습니다.' };
  }
}

export async function getUserReadings(userId: string): Promise<SavedReading[]> {
  if (!userId) {
    console.warn('getUserReadings called without userId.');
    return [];
  }
  try {
    const snapshot = await firestore
      .collection('userReadings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50) // Limit to last 50 readings for performance
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const now = new Date();

      const createdAt = (data?.createdAt && typeof data.createdAt.toDate === 'function')
        ? data.createdAt.toDate()
        : now;
        
      // Reconstruct full card details from saved IDs and orientation
      const rawDrawnCards = (data?.drawnCards as { id: string; isReversed: boolean; position?: string }[]) || [];
      const drawnCards: SavedReadingCard[] = rawDrawnCards.map(rawCard => {
        const cardDetails = getCardById(rawCard.id);
        return {
          id: rawCard.id,
          isReversed: rawCard.isReversed,
          position: rawCard.position,
          name: cardDetails?.name || '알 수 없는 카드',
          imageSrc: cardDetails?.imageSrc || '/images/tarot/back.png', // Fallback image
        };
      });

      return {
        id: doc.id,
        userId: data?.userId || '',
        question: data?.question || 'No question provided',
        spreadName: data?.spreadName || 'Unknown Spread',
        spreadNumCards: data?.spreadNumCards || 0,
        drawnCards: drawnCards, // Use the reconstructed rich card data
        interpretationText: data?.interpretationText || 'No interpretation text.',
        createdAt: createdAt,
      } as SavedReading;
    });
  } catch (error) {
    console.error(`Error fetching readings for user ${userId}:`, error);
    // Instead of throwing, return an empty array to prevent UI crash.
    return [];
  }
}

export async function deleteUserReading(userId: string, readingId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !readingId) {
    return { success: false, error: '사용자 ID 또는 리딩 ID가 제공되지 않았습니다.' };
  }
  try {
    const readingRef = firestore.collection('userReadings').doc(readingId);
    const doc = await readingRef.get();

    if (!doc.exists) {
      return { success: false, error: '삭제할 리딩을 찾을 수 없습니다.' };
    }

    if (doc.data()?.userId !== userId) {
      return { success: false, error: '이 리딩을 삭제할 권한이 없습니다.' };
    }

    await readingRef.delete();
    console.log(`User reading ${readingId} deleted successfully for user ${userId}.`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user reading from Firestore:', error);
    return { success: false, error: error instanceof Error ? error.message : '리딩 삭제 중 알 수 없는 오류가 발생했습니다.' };
  }
}
