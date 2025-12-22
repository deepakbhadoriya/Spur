import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { getDocumentsCollection } from "@/lib/db";
import type { DocumentRecord } from "@/types";

export async function GET() {
  try {
    const documentsCollection = await getDocumentsCollection();
    const docs = (await documentsCollection
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray()) as DocumentRecord[];

    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error in GET /api/chat/documents:", error);
    return NextResponse.json(
      { error: "Failed to load documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const type = (formData.get("type") as DocumentRecord["type"]) || "custom";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A PDF file is required." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use PDFParse class API to extract text from the uploaded PDF
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();

    const content = textResult.text.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Uploaded PDF appears to be empty." },
        { status: 400 }
      );
    }

    const documentsCollection = await getDocumentsCollection();
    const now = new Date().toISOString();

    const doc: DocumentRecord = {
      name: file.name,
      content,
      type,
      uploadedAt: now,
    };

    const insertResult = await documentsCollection.insertOne(doc);

    return NextResponse.json(
      { ...doc, _id: String(insertResult.insertedId) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/chat/documents:", error);
    return NextResponse.json(
      { error: "Failed to upload and process document" },
      { status: 500 }
    );
  }
}


