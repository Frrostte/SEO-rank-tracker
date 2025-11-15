import {doGoogleSearch} from "@/libs/rankingFunctions";
import mongoose from "mongoose";
import {Keyword} from "../../../models/Keyword";
import {Result} from "../../../models/Result";

export async function GET() {
  mongoose.connect(process.env.MONGODB_URI);
  const keywordsDocs = [...await Keyword.find()];

  const googleSearchPromises = [];
  const savePromises = [];
  for (const keywordDoc of keywordsDocs) {
    const googleSearchPromise = doGoogleSearch(keywordDoc.keyword);
    googleSearchPromise.then(serpApiResults => {
      // Process results immediately
      let rank = null;
      if (serpApiResults?.organic_results) {
        const result = serpApiResults.organic_results.find(r => 
          r.link && r.link.includes(keywordDoc.domain)
        );
        rank = result?.position;
      }
      
      const savePromise = Result.create({
        domain: keywordDoc.domain,
        keyword: keywordDoc.keyword,
        serpApiResults: serpApiResults,
        rank: rank,
        complete: true,
      });
      savePromises.push(savePromise);
    });
    googleSearchPromises.push( googleSearchPromise );
  }
  await Promise.allSettled([...googleSearchPromises, ...savePromises]);
  return Response.json(true);
}