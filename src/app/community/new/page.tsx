
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityPostForm } from '@/components/community/CommunityPostForm';
import { ReadingSharePostForm } from '@/components/community/ReadingSharePostForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Heart } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

function NewPostPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('category') || 'free-discussion';

  return (
    <div className="max-w-3xl mx-auto">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="free-discussion">
            <Users className="mr-2 h-4 w-4" /> 자유 토론
          </TabsTrigger>
          <TabsTrigger value="reading-share">
            <Heart className="mr-2 h-4 w-4" /> 리딩 공유
          </TabsTrigger>
        </TabsList>
        <TabsContent value="free-discussion">
           <CommunityPostForm />
        </TabsContent>
        <TabsContent value="reading-share">
          <ReadingSharePostForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewPostPage() {
  return (
    // Suspense is required to use useSearchParams in a page rendered on the server.
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner size="large" /></div>}>
      <NewPostPageContent />
    </Suspense>
  );
}
