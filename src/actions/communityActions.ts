
'use server';

import { z } from 'zod';
import { firestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CommunityPost, CommunityPostCategory } from '@/types';
import { FreeDiscussionPostFormSchema, ReadingSharePostFormSchema, type FreeDiscussionPostFormData, type ReadingSharePostFormData } from '@/types';

const POSTS_PER_PAGE = 15;

function mapDocToCommunityPost(doc: FirebaseFirestore.DocumentSnapshot): CommunityPost {
  const data = doc.data();
  const now = new Date();

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

  const createdAt = (data.createdAt && typeof data.createdAt.toDate === 'function')
    ? data.createdAt.toDate()
    : now;

  const updatedAt = (data.updatedAt && typeof data.updatedAt.toDate === 'function')
    ? data.updatedAt.toDate()
    : createdAt;

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

export async function getCommunityPosts(
  category: CommunityPostCategory,
  page: number = 1
): Promise<{ posts: CommunityPost[]; totalPages: number }> {
  try {
    const postsRef = firestore.collection('communityPosts');
    const queryByCategory = postsRef.where('category', '==', category);

    const countPromise = queryByCategory.count().get();
    
    let postsQuery = queryByCategory.orderBy('createdAt', 'desc');
    if (page > 1) {
      const startAfterDocSnapshot = await queryByCategory
        .orderBy('createdAt', 'desc')
        .limit((page - 1) * POSTS_PER_PAGE)
        .get();
        
      const lastVisibleDoc = startAfterDocSnapshot.docs[startAfterDocSnapshot.docs.length - 1];
        
      if(lastVisibleDoc) {
        postsQuery = postsQuery.startAfter(lastVisibleDoc);
      }
    }
    const postsPromise = postsQuery.limit(POSTS_PER_PAGE).get();

    const [countSnapshot, postsSnapshot] = await Promise.all([countPromise, postsPromise]);

    const totalPosts = countSnapshot.data().count;
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE) || 1;

    if (postsSnapshot.empty) {
      return { posts: [], totalPages };
    }
    
    const posts = postsSnapshot.docs.map(mapDocToCommunityPost);

    return { posts, totalPages };

  } catch (error) {
    console.error(`CRITICAL: Error fetching posts for category '${category}' from Firestore:`, error);
    return { posts: [], totalPages: 1 };
  }
}

export async function getCommunityPostById(postId: string): Promise<CommunityPost | null> {
  try {
    const docRef = firestore.collection('communityPosts').doc(postId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }
    
    docRef.update({ viewCount: FieldValue.increment(1) }).catch(err => {
        console.error(`Failed to increment view count for post ${postId}:`, err);
    });
    
    return mapDocToCommunityPost(doc);
  } catch (error) {
     console.error(`CRITICAL: Error fetching post with ID ${postId}:`, error);
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
    return { success: false, error: error instanceof Error ? error.message : '게시물 생성 중 알 수 없는 오류가 발생했습니다.' };
  }
}

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
    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Error creating reading share post:', error);
    return { success: false, error: error instanceof Error ? error.message : '리딩 공유 게시물 생성 중 알 수 없는 오류가 발생했습니다.' };
  }
}

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
    if (postData?.authorId !== userId) {
      return { success: false, error: '이 게시물을 삭제할 권한이 없습니다.' };
    }

    const commentsRef = postRef.collection('comments');
    const commentsSnapshot = await commentsRef.get();
    
    const batch = firestore.batch();
    
    commentsSnapshot.docs.forEach(commentDoc => {
      batch.delete(commentDoc.ref);
    });

    batch.delete(postRef);

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : '게시물 삭제 중 오류가 발생했습니다.' };
  }
}
