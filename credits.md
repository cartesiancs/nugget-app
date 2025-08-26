# Credits API

## Get User Credit Balance

- `GET /credits/balance/:userId` - Get user's current credit balance (🔒 Protected)

  - **Parameters**: `userId` (string) - User ID in path
  - **Response**:

  ```json
  {
    "credits": 150.5,
    "message": "Credit balance retrieved successfully"
  }
  ```

## Get User Credit Stats

- `GET /credits/stats/:userId` - Get comprehensive credit statistics (🔒 Protected)

  - **Parameters**: `userId` (string) - User ID in path
  - **Response**:

  ```json
  {
    "currentBalance": 150.5,
    "totalEarned": 500.0,
    "totalSpent": 349.5,
    "lastUpdate": "2025-01-16T10:30:00Z",
    "usageBreakdown": [
      {
        "operationType": "IMAGE_GENERATION",
        "modelUsed": "recraft",
        "totalSpent": 15.0,
        "operationCount": 15
      }
    ],
    "message": "Credit stats retrieved successfully"
  }
  ```

## Get Credit History

- `GET /credits/history/:userId` - Get paginated credit transaction history (🔒 Protected)

  - **Parameters**:
    - `userId` (string) - User ID in path
    - `page` (number, optional) - Page number (default: 1)
    - `limit` (number, optional) - Items per page (default: 20)
  - **Response**:

  ```json
  {
    "transactions": [
      {
        "id": "cltxn123abc",
        "userId": "cluser123",
        "amount": -25.0,
        "balanceAfter": 125.5,
        "type": "DEDUCTION",
        "status": "COMPLETED",
        "operationType": "VIDEO_GENERATION",
        "modelUsed": "veo2",
        "operationId": "clvideo123",
        "isEditCall": false,
        "description": "VIDEO_GENERATION using veo2",
        "createdAt": "2025-01-16T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "message": "Credit history retrieved successfully"
  }
  ```

## Check Credits Before Operation

- `GET /credits/check/:userId/:operationType/:modelName` - Check if user has sufficient credits (🔒 Protected)

  - **Parameters**:
    - `userId` (string) - User ID in path
    - `operationType` (string) - Operation type (e.g., "IMAGE_GENERATION", "VIDEO_GENERATION")
    - `modelName` (string) - AI model name (e.g., "veo2", "recraft")
    - `isEditCall` (query, optional) - Whether this is an edit operation (default: "false")
  - **Response**:

  ```json
  {
    "hasEnoughCredits": true,
    "currentBalance": 150.5,
    "requiredCredits": 25,
    "message": "User has sufficient credits"
  }
  ```

## Deduct Credits

- `POST /credits/deduct` - Deduct credits for an operation (🔒 Protected)

  - **Request Body**:

  ```json
  {
    "userId": "cluser123",
    "operationType": "VIDEO_GENERATION",
    "modelName": "veo2",
    "operationId": "clvideo123",
    "isEditCall": false,
    "description": "Generated promotional video"
  }
  ```

  - **Response**:

  ```json
  {
    "transactionId": "cltxn123abc",
    "newBalance": 125.5,
    "message": "Credits deducted successfully"
  }
  ```

## Add Credits

- `POST /credits/add` - Add credits to user account

  - **Request Body**:

  ```json
  {
    "userId": "cluser123",
    "amount": 100,
    "type": "PURCHASE",
    "description": "Welcome bonus credits"
  }
  ```

  - **Response**:

  ```json
  {
    "transactionId": "cltxn456def",
    "newBalance": 250.5,
    "message": "Successfully added 100 credits"
  }
  ```

## Get Current Pricing

- `GET /credits/pricing` - Get current operation pricing (🔒 Protected)

  - **Response**:

  ```json
  {
    "pricing": {
      "IMAGE_GENERATION": {
        "imagen": { "regular": 2, "edit": 4 },
        "recraft": { "regular": 1, "edit": 2 }
      },
      "VIDEO_GENERATION": {
        "veo2": { "regular": 25, "edit": 37.5 },
        "runwayml": { "regular": 2.5, "edit": 3.75 },
        "kling": { "regular": 20, "edit": 30 },
        "veo3": { "regular": 37.5, "edit": 0 }
      },
      "TEXT_OPERATIONS": {
        "perplexity": { "regular": 1, "edit": 1 },
        "concept-gen": { "regular": 1, "edit": 1 },
        "segmentation": { "regular": 3, "edit": 6 },
        "content-summarizer": { "regular": 1, "edit": 1 }
      },
      "VOICEOVER_GENERATION": {
        "elevenlabs": { "regular": 5.5, "edit": 5.5 }
      }
    },
    "message": "Pricing information retrieved successfully"
  }
  ```
