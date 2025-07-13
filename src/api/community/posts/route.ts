
import { NextResponse } from 'next/server';
import { createCommunityPost, createReadingSharePost } from '@/actions/communityActions';
import { ApiCommunityCombinedPayloadSchema } from '@/types';
import type { CommunityPostCategory } from '@/types';

export async function POST(request: Request) {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
  const expectedApiKey = process.env.BLOG_API_SECRET_KEY;

  if (!expectedApiKey || expectedApiKey === 'generate-a-strong-random-string-here') {
    console.error('BLOG_API_SECRET_KEY is not set in the environment variables.');
    return NextResponse.json(
      { success: false, error: 'Server configuration error. API key is not configured.' },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing API key.' },
      { status: 401 }
    );
  }

  try {
    const requestData = await request.json();

    const validationResult = ApiCommunityCombinedPayloadSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const postData = validationResult.data;

    // A generic author object for posts created via API.
    const author = {
      uid: 'api-bot-user',
      displayName: postData.authorName || 'API Bot',
      photoURL: postData.authorPhotoURL || '',
    };
    
    let result;

    switch(postData.category) {
      case 'reading-share':
        result = await createReadingSharePost(postData, author);
        break;
      
      case 'free-discussion':
        result = await createCommunityPost(postData, author, postData.category);
        break;
      
      // This case should not be reached due to Zod validation, but it's good for safety.
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid or unsupported category provided.'},
          { status: 400 }
        );
    }

    if (result.success && result.postId) {
      return NextResponse.json(
        { success: true, postId: result.postId, message: `Community post created successfully in '${postData.category}'.` },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error || `Failed to create community post in '${postData.category}'.` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing community post creation request:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
