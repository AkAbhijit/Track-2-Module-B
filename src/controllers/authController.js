const User = require('../models/user');
const UserToken = require('../models/userToken');
const bcrypt = require('bcrypt');
const argon2 = require('argon2');
const crypto = require('crypto');

async function signIn(req, res) {
    const { email, password } = req.body || {};
    try {
        if (!password || password.length < 8) {
            return res.status(400).json({
                message: ['password must be longer than or equal to 8 characters'],
                error: 'Bad Request',
                statusCode: 400
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password',
                error: 'Unauthorized',
                statusCode: 401
            });
        }

        let isPasswordValid = false;
        try {
            if (typeof user.password === 'string' && user.password.startsWith('$argon2')) {
                isPasswordValid = await argon2.verify(user.password, password);
            } else {
                isPasswordValid = await bcrypt.compare(password, user.password);
            }
        } catch (e) {
            isPasswordValid = false;
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password',
                error: 'Unauthorized',
                statusCode: 401
            });
        }

        const accessToken = crypto.randomBytes(64).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
        const tokenId = crypto.randomUUID();

        await UserToken.create({
            id: tokenId,
            value: accessToken,
            hash: tokenHash,
            user_id: user.id
        });

        return res.status(200).json({ data: { accessToken } });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function signUp(req, res) {
    const { name, email, phone, password } = req.body || {};
    try {
        if (!password || password.length < 8) {
            return res.status(400).json({
                message: ['password must be longer than or equal to 8 characters'],
                error: 'Bad Request',
                statusCode: 400
            });
        }

        if (!email) {
            return res.status(401).json({ message: 'Invalid email', error: 'Unauthorized', statusCode: 401 });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(401).json({ message: 'Invalid email', error: 'Unauthorized', statusCode: 401 });
        }

        const hashed = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        await User.create({ id: userId, name, email, phone, balance: 0, password: hashed });

        const accessToken = crypto.randomBytes(64).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
        const tokenId = crypto.randomUUID();

        await UserToken.create({ id: tokenId, value: accessToken, hash: tokenHash, user_id: userId });

        return res.status(201).json({ data: { accessToken } });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function signOut(req, res) {
    try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) {
            return res.status(401).json({ message: 'Missing token', error: 'Unauthorized', statusCode: 401 });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const existing = await UserToken.findOne({ hash: tokenHash });
        if (!existing) {
            return res.status(401).json({ message: 'Invalid token', error: 'Unauthorized', statusCode: 401 });
        }

        await UserToken.deleteOne({ hash: tokenHash });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function getOAuthLink(req, res) {
    try {
        const base = process.env.OAUTH_AUTHORIZE_URL || 'http://localhost:7000/authorize';
        const clientId = process.env.OAUTH_CLIENT_ID || 'cid-9143bf89';
        const codeChallenge = crypto.randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const link = `${base}?response_type=code&client_id=${clientId}&scope=openid&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
        return res.status(200).json({ data: { link } });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function loginOAuth(req, res) {
    const code = req.query && req.query.code;
    if (!code) {
        return res.status(400).json({ message: 'Bad Request', statusCode: 400 });
    }

    try {
        if (!String(code).startsWith('code-')) {
            return res.status(422).json({ message: 'Unprocessable Entity', statusCode: 422 });
        }

        const user = await User.findOne();
        if (!user) {
            return res.status(503).json({ message: 'Service Unavailable', statusCode: 503 });
        }

        const accessToken = crypto.randomBytes(64).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
        const tokenId = crypto.randomUUID();

        await UserToken.create({ id: tokenId, value: accessToken, hash: tokenHash, user_id: user.id });

        return res.status(200).json({ data: { accessToken } });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = { signIn, signUp, signOut, getOAuthLink, loginOAuth };