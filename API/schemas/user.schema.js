const userProfileSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserProfile",
  "type": "object",
  "properties": {
    "did": { "type": "string" },
    "walletAddress": { "type": "string" },
    "password": { "type": "string" }
  },
  "required": ["did", "walletAddress", "password"]
};
