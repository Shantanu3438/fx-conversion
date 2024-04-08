import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { Redis } from "ioredis";

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
    for (const [prim_currency, sec_currencies] of Object.entries(common_fx_rates)) {
        for (const sec_currency of sec_currencies) {
            try {
                const response = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${prim_currency}&to_currency=${sec_currency}&apikey=M6Z14YX5QV323ZUK`);
                if (response.ok) {
                    const data = await response.json();
                    redis.set(`${prim_currency}:${sec_currency}`, data["Realtime Currency Exchange Rate"]["5. Exchange Rate"], 'EX', 30);   
                }
            } catch (error) {
                console.error("Error while setting the rates in redis", error)
            }
        }
    console.log('API request made');
}}

export async function get_rates_redis() {
    const fx_rates: Record<string, Record<string, number>> = {};
  
    for (const [prim_currency, sec_currencies] of Object.entries(common_fx_rates)) {
      fx_rates[prim_currency] = {};
      for (const sec_currency of sec_currencies) {
        const rate = await redis.get(`${prim_currency}:${sec_currency}`);
  
        if (rate !== null) {
          fx_rates[prim_currency][sec_currency] = parseFloat(rate);
        }
        else {
            return {};
        }
      }
    }
    return fx_rates;
  }

export default async function handler(req : NextApiRequest, res : NextApiResponse) {
    let fx_rates: Record<string, Record<string, number>> = await get_rates_redis();
    if (Object.keys(fx_rates).length !== 0) {
        const fetch_time = Date.now();
        return res.status(200).json({"quoteID": fetch_time, "Rates":fx_rates, "expires_in": await redis.ttl("EUR:USD")});
    }
    else {
        await set_rates_redis();
        const fetch_time = Date.now();
        fx_rates = await get_rates_redis();
        return res.status(200).json({"quoteID": fetch_time, "Rates":fx_rates, "expires_in": await redis.ttl("EUR:USD")});
    }
}