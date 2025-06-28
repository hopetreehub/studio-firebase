
'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { CommunityPost, CommunityPostCategory } from '@/types';
import { CommunityPostFormSchema, CommunityPostFormData, ReadingSharePostFormData, ReadingSharePostFormSchema } from '@/types';

// Helper to safely map Firestore doc to CommunityPost type
function mapDocToCommunityPost(doc: FirebaseFirestore.DocumentSnapshot): CommunityPost {
  const data = doc.data();
  const now = new Date();

  // Fallback for documents without data to prevent crashes
  if (!data) {
    return {
        id: doc.id,
        authorId: 'system',
        authorName: 'Unknown Author',
        title: 'Invalid Post Data',
        content: 'This post could not be loaded due to missing data.',
        viewCount: 0,
        commentCount: 0,
        category: 'free-discussion',
        createdAt: now,
        updatedAt: now,
    };
  }

  // Robustly handle createdAt timestamp
  const createdAt = (data.createdAt && typeof data.createdAt.toDate === 'function')
    ? data.createdAt.toDate()
    : now;

  // Robustly handle updatedAt timestamp
  const updatedAt = (data.updatedAt && typeof data.updatedAt.toDate === 'function')
    ? data.updatedAt.toDate()
    : createdAt; // Fallback to createdAt if updatedAt is invalid

  return {
    id: doc.id,
    authorId: data.authorId || 'system-user',
    authorName: data.authorName || '익명 사용자',
    authorPhotoURL: data.authorPhotoURL || '',
    title: data.title || '제목 없음',
    content: data.content || '',
    viewCount: data.viewCount || 0,
    commentCount: data.commentCount || 0,
    category: data.category || 'free-discussion',
    readingQuestion: data.readingQuestion || '',
    cardsInfo: data.cardsInfo || '',
    createdAt: createdAt,
    updatedAt: updatedAt,
  };
}

// Get community posts for a specific category
export async function getCommunityPosts(category: CommunityPostCategory): Promise<CommunityPost[]> {
  try {
    const snapshot = await firestore.collection('communityPosts')
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .get();
      
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(mapDocToCommunityPost);
  } catch (error) {
    console.error(`Error fetching ${category} posts from Firestore:`, error);
    throw new Error(`커뮤니티 게시글(${category})을 불러오는 중 오류가 발생했습니다.`);
  }
}

// Get a single community post by ID
export async function getCommunityPostById(postId: string): Promise<CommunityPost | null> {
  try {
    const docRef = firestore.collection('communityPosts').doc(postId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log(`Post with ID ${postId} not found in Firestore.`);
      return null;
    }
    
    // Increment view count without affecting the data returned to this request.
    // This is a "fire-and-forget" operation for performance.
    docRef.update({ viewCount: FieldValue.increment(1) }).catch(err => {
        console.error(`Failed to increment view count for post ${postId}:`, err);
    });
    
    return mapDocToCommunityPost(doc);

  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    throw new Error(`게시글(ID: ${postId})을 불러오는 중 오류가 발생했습니다.`);
  }
}


// Create a new free-discussion, q-and-a, deck-review, or study-group post
export async function createCommunityPost(
  formData: CommunityPostFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null },
  category: 'free-discussion' | 'q-and-a' | 'deck-review' | 'study-group'
): Promise<{ success: boolean; postId?: string; error?: string | object }> {
  try {
    const validationResult = CommunityPostFormSchema.safeParse(formData);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().fieldErrors };
    }
    if (!author || !author.uid) {
        return { success: false, error: "글을 작성하려면 로그인이 필요합니다." };
    }

    const { title, content } = validationResult.data;

    const newPostData = {
      authorId: author.uid,
      authorName: author.displayName || '익명 사용자',
      authorPhotoURL: author.photoURL || '',
      title,
      content,
      category: category,
      viewCount: 0,
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('communityPosts').add(newPostData);
    console.log(`Created new community post with ID: ${docRef.id} in category '${category}'`);
    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Error creating community post:', error);
    return { success: false, error: error instanceof Error ? error.message : '게시물 생성 중 알 수 없는 오류가 발생했습니다.' };
  }
}

// Create a new reading-share post
export async function createReadingSharePost(
  formData: ReadingSharePostFormData,
  author: { uid: string; displayName?: string | null; photoURL?: string | null }
): Promise<{ success: boolean; postId?: string; error?: string | object }> {
  try {
    const validationResult = ReadingSharePostFormSchema.safeParse(formData);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.flatten().fieldErrors };
    }
    if (!author || !author.uid) {
      return { success: false, error: "글을 작성하려면 로그인이 필요합니다." };
    }

    const { title, readingQuestion, cardsInfo, content } = validationResult.data;

    const newPostData = {
      authorId: author.uid,
      authorName: author.displayName || '익명 사용자',
      authorPhotoURL: author.photoURL || '',
      title,
      readingQuestion,
      cardsInfo,
      content,
      category: 'reading-share' as CommunityPostCategory,
      viewCount: 0,
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection('communityPosts').add(newPostData);
    console.log(`Created new reading-share post with ID: ${docRef.id}`);
    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Error creating reading share post:', error);
    return { success: false, error: error instanceof Error ? error.message : '리딩 공유 게시물 생성 중 알 수 없는 오류가 발생했습니다.' };
  }
}

// Delete a community post and its comments
export async function deleteCommunityPost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const postRef = firestore.collection('communityPosts').doc(postId);
    const doc = await postRef.get();

    if (!doc.exists) {
      return { success: false, error: '삭제할 게시물을 찾을 수 없습니다.' };
    }

    const postData = doc.data();
    // In a real app, you might also allow admins to delete posts
    if (postData?.authorId !== userId) {
      return { success: false, error: '이 게시물을 삭제할 권한이 없습니다.' };
    }

    // Delete comments in a batch
    const commentsRef = postRef.collection('comments');
    const commentsSnapshot = await commentsRef.get();
    
    const batch = firestore.batch();
    
    commentsSnapshot.docs.forEach(commentDoc => {
      batch.delete(commentDoc.ref);
    });

    // Delete the post itself
    batch.delete(postRef);

    await batch.commit();
    
    console.log(`Successfully deleted community post ${postId} and its ${commentsSnapshot.size} comments.`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : '게시물 삭제 중 오류가 발생했습니다.' };
  }
}
