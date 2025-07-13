
import { redirect } from 'next/navigation';

export default function DeprecatedNewReadingSharePage() {
  // This page is now deprecated in favor of the unified /community/new page.
  redirect('/community/new?category=reading-share');
}
