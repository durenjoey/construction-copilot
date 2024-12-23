import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';
import { adminDb } from 'lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { LessonLearned, Lesson } from 'lib/types';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { projectId, lesson } = await request.json();

    if (!projectId || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const projectRef = adminDb.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404 }
      );
    }

    // Convert client-side lesson to server-side lesson with Timestamp
    const now = Timestamp.now();
    const serverLesson: Lesson = {
      ...lesson,
      timestamp: now,
      createdAt: lesson.createdAt
    };

    // Get current lessons array or initialize it
    const currentData = projectDoc.data();
    const currentLessons = currentData?.lessonsLearned || [];

    // Update document with new lesson
    await projectRef.update({
      lessonsLearned: [...currentLessons, serverLesson]
    });

    // Revalidate both the lessons page and the project page
    revalidatePath(`/dashboard/${projectId}/lessons`);
    revalidatePath(`/dashboard/${projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lesson added successfully'
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in /api/lessons:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to add lesson'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
