export const dynamic = "force-dynamic"; // Prevent prerendering

import mongoose from "mongoose";
import { doGoogleSearch } from "@/libs/rankingFunctions";
import { Keyword } from "@/models/Keyword";
import { Result } from "@/models/Result";

// MongoDB connection helper to avoid multiple connections
async function connectDB() {
  if (mongoose.connection.readyState === 1) return; // already connected
  await mongoose.connect(process.env.MONGODB_URI, {
    // optional, ensures proper parsing
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

export async function GET() {
  await connectDB(); // wait for DB to connect

  const keywordsDocs = await Keyword.find(); // fetch keywords from DB

  const googleSearchPromises = keywordsDocs.map(async (keywordDoc) => {
    const serpApiResults = await doGoogleSearch(keywordDoc.keyword);

    let rank = null;
    if (serpApiResults?.organic_results) {
      const result = serpApiResults.organic_results.find(r =>
        r.link && r.link.includes(keywordDoc.domain)
      );
      rank = result?.position;
    }

    await Result.create({
      domain: keywordDoc.domain,
      keyword: keywordDoc.keyword,
      serpApiResults,
      rank,
      complete: true,
    });
  });

  await Promise.allSettled(googleSearchPromises);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
