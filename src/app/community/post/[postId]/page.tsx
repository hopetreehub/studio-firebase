
import { redirect } from 'next/navigation';

export default function DeprecatedPostPage() {
  // This feature is deprecated. Redirect to the main encyclopedia page.
  redirect('/encyclopedia');
}
