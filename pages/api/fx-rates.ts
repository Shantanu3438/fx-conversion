import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { Redis } from "ioredis";
import {v4 as uuidv4} from 'uuid';
const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

/**
 * @swagger
 * /api/fx-rates:
 *   get:
 *     summary: Get foreign exchange rates
 *     description: |
 *       This endpoint retrieves foreign exchange rates from a Redis cache. If the rates are not available
 *       in the cache, it fetches them from an external API and stores them in Redis for future use.
 *     responses:
 *       200:
 *         description: Successful retrieval of foreign exchange rates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quoteID:
 *                   type: integer
 *                   description: Timestamp of when the rates were fetched.
 *                 Rates:
 *                   type: object
 *                   description: Object containing foreign exchange rates.
 *                   example: {"EUR": {"USD": 1.2}, "USD": {"EUR": 0.8}}
 *                 expires_in:
 *                   type: integer
 *                   description: Time to live (TTL) of the cached rates in seconds.
 *       default:
 *         description: Error occurred while fetching foreign exchange rates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the reason for failure.
 */


const prisma = new PrismaClient();

const common_fx_rates: {[key: string]: string[]} = {
    // "USD" : ["CAD", "CNY", "HKD"],
    "EUR" : ["USD"], //, "GBP"
    // "AUD" : ["USD"],
    // "GBP" : ["USD"],
}


export async function set_rates_redis() {
    const quoteid = uuidv4();
    for (const [prim_currency, sec_currencies] of Object.entries(common_fx_rates)) {
        for (const sec_currency of sec_currencies) {
            try {
                const response = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${prim_currency}&to_currency=${sec_currency}&apikey=M6Z14YX5QV323ZUK`);
                if (response.ok) {
                    const data = await response.json();
                    // redis.set(`${prim_currency}:${sec_currency}`, data["Realtime Currency Exchange Rate"]["5. Exchange Rate"], 'EX', 30);   
                    redis.set(`${quoteid}_${prim_currency}:${sec_currency}`, data["Realtime Currency Exchange Rate"]["5. Exchange Rate"],'EX', 30);
                    redis.set("quoteid", quoteid, 'EX', 30);
                }
            } catch (error) {
                console.error("Error while setting the rates in redis", error);
            }
        }
    console.log('API request made');
    return quoteid;
}}

export async function get_rates_redis(quoteID: string) {
    const fx_rates: Record<string, Record<string, number>> = {};
  
    for (const [prim_currency, sec_currencies] of Object.entries(common_fx_rates)) {
      fx_rates[prim_currency] = {};
      for (const sec_currency of sec_currencies) {
        const rate = await redis.get(`${quoteID}_${prim_currency}:${sec_currency}`);
        
        if (rate !== null) {
          fx_rates[prim_currency][sec_currency] = parseFloat(rate);
        }
        else {
            return {};
        }
      }
    }
    // const quoteid: string | null = await redis.get("quoteid");
    // if(quoteid !== null) {
    //     fx_rates["quoteid"] = {quoteid: 0}; 
    // }
    return fx_rates;
  }

export default async function handler(req : NextApiRequest, res : NextApiResponse) {
    let quoteid = await redis.get('quoteid');
    if (quoteid !== null){
        let fx_rates: Record<string, Record<string, number>> = await get_rates_redis(quoteid);
        if (Object.keys(fx_rates).length !== 0) {
            return res.status(200).json({"quoteID": quoteid, "Rates":fx_rates, "expires_in": await redis.ttl(`${quoteid}_EUR:USD`)});
        }

    }
    else {
        quoteid = await set_rates_redis()
        let fx_rates = await get_rates_redis(quoteid);
        return res.status(200).json({"quoteID": quoteid, "Rates":fx_rates, "expires_in": await redis.ttl(`${quoteid}_EUR:USD`)});
    }

    return res.status(500).json("Internal server error");
    }