
'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { CommunityComment } from '@/types';
import { CommunityCommentFormSchema, CommunityCommentFormData } from '@/types';

// Helper to map Firestore doc to CommunityComment type
function mapDocToCommunityComment(doc: FirebaseFirestore.DocumentSnapshot): CommunityComment {
  const data = doc.data()!; // Assume data exists
  const now = new Date();
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : now;
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : createdAt;

  return {
    id: doc.id,
    postId: data.postId,
    authorId: data.authorId,
    authorName: data.authorName || '익명 사용자',
    authorPhotoURL: data.authorPhotoURL || '',
    content: data.content,
    createdAt,
    updatedAt,
  };
}

// Get all comments for a specific post - DEPRECATED
export async function getCommentsForPost(postId: string): Promise<CommunityComment[]> {
  console.warn(`getCommentsForPost is deprecated and was called for post ${postId}. Returning empty array.`);
  return [];
}

// Add a new comment to a post - DEPRECATED
export async function addComment(
  postId: string,
  formData: CommunityCommentFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; commentId?: string; error?: string | object }> {
  console.warn("addComment is deprecated. No action was taken.");
  return { success: false, error: "댓글 기능은 현재 비활성화되어 있습니다." };
}

// Delete a comment - DEPRECATED
export async function deleteComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  console.warn("deleteComment is deprecated. No action was taken.");
  return { success: false, error: "댓글 기능은 현재 비활성화되어 있습니다." };
}

// Update a comment - DEPRECATED
export async function updateComment(
  postId: string,
  commentId: string,
  content: string,
  userId: string
): Promise<{ success: boolean; error?: string | object }> {
  console.warn("updateComment is deprecated. No action was taken.");
  return { success: false, error: "댓글 기능은 현재 비활성화되어 있습니다." };
}
