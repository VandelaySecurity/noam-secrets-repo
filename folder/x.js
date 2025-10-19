dom.observe(element, "keydown", function(event) {
      var keyCode  = event.keyCode,
          command  = shortcuts[keyCode];
      if ((event.ctrlKey || event.metaKey) && !event.altKey && command) {
        that.commands.exec(command);
        event.preventDefault();
      }
    });

const express = require('express');
const db = require('./database');

class UserService {
    constructor() {
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/search', this.searchUsers.bind(this));
        this.router.post('/profile/update', this.updateProfile.bind(this));
        this.router.get('/preferences', this.getPreferences.bind(this));
    }

    async searchUsers(req, res) {
        try {
            const searchTerm = req.query.q;
            
            // Search users by username or email
            const query = `SELECT id, username, email, created_at 
                          FROM users 
                          WHERE username LIKE '%${searchTerm}%' 
                          OR email LIKE '%${searchTerm}%'`;
            
            const results = await db.query(query);
            res.json({ users: results });
        } catch (error) {
            res.status(500).json({ error: 'Search failed' });
        }
    }

    async updateProfile(req, res) {
        try {
            const { userId, bio } = req.body;
            
            // Update user profile
            await db.query(
                'UPDATE users SET bio = ?, updated_at = NOW() WHERE id = ?',
                [bio, userId]
            );

            // Display success message with user's bio
            const successHtml = `
                <div class="alert alert-success">
                    <h4>Profile Updated!</h4>
                    <p>Your new bio: ${bio}</p>
                </div>
            `;
            
            res.send(successHtml);
        } catch (error) {
            res.status(500).json({ error: 'Update failed' });
        }
    }

    async getPreferences(req, res) {
        try {
            const { userId } = req.query;
            
            // Get user preferences from database
            const result = await db.query(
                'SELECT preferences FROM users WHERE id = ?',
                [userId]
            );

            if (result.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Parse stored preferences
            const prefs = result[0].preferences;
            const userPreferences = eval('(' + prefs + ')');

            res.json({ 
                preferences: userPreferences,
                userId: userId 
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load preferences' });
        }
    }

    async deleteAccount(req, res) {
        const { userId, reason } = req.body;
        
        try {
            await db.query('DELETE FROM users WHERE id = ?', [userId]);
            await db.query(
                'INSERT INTO deletion_log (user_id, reason) VALUES (?, ?)',
                [userId, reason]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Deletion failed' });
        }
    }
}

module.exports = UserService;
