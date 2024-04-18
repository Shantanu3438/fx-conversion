import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { json } from "stream/consumers";

/**
 * @swagger
 * /api/topup:
 *   post:
 *     summary: Deposit funds
 *     description: |
 *       This endpoint allows users to deposit funds into their account for a specific currency.
 *       Users must provide a valid JWT token in the `Authorization` header to authenticate.
 *       The request body should contain the currency and the amount to deposit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 description: The currency code to deposit funds into (e.g., "USD").
 *               amount:
 *                 type: number
 *                 description: The amount of funds to deposit.
 *             required:
 *               - currency
 *               - amount
 *     responses:
 *       200:
 *         description: Successful deposit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message indicating the funds were deposited.
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

export async function update_balance(user_id: number, currency_to_update: string, amount: number, update_type: string) {

    const user = await prisma.user.findUnique({
        where: {id: user_id}
    });

    const current_balance = user[currency_mapping[currency_to_update]];
    const update_data: Record<string, number> = {};
    if (update_type === "debit"){
        update_data[currency_mapping[currency_to_update]] = current_balance  - amount;
    }
    else if(update_type === "credit"){
        update_data[currency_mapping[currency_to_update]] = current_balance + amount;
    }

    await prisma.user.update({
        where : {id : user_id},
        data: update_data
    });
}

export default async function handler(req : NextApiRequest, res : NextApiResponse) {
    const { currency, amount } = req.body;


    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error : 'Not authorized' });
    }

    const decoded_token = jwt.verify(token, process.env.SECRET_KEY!) as {userId : number};
    const user_id = decoded_token.userId;
    await update_balance(user_id, currency, Number(amount), "credit");
    console.log(await prisma.user.findUnique({
        where: {id: user_id}
    }
    ))
    res.status(200).json({"message" :"Topup succesfull"});
}   
