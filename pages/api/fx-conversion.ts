import { NextApiRequest, NextApiResponse } from "next";
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
import { get_rates_redis, set_rates_redis } from './fx-rates'
import { update_balance } from "./accounts/topup";

/**
 * @swagger
 * /api/fx-conversion:
 *   post:
 *     summary: Convert currency
 *     description: |
 *       This endpoint allows users to convert currency from one currency to another.
 *       Users must provide a valid JWT token in the `Authorization` header to authenticate.
 *       The request body should contain the quote ID, currencies, and amount to convert.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quoteID:
 *                 type: integer
 *                 description: The quote ID obtained from fetching foreign exchange rates.
 *               from_currency:
 *                 type: string
 *                 description: The currency code to convert from (e.g., "USD").
 *               to_currency:
 *                 type: string
 *                 description: The currency code to convert to (e.g., "EUR").
 *               amount:
 *                 type: number
 *                 description: The amount to convert.
 *             required:
 *               - quoteID
 *               - from_currency
 *               - to_currency
 *               - amount
 *     responses:
 *       200:
 *         description: Successful currency conversion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 convertedAmount:
 *                   type: number
 *                   description: The converted amount.
 *                 currency:
 *                   type: string
 *                   description: The currency code of the converted amount.
 *       401:
 *         description: Not authorized. Invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating the user is not authorized.
 *       403:
 *         description: Insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Message:
 *                   type: string
 *                   description: Error message indicating the user has insufficient balance.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating the user was not found.
 */


const prisma = new PrismaClient();

interface conversion {
    quoteID: string,
    from_currency: string,
    to_currency: string,
    amount: number
}

const currency_mapping: {[key: string]: string} = {
    'USD': 'usd_balance',
    'EUR': 'eur_balance',
    'GBP': 'gbp_balance',
    'AUD': 'aud_balance',
    'CAD': 'cad_balance',
    'CNY': 'cny_balance',
    'HKD': 'hkd_balance',
    'KRW': 'krw_balance',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { quoteID, from_currency, to_currency, amount }: conversion = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error : 'Not authorized' });
    }

    const decoded_token = jwt.verify(token, process.env.SECRET_KEY!) as {userId : number};
    const user_id = decoded_token.userId;
    const user = await prisma.user.findUnique({
        where: {id: user_id}
    });
    if (user){
        const from_currency_balance = user[currency_mapping[from_currency]];
        const to_currency_balance = user[currency_mapping[to_currency]];
        let fx_rates = await get_rates_redis();
        if (Object.keys(fx_rates).length === 0) {
            await set_rates_redis();
            fx_rates = await get_rates_redis();
        }
        console.log(fx_rates, from_currency, to_currency, amount);
        const conversion_rate = fx_rates[from_currency][to_currency];
        if(amount > 0 && from_currency_balance < amount) {
            return res.status(403).json({"Message": "Balance low"})
        }
        else {
            const converted_amount = conversion_rate * amount;
            await update_balance(user_id, from_currency, amount, "debit");
            await update_balance(user_id, to_currency, converted_amount, "credit");
            return res.status(200).json({"convertedAmount": converted_amount, "currency": to_currency});   
        }

    }
    else {
        return res.status(404).json({ error: 'User not found' });
    }
}