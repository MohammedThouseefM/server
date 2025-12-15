const express = require('express');
const router = express.Router();
const { enhancePost, generateCaption, translateText, suggestReplies, summarizeChat, analyzeTone } = require('../controllers/aiController');

router.post('/enhance', enhancePost);
router.post('/caption', generateCaption);
router.post('/translate', translateText);
router.post('/replies', suggestReplies);
router.post('/summary', summarizeChat);
router.post('/tone', analyzeTone);

module.exports = router;
