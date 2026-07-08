const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

module.exports = function createAuthRouter() {
  const router = express.Router();

  router.get('/session', function getSession(req, res) {
    res.json({
      authenticated: Boolean(req.session.user),
      user: req.session.user || null,
      isAdmin: req.session.isAdmin === true
    });
  });

  router.post('/signup', async function signup(req, res, next) {
    try {
      const username = normalizeText(req.body.username);
      const password = String(req.body.password || '');
      const email = normalizeText(req.body.email) || null;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [result] = await db.execute(
        'INSERT INTO `USER` (`NAME`, `PASSWORD`, `EMAIL`, `CREATED_AT`) VALUES (?, ?, ?, NOW())',
        [username, passwordHash, email]
      );
      await db.execute(
        [
          'UPDATE `TOURNAMENT_PLAYER`',
          'SET `USER_ID` = ?, `UPDATED_AT` = NOW()',
          'WHERE `NAME` = ? AND `USER_ID` IS NULL'
        ].join(' '),
        [result.insertId, username]
      );

      req.session.user = {
        id: result.insertId,
        name: username,
        avatarUrl: '/images/default_avatar.png'
      };
      req.session.isAdmin = false;

      res.status(201).json({
        message: 'Signup successful!',
        user: req.session.user
      });
    } catch (error) {
      if (error && error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Username or email is already taken.' });
      }

      next(error);
    }
  });

  router.post('/login', async function login(req, res, next) {
    try {
      const username = normalizeText(req.body.username);
      const password = String(req.body.password || '');

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      const [rows] = await db.execute(
        'SELECT `ID`, `NAME`, `PASSWORD` FROM `USER` WHERE `NAME` = ? LIMIT 1',
        [username]
      );
      const user = rows[0];

      if (!user || !(await bcrypt.compare(password, user.PASSWORD))) {
        return res.status(401).json({ message: 'Login failed. Please check your credentials.' });
      }

      req.session.user = {
        id: user.ID,
        name: user.NAME,
        avatarUrl: '/images/default_avatar.png'
      };
      req.session.isAdmin = false;

      res.json({
        message: 'Login successful!',
        user: req.session.user
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', function logout(req, res) {
    req.session.destroy(function destroySession(error) {
      if (error) {
        return res.status(500).json({ message: 'Logout failed. Please try again.' });
      }

      res.clearCookie('dbdturniere.sid');
      res.json({ message: 'Logout successful!' });
    });
  });

  return router;
};

function normalizeText(value) {
  const text = String(value || '').trim();
  return text || null;
}
