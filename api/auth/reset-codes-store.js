// Shared in-memory store for reset codes
// Note: This is a temporary solution. For production, use Vercel KV or a database.
// Codes will not persist across serverless function invocations in different regions.

const resetCodes = new Map();

module.exports = resetCodes;

