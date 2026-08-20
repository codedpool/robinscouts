import { NextResponse } from "next/server";
import { getJob } from "@/lib/scraperJobs";

export async function GET(request, { params }) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Unknown job id" }, { status: 404 });
  }

  return NextResponse.json(job);
}
