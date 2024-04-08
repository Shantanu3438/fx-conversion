import { NextApiResponse } from 'next';
import { mocked } from "jest-mock";
import { LoginData } from "../../../pages/api/login";
import handler from "../../../pages/api/login";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockUser = {
  id: '1',
  username: 'testuser',
  password: 'testpassword',
};

const mockReq = {
  method: 'POST',
  body: {
    username: 'testuser',
    password: 'testpassword',
  },
};
const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

const mockPrisma = new PrismaClient();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockToken'),
}));

describe('handler', () => {
  it('should return a token', async () => {
    await handler(mockReq as any, mockRes as any);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', mockUser.password);
    expect(jwt.sign).toHaveBeenCalledWith({ userId: '1' }, process.env.SECRET_KEY!, {
      expiresIn: '1d',
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ token: 'mockToken' });
  });

  it('should return invalid credentials', async () => {
    mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null);

    await handler(mockReq as any, mockRes as any);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid username or password' });
  });

  it('should return Method Not Allowed', async () => {
    mockReq.method = 'GET';

    await handler(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Method Not Allowed' });
  });
});
