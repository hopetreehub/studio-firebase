
'use server';

import { admin, firestore } from '@/lib/firebase/admin';
import type { UserRecord } from 'firebase-admin/auth';
import type { UserProfileFormData } from '@/types';
import { UserProfileFormSchema } from '@/types';

export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  creationTime?: string;
  lastSignInTime?: string;
  role?: string; 
  birthDate?: string;
  sajuInfo?: string;
  subscriptionStatus?: 'free' | 'paid';
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  try {
    const userRecord = await admin.auth().getUser(uid);
    const profileDoc = await firestore.collection('profiles').doc(uid).get();

    let role = 'user'; // Default role
    const adminEmails = ['admin@innerspell.com', 'junsupark9999@gmail.com'];
    if (userRecord.email && adminEmails.includes(userRecord.email)) {
      role = 'admin';
    } else if (userRecord.customClaims && userRecord.customClaims.role) {
      role = userRecord.customClaims.role as string;
    }

    const appUser: AppUser = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      role: role,
      subscriptionStatus: 'free', // Default to free
    };

    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      appUser.birthDate = profileData?.birthDate || '';
      appUser.sajuInfo = profileData?.sajuInfo || '';
      appUser.subscriptionStatus = profileData?.subscriptionStatus || 'free';
    }

    return appUser;

  } catch (error: any) {
     if (error.code === 'auth/user-not-found') {
      return null;
    }
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: UserProfileFormData): Promise<{ success: boolean; message: string }> {
  const validation = UserProfileFormSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: '유효하지 않은 데이터입니다.' };
  }

  const { displayName, birthDate, sajuInfo } = validation.data;

  try {
    // Update Firebase Auth profile
    await admin.auth().updateUser(uid, {
      displayName,
    });

    // Update Firestore profile document
    await firestore.collection('profiles').doc(uid).set({
      birthDate: birthDate || '',
      sajuInfo: sajuInfo || '',
    }, { merge: true });

    return { success: true, message: '프로필이 성공적으로 업데이트되었습니다.' };

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: `프로필 업데이트 중 오류가 발생했습니다: ${error.message}` };
  }
}


export async function listFirebaseUsers(
  limit: number = 100,
  pageToken?: string
): Promise<{ users: AppUser[]; nextPageToken?: string; error?: string }> {
  try {
    const listUsersResult = await admin.auth().listUsers(limit, pageToken);
    const users: AppUser[] = await Promise.all(listUsersResult.users.map(async (userRecord: UserRecord) => {
      const profile = await getUserProfile(userRecord.uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        role: profile?.role || 'user',
        birthDate: profile?.birthDate,
        sajuInfo: profile?.sajuInfo,
        subscriptionStatus: profile?.subscriptionStatus || 'free',
      };
    }));
    return {
      users,
      nextPageToken: listUsersResult.pageToken,
    };
  } catch (error: any) {
    console.error('Error listing Firebase users:', error);
    return {
      users: [],
      error: `사용자 목록을 가져오는 데 실패했습니다: ${error.message}`,
    };
  }
}

export async function changeUserRole(uid: string, newRole: string): Promise<{ success: boolean, message: string }> {
  console.log(`(SIMULATION) Role change requested for UID: ${uid} to new role: '${newRole}'.`);
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate backend operation delay

  const message = `(시뮬레이션) 사용자 ${uid}의 역할을 '${newRole}'(으)로 변경하는 요청을 처리했습니다. 실제 역할 변경은 Firebase Functions 및 Custom Claims 설정을 통해 서버에서 안전하게 이루어져야 합니다.`;
  return { success: true, message: message };
}
