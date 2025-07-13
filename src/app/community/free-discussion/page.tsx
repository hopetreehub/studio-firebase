
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
  // This feature is deprecated. Redirect to the main encyclopedia page.
  redirect('/encyclopedia');
}
