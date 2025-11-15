export const dynamic = "force-dynamic";
import axios from "axios";
import mongoose from "mongoose";
import {Result} from "../../../models/Result";
import {URL} from 'url';

export async function POST(req) {
  mongoose.connect(process.env.MONGODB_URI);
  const data = await req.json();
  const keyword = data.keyword;
  const domain = data.domain;
  
  try {
    const ourResultDoc = await Result.findOne({
      domain: domain,
      keyword: keyword,
    });
    
    if (ourResultDoc && ourResultDoc.serpApiResults) {
      console.log('Processing results for keyword:', keyword);
      const organic_results = ourResultDoc.serpApiResults.organic_results || [];
      
      // Find the rank for our domain
      const rank = organic_results.find(result => 
        result.link && result.link.includes(domain)
      )?.position;
      
      ourResultDoc.complete = true;
      if (rank) {
        ourResultDoc.rank = rank;
        console.log(`Rank ${rank} saved for keyword ${keyword} and domain ${domain}`);
      } else {
        console.log(`Domain not found in results for keyword ${keyword}`);
      }
      await ourResultDoc.save();
      return Response.json({success: true, rank});
    } else {
      console.log('Result document not found or no serpApiResults');
      return Response.json({success: false, error: 'No results found'});
    }
  } catch (error) {
    console.error('Error processing results:', error);
    return Response.json({success: false, error: error.message}, {status: 500});
  }
}

export async function GET(req) {
  mongoose.connect(process.env.MONGODB_URI);
  const url = new URL(req.url);
  const domain = url.searchParams.get('domain');
  const keyword = url.searchParams.get('keyword');
  
  if (domain && keyword) {
    return Response.json(
      await Result.find({domain, keyword})
    );
  }
  
  return Response.json({error: 'Missing domain or keyword'}, {status: 400});
}