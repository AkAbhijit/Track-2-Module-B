const express = require('express');
const router = express.Router();
const { signIn, signUp, signOut, getOAuthLink, loginOAuth } = require('../controllers/authController');

router.post('/sign-in', signIn);
router.post('/sign-up', signUp);
router.post('/sign-out', signOut);
router.get('/oauth', getOAuthLink);
router.post('/oauth', loginOAuth);

module.exports = router;
