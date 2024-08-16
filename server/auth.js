import { expressjwt } from 'express-jwt';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from './db/users.js';

const secret = Buffer.from('Zn8Q5tyZ/G1MHltc4F/gTkVJMlrbKiZt', 'base64');


// This is an express middleware that checks each request for a token
// the package adds JSON web token support to express apps
// It will validate each token to ensure it was encoded using the secret only our server knows
// expects token to be passed in auth header
// This is how we will check if a user can make requests or not
export const authMiddleware = expressjwt({
  algorithms: ['HS256'],
  credentialsRequired: false,
  secret,
});

export async function handleLogin(req, res) {
  const { email, password } = req.body;
  // get user from database
  const user = await getUserByEmail(email);
  // if user is not found return error
  if (!user || user.password !== password) {
    res.sendStatus(401);
  } else {
    // create new JWT token
    const claims = { sub: user.id, email: user.email };
    // Token is signed using a secret that only the server knows
    // When we receive token from the client we can check that it was issued by this server
    const token = jwt.sign(claims, secret);
    res.json({ token });  
  }
}
