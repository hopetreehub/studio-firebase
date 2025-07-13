
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

// Get all comments for a specific post
export async function getCommentsForPost(postId: string): Promise<CommunityComment[]> {
  try {
    const snapshot = await firestore
      .collection('communityPosts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();
      
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(mapDocToCommunityComment);
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    // Return empty array on error to prevent UI crash
    return [];
  }
}

// Add a new comment to a post
export async function addComment(
  postId: string,
  formData: CommunityCommentFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; commentId?: string; error?: string | object }> {
  try {
    const validationResult = CommunityCommentFormSchema.safeParse(formData);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().fieldErrors };
    }

    const { content } = validationResult.data;
    const postRef = firestore.collection('communityPosts').doc(postId);
    const commentRef = postRef.collection('comments').doc();

    const newComment = {
      authorId: author.uid,
      authorName: author.displayName || '익명',
      authorPhotoURL: author.photoURL || '',
      content: content,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await firestore.runTransaction(async (transaction) => {
      transaction.set(commentRef, newComment);
      transaction.update(postRef, {
        commentCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    
    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error(`Error adding comment to post ${postId}:`, error);
    return { success: false, error: '댓글을 추가하는 중 오류가 발생했습니다.' };
  }
}

// Delete a comment
export async function deleteComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const postRef = firestore.collection('communityPosts').doc(postId);
    const commentRef = postRef.collection('comments').doc(commentId);
    
    const doc = await commentRef.get();
    if (!doc.exists) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }
    
    if (doc.data()?.authorId !== userId) {
      return { success: false, error: '댓글을 삭제할 권한이 없습니다.' };
    }

    await firestore.runTransaction(async (transaction) => {
      transaction.delete(commentRef);
      transaction.update(postRef, {
        commentCount: FieldValue.increment(-1),
      });
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting comment ${commentId} from post ${postId}:`, error);
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' };
  }
}

// Update a comment
export async function updateComment(
  postId: string,
  commentId: string,
  content: string,
  userId: string
): Promise<{ success: boolean; error?: string | object }> {
    try {
    const validationResult = CommunityCommentFormSchema.safeParse({ content });
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().fieldErrors };
    }

    const commentRef = firestore.collection('communityPosts').doc(postId).collection('comments').doc(commentId);
    const doc = await commentRef.get();

    if (!doc.exists) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }
    
    if (doc.data()?.authorId !== userId) {
      return { success: false, error: '댓글을 수정할 권한이 없습니다.' };
    }
    
    await commentRef.update({
      content: validationResult.data.content,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error(`Error updating comment ${commentId} from post ${postId}:`, error);
    return { success: false, error: '댓글 수정 중 오류가 발생했습니다.' };
  }
}
