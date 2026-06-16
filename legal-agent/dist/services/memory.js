"use strict";
/**
 * AgentBase Memory Service
 * Handles conversation events and long-term memory records
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = createEvent;
exports.searchMemoryRecords = searchMemoryRecords;
exports.listMemoryRecords = listMemoryRecords;
exports.generateMemoryRecordsFromSession = generateMemoryRecordsFromSession;
exports.insertMemoryRecordDirectly = insertMemoryRecordDirectly;
exports.getSessionEvents = getSessionEvents;
const axios_1 = __importDefault(require("axios"));
const MEMORY_API_BASE = 'https://agentbase.api.vngcloud.vn/memory';
const MEMORY_ID = process.env.GREENNODE_MEMORY_ID || 'memory-e286f773-3e70-441b-8638-77bec098e47a';
const STRATEGY_ID = process.env.GREENNODE_MEMORY_STRATEGY_ID || 'ltms-9e897de9-e633-4e47-8de4-bf7806277d64';
// Get token from environment (injected by AgentBase Runtime) or use configured credentials
function getAuthHeaders() {
    const clientId = process.env.GREENNODE_CLIENT_ID;
    const clientSecret = process.env.GREENNODE_CLIENT_SECRET;
    if (clientId && clientSecret) {
        // Runtime mode - credentials injected by AgentBase
        return {
            'X-GreenNode-Client-Id': clientId,
            'X-GreenNode-Client-Secret': clientSecret,
        };
    }
    // Local development - use token from script (for manual testing only)
    // In production, always use the injected credentials
    console.warn('[Memory] Warning: Using local token. In production, use GREENNODE_CLIENT_ID/SECRET env vars.');
    return {};
}
// Get token for API calls (handles both runtime and local)
async function getToken() {
    const clientId = process.env.GREENNODE_CLIENT_ID;
    const clientSecret = process.env.GREENNODE_CLIENT_SECRET;
    if (clientId && clientSecret) {
        // Runtime mode - use IAM token endpoint
        const response = await axios_1.default.post('https://signin.vngcloud.vn/realms/iam/protocol/openid-connect/token', new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        return response.data.access_token;
    }
    // Fallback: use token script for local development
    // This is a workaround - in production, credentials should be injected
    return '';
}
/**
 * Create a conversation event (user or assistant message)
 */
async function createEvent(actorId, sessionId, role, message) {
    try {
        const token = await getToken();
        const response = await axios_1.default.post(`${MEMORY_API_BASE}/memories/${MEMORY_ID}/actors/${actorId}/sessions/${sessionId}/events`, {
            payload: {
                type: 'conversational',
                role: role,
                message: message,
            },
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-GreenNode-AgentBase-User-Id': actorId,
                'X-GreenNode-AgentBase-Session-Id': sessionId,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('[Memory] Error creating event:', error.response?.data || error.message);
        throw error;
    }
}
/**
 * Search memory records (long-term facts) by natural language query
 */
async function searchMemoryRecords(actorId, query, limit = 10) {
    try {
        const token = await getToken();
        const namespace = `/strategies/${STRATEGY_ID}/actors/${actorId}`;
        const response = await axios_1.default.post(`${MEMORY_API_BASE}/memories/${MEMORY_ID}/memory-records:search?namespace=${encodeURIComponent(namespace)}`, {
            query: query,
            limit: limit,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data || [];
    }
    catch (error) {
        console.error('[Memory] Error searching records:', error.response?.data || error.message);
        return [];
    }
}
/**
 * List memory records for an actor
 */
async function listMemoryRecords(actorId, limit = 100) {
    try {
        const token = await getToken();
        const namespace = `/strategies/${STRATEGY_ID}/actors/${actorId}`;
        const response = await axios_1.default.get(`${MEMORY_API_BASE}/memories/${MEMORY_ID}/memory-records?namespace=${encodeURIComponent(namespace)}&limit=${limit}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data?.list_data || [];
    }
    catch (error) {
        console.error('[Memory] Error listing records:', error.response?.data || error.message);
        return [];
    }
}
/**
 * Generate memory records from a session (extract facts)
 */
async function generateMemoryRecordsFromSession(actorId, sessionId) {
    try {
        const token = await getToken();
        const response = await axios_1.default.post(`${MEMORY_API_BASE}/memories/${MEMORY_ID}/memory-records:generate-from-session?actorId=${actorId}&sessionId=${sessionId}&longTermMemoryStrategyId=${STRATEGY_ID}`, {}, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('[Memory] Error generating records:', error.response?.data || error.message);
        throw error;
    }
}
/**
 * Insert a memory record directly (for explicit knowledge)
 */
async function insertMemoryRecordDirectly(actorId, memory, metadata) {
    try {
        const token = await getToken();
        const namespace = `/strategies/${STRATEGY_ID}/actors/${actorId}`;
        const response = await axios_1.default.post(`${MEMORY_API_BASE}/memories/${MEMORY_ID}/memory-records:insert-directly?namespace=${encodeURIComponent(namespace)}`, {
            memory: memory,
            metadata: metadata || {},
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('[Memory] Error inserting record:', error.response?.data || error.message);
        throw error;
    }
}
/**
 * Get session events for context
 */
async function getSessionEvents(actorId, sessionId, limit = 50) {
    try {
        const token = await getToken();
        const response = await axios_1.default.get(`${MEMORY_API_BASE}/memories/${MEMORY_ID}/actors/${actorId}/sessions/${sessionId}/events?page=1&size=${limit}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data?.list_data || [];
    }
    catch (error) {
        console.error('[Memory] Error getting events:', error.response?.data || error.message);
        return [];
    }
}
exports.default = {
    createEvent,
    searchMemoryRecords,
    listMemoryRecords,
    generateMemoryRecordsFromSession,
    insertMemoryRecordDirectly,
    getSessionEvents,
};
//# sourceMappingURL=memory.js.map