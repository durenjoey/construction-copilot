import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 });
    }

    // Get the project to verify ownership
    const projectRef = adminDb.collection("projects").doc(projectId);
    const project = await projectRef.get();

    if (!project.exists) {
      return new NextResponse("Project not found", { status: 404 });
    }

    if (project.data()?.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the project
    await projectRef.delete();

    return new NextResponse("Project deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
