
import { redirect } from 'next/navigation';

// This page is now deprecated. Redirect to the main community hub.
export default function DeprecatedNewPostPage() {
  redirect('/community');
}
