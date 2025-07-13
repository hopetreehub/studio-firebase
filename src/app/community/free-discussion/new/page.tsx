
import { redirect } from 'next/navigation';

export default function DeprecatedNewPostPage() {
  // This feature is deprecated. Redirect to the main encyclopedia page.
  redirect('/encyclopedia');
}
