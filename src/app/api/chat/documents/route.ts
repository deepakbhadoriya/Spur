import { NextRequest, NextResponse } from "next/server";
import { getDocumentsCollection } from "@/lib/db";
import type { DocumentRecord } from "@/types";

// Polyfill DOMMatrix for environments that lack it (like Vercel serverless)
if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-ignore
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() { }
  };
}

// @ts-ignore
const pdf = require("pdf-parse");

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

    // File size validation: 5MB limit
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Attempting to parse PDF: ${file.name}, size: ${file.size} bytes`);

    // Use standard pdf-parse to extract text
    let content = "";
    try {
      // @ts-ignore
      const data = await pdf(buffer);
      content = data.text.trim();
      console.log(`Successfully parsed PDF: ${file.name}`);
    } catch (pdfError) {
      console.error("PDF parsing error for file", file.name, ":", pdfError);
      return NextResponse.json(
        { error: "Failed to parse PDF. The file may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Uploaded PDF appears to be empty or contains no extractable text." },
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
      { error: "Failed to upload and process document. Please try again." },
      { status: 500 }
    );
  }
}


