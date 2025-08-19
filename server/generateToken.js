import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const payload = {
  id: '12345',
  email: 'test@example.com',
};

const secret = process.env.JWT_SECRET;
const token = jwt.sign(payload, secret, { expiresIn: '10y' });







