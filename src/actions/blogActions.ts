'use server';

import type { BlogFormData } from '@/types';

/**
 * @deprecated The blog is managed externally. This function is a placeholder to prevent build errors.
 * Any calls to this will result in an error response. The corresponding API route is also deprecated.
 */
export async function submitBlogPost(
  data: BlogFormData,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  console.warn("submitBlogPost function was called, but the blog is managed externally. No action was taken.");
  return { success: false, error: "The internal blog functionality is deprecated." };
}
