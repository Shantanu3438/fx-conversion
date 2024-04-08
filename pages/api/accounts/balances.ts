import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /api/balances:
 *   get:
 *     summary: Get user balances
 *     description: |
 *       This endpoint retrieves the balances of a user for various currencies.
 *       Users must provide a valid JWT token in the `Authorization` header to authenticate.
 *     responses:
 *       200:
 *         description: Successful retrieval of user balances
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   balances:
 *                     type: object
 *                     properties:
 *                       USD:
 *                         type: number
 *                         description: The balance in USD.
 *                       EUR:
 *                         type: number
 *                         description: The balance in EUR.
 *                       GBP:
 *                         type: number
 *                         description: The balance in GBP.
 *                       AUD:
 *                         type: number
 *                         description: The balance in AUD.
 *                       CAD:
 *                         type: number
 *                         description: The balance in CAD.
 *                       CNY:
 *                         type: number
 *                         description: The balance in CNY.
 *                       HKD:
 *                         type: number
 *                         description: The balance in HKD.
 *                       KRW:
 *                         type: number
 *                         description: The balance in KRW.
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

export default async function handler(req : NextApiRequest, res : NextApiResponse) {

    // const currency_mapping: {[key: string]: string} = {
    //     'USD': 'usd_balance',
    //     'EUR': 'eur_balance',
    //     'GBP': 'gbp_balance',
    //     'AUD': 'aud_balance',
    //     'CAD': 'cad_balance',
    //     'CNY': 'cny_balance',
    //     'HKD': 'hkd_balance',
    //     'KRW': 'krw_balance',
    // };
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error : 'Not authorized' });
    }
    const decoded_token = jwt.verify(token, process.env.SECRET_KEY!) as {userId : number};
    const user_id = decoded_token.userId;

    const user = await prisma.user.findUnique({
        where: {id: user_id}
    });

    const balances = [
        {
            "balances" : {
            "USD" : user.usd_balance,
            "EUR" : user.eur_balance,
            "GBP" : user.gbp_balance,
            "AUD" : user.aud_balance,
            "CAD" : user.cad_balance,
            "CNY" : user.cny_balance,
            "HKD" : user.hkd_balance,
            "KRW" : user.krw_balance,
        }}
    ]

    res.status(200).json(balances);
}