
'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CommunityPost, CommunityPostCategory } from '@/types';
import { FreeDiscussionPostFormSchema, ReadingSharePostFormSchema, type FreeDiscussionPostFormData, type ReadingSharePostFormData } from '@/types';


// DEPRECATED - This function will no longer return posts.
export async function getCommunityPosts(
  category: CommunityPostCategory,
  page: number = 1
): Promise<{ posts: CommunityPost[]; totalPages: number }> {
    console.warn(`getCommunityPosts is deprecated and was called for category '${category}'. Returning empty array.`);
    return { posts: [], totalPages: 1 };
}

// DEPRECATED - This function will no longer return a post.
export async function getCommunityPostById(postId: string): Promise<CommunityPost | null> {
    console.warn(`getCommunityPostById is deprecated and was called for post ID ${postId}. Returning null.`);
    return null;
}

// DEPRECATED - This function will not create a post.
export async function createFreeDiscussionPost(
  formData: FreeDiscussionPostFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; postId?: string; error?: string | object }> {
  console.warn("createFreeDiscussionPost is deprecated. No action was taken.");
  return { success: false, error: '게시물 생성 기능은 현재 비활성화되어 있습니다.' };
}

// DEPRECATED - This function will not create a post.
export async function createReadingSharePost(
  formData: ReadingSharePostFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; postId?: string; error?: string | object }> {
    console.warn("createReadingSharePost is deprecated. No action was taken.");
    return { success: false, error: '게시물 생성 기능은 현재 비활성화되어 있습니다.' };
}

// DEPRECATED - This function will not delete a post.
export async function deleteCommunityPost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
    console.warn("deleteCommunityPost is deprecated. No action was taken.");
    return { success: false, error: '게시물 삭제 기능은 현재 비활성화되어 있습니다.' };
}
