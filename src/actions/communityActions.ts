
'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { CommunityPost, CommunityPostCategory } from '@/types';
import { FreeDiscussionPostFormSchema, type FreeDiscussionPostFormData } from '@/types';

const POSTS_PER_PAGE = 15;

// Helper to map Firestore doc to CommunityPost type
function mapDocToCommunityPost(doc: FirebaseFirestore.DocumentSnapshot): CommunityPost {
  const data = doc.data()!; // Assume data exists
  const now = new Date();
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : now;
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : createdAt;

  return {
    id: doc.id,
    authorId: data.authorId,
    authorName: data.authorName || '익명',
    authorPhotoURL: data.authorPhotoURL || '',
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl || null,
    viewCount: data.viewCount || 0,
    commentCount: data.commentCount || 0,
    category: data.category,
    createdAt,
    updatedAt,
  };
}


export async function getCommunityPosts(
  category: CommunityPostCategory,
  page: number = 1
): Promise<{ posts: CommunityPost[]; totalPages: number }> {
  try {
    const postsRef = firestore.collection('communityPosts');
    const queryByCategory = postsRef.where('category', '==', category);
    
    // Get total count for pagination
    const countPromise = queryByCategory.count().get();
    
    // Construct the query for the posts
    let postsQuery = queryByCategory.orderBy('createdAt', 'desc');

    if (page > 1) {
      const offset = (page - 1) * POSTS_PER_PAGE;
      const lastVisibleSnapshot = await queryByCategory.orderBy('createdAt', 'desc').limit(offset).get();
      if (!lastVisibleSnapshot.empty) {
        const lastVisibleDoc = lastVisibleSnapshot.docs[lastVisibleSnapshot.docs.length - 1];
        postsQuery = postsQuery.startAfter(lastVisibleDoc);
      }
    }
    const postsPromise = postsQuery.limit(POSTS_PER_PAGE).get();

    // Await both promises
    const [countSnapshot, postsSnapshot] = await Promise.all([countPromise, postsPromise]);
    
    const totalPosts = countSnapshot.data().count;
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    const posts = postsSnapshot.docs.map(mapDocToCommunityPost);
    
    return { posts, totalPages };

  } catch (error) {
    console.error(`Error fetching community posts for category ${category}:`, error);
    // Return empty state on error to prevent UI crash
    return { posts: [], totalPages: 1 };
  }
}

export async function getCommunityPostById(postId: string): Promise<CommunityPost | null> {
  try {
    const docRef = firestore.collection('communityPosts').doc(postId);
    const doc = await doc.get();

    if (!doc.exists) {
      return null;
    }
    
    // Atomically increment view count
    docRef.update({ viewCount: FieldValue.increment(1) }).catch(err => {
      // Log error but don't block returning the post
      console.error(`Failed to increment view count for post ${postId}:`, err);
    });

    return mapDocToCommunityPost(doc);
  } catch (error) {
    console.error(`Error fetching post by ID ${postId}:`, error);
    return null;
  }
}

export async function createFreeDiscussionPost(
  formData: FreeDiscussionPostFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; postId?: string; error?: string | object }> {
  try {
    const validationResult = FreeDiscussionPostFormSchema.safeParse(formData);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().fieldErrors };
    }

    const { title, content, imageUrl } = validationResult.data;

    const newPostData = {
      authorId: author.uid,
      authorName: author.displayName || '익명',
      authorPhotoURL: author.photoURL || '',
      title,
      content,
      imageUrl: imageUrl || null,
      category: 'free-discussion' as CommunityPostCategory,
      viewCount: 0,
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('communityPosts').add(newPostData);
    return { success: true, postId: docRef.id };

  } catch (error) {
    console.error('Error creating free discussion post:', error);
    return { success: false, error: '게시물 생성 중 오류가 발생했습니다.' };
  }
}

export async function deleteCommunityPost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = firestore.collection('communityPosts').doc(postId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: '게시물을 찾을 수 없습니다.' };
    }
    
    if (doc.data()?.authorId !== userId) {
      return { success: false, error: '이 게시물을 삭제할 권한이 없습니다.' };
    }

    // Note: This does not delete subcollections like comments. For a full cleanup, a Cloud Function would be needed.
    await docRef.delete();

    return { success: true };
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    return { success: false, error: '게시물 삭제 중 오류가 발생했습니다.' };
  }
}
