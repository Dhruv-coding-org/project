class RateLimiter {
  constructor() {
    this.rateLimits = new Map(); // socketId -> { event -> { count, resetTime } }
  }

  isRateLimited(socketId, event, maxPerSecond) {
    const now = Date.now();
    if (!this.rateLimits.has(socketId)) {
      this.rateLimits.set(socketId, {});
    }
    const limits = this.rateLimits.get(socketId);

    if (!limits[event] || now > limits[event].resetTime) {
      limits[event] = { count: 1, resetTime: now + 1000 };
      return false; // Not rate limited
    }

    limits[event].count++;
    if (limits[event].count > maxPerSecond) {
      return true; // Rate limited
    }
    return false;
  }

  /**
   * Fixes memory leak by removing socket rate limit data on disconnect
   */
  cleanup(socketId) {
    this.rateLimits.delete(socketId);
  }
}

module.exports = new RateLimiter();
