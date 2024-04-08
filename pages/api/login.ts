import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login with username and password
 *     description: |
 *       This endpoint allows users to login with their username and password. Upon successful login,
 *       it returns a JWT token which can be used for accessing protected resources.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password of the user.
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for accessing protected resources.
 *       400:
 *         description: Invalid username or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating the reason for failure.
 *       405:
 *         description: Method Not Allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating that the HTTP method is not allowed.
 */

const prisma = new PrismaClient();

export interface LoginData {
  username: string;
  password: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { username, password }: LoginData = req.body;

    // Find the user in the database
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate a JWT
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY!, {
      expiresIn: '1d',
    });

    res.status(200).json({ token });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}