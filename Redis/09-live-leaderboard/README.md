# Live Leaderboard System using Redis

A real-time leaderboard implementation using Redis sorted sets with support for view counting, scoring, and ranking.

## Features

- **Post View Counting**: Increment view count using `INCR` with locking mechanism
- **User Scoring**: Add points to user scores using `ZINCRBY`
- **Leaderboard Rankings**: Get top leaders using `ZREVRANGE`
- **User Ranking**: Get user rank using `ZREVRANK`
- **Distributed Locking**: Prevents race conditions with lock tokens

## Redis Commands Used

### INCR
- Used for incrementing post view counts
- Ensures atomic operations
- Combined with Lua-based locking for thread safety

### ZINCRBY
- Adds/increments points for users in a sorted set
- Creates new member if doesn't exist
- Returns updated score

### ZREVRANGE
- Retrieves top N members with scores in descending order
- Used for top leaderboard rankings

### ZREVRANK
- Gets the rank (position) of a member in reverse order
- Returns 0-indexed rank (0 = highest score)
- Returns null if member not found

## API Endpoints

### 1. Increment Post View Count
```bash
POST /post/:id/view
```
Increments the view count using `INCR` with locking.

**Response**:
```json
{
  "success": true,
  "postId": "post123",
  "viewCount": 42,
  "message": "Post view incremented successfully"
}
```

### 2. Add Points to User Score
```bash
POST /leaderboard/score
Content-Type: application/json

{
  "userId": "user1",
  "points": 100
}
```
Adds points using `ZINCRBY`.

**Response**:
```json
{
  "success": true,
  "userId": "user1",
  "pointsAdded": 100,
  "totalScore": 500,
  "rank": 3,
  "message": "Score updated successfully"
}
```

### 3. Get Top 10 Leaders
```bash
GET /leaderboard?limit=10
```
Returns top leaders using `ZREVRANGE`.

**Response**:
```json
{
  "success": true,
  "limit": 10,
  "leaders": [
    {
      "rank": 1,
      "userId": "user1",
      "score": 5000
    },
    {
      "rank": 2,
      "userId": "user2",
      "score": 4500
    }
  ],
  "message": "Retrieved top 10 leaders"
}
```

### 4. Get User Rank
```bash
GET /leaderboard/:userId/rank
```
Returns user's rank using `ZREVRANK`.

**Response**:
```json
{
  "success": true,
  "userId": "user1",
  "rank": 1,
  "score": 5000,
  "message": "User rank retrieved successfully"
}
```

## Locking Mechanism

Uses Lua scripts for atomic lock release:
- Unique lock tokens prevent race conditions
- TTL auto-expires locks to prevent deadlocks
- Exponential backoff for retry logic

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

The API will start on `http://localhost:3000`

## Example Usage

```bash
# Add user scores
curl -X POST http://localhost:3000/leaderboard/score \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "points": 100}'

# Get top leaders
curl http://localhost:3000/leaderboard

# Get user rank
curl http://localhost:3000/leaderboard/user1/rank

# Increment post views
curl -X POST http://localhost:3000/post/post123/view
```

