import { NextResponse } from "next/server";
import { products } from "@ecom/catalog";
export async function GET() { return NextResponse.json({ products }); }
