/**
 * AgentBase Memory Service
 * Handles conversation events and long-term memory records
 */
/**
 * Create a conversation event (user or assistant message)
 */
export declare function createEvent(actorId: string, sessionId: string, role: 'user' | 'assistant', message: string): Promise<any>;
/**
 * Search memory records (long-term facts) by natural language query
 */
export declare function searchMemoryRecords(actorId: string, query: string, limit?: number): Promise<any[]>;
/**
 * List memory records for an actor
 */
export declare function listMemoryRecords(actorId: string, limit?: number): Promise<any[]>;
/**
 * Generate memory records from a session (extract facts)
 */
export declare function generateMemoryRecordsFromSession(actorId: string, sessionId: string): Promise<any>;
/**
 * Insert a memory record directly (for explicit knowledge)
 */
export declare function insertMemoryRecordDirectly(actorId: string, memory: string, metadata?: Record<string, any>): Promise<any>;
/**
 * Get session events for context
 */
export declare function getSessionEvents(actorId: string, sessionId: string, limit?: number): Promise<any[]>;
declare const _default: {
    createEvent: typeof createEvent;
    searchMemoryRecords: typeof searchMemoryRecords;
    listMemoryRecords: typeof listMemoryRecords;
    generateMemoryRecordsFromSession: typeof generateMemoryRecordsFromSession;
    insertMemoryRecordDirectly: typeof insertMemoryRecordDirectly;
    getSessionEvents: typeof getSessionEvents;
};
export default _default;
//# sourceMappingURL=memory.d.ts.map