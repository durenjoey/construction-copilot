import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { ProjectStatus } from '@/lib/types'
import * as docx from 'docx'
import { Paragraph, TextRun, HeadingLevel } from 'docx'

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get project data
    const projectDoc = await adminDb.collection('projects').doc(projectId).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = projectDoc.data() as ProjectStatus
    if (!project.scope) {
      return NextResponse.json(
        { error: 'No scope found for this project' },
        { status: 404 }
      )
    }

    // Create Word document
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: project.name,
            heading: HeadingLevel.HEADING_1,
            spacing: {
              after: 200
            }
          }),
          new Paragraph({
            text: "Project Scope",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              after: 200
            }
          }),
          ...project.scope.content.split('\n').map(line => 
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24 // 12pt
                })
              ],
              spacing: {
                after: 120 // 6pt
              }
            })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: `Last Updated: ${new Date(project.scope.updatedAt).toLocaleDateString()}`,
                size: 20,
                color: "666666"
              })
            ],
            spacing: {
              before: 400
            }
          })
        ]
      }]
    })

    // Generate document buffer
    const buffer = await docx.Packer.toBuffer(doc)

    // Return the document as a downloadable file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${project.name}-Scope.docx"`,
      },
    })

  } catch (error) {
    console.error('Error generating scope document:', error)
    return NextResponse.json(
      { error: 'Failed to generate scope document' },
      { status: 500 }
    )
  }
}
