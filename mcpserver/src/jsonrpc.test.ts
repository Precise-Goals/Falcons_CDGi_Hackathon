import { describe, it, expect } from 'vitest';
import {
  JSONRPC_ERRORS,
  formatJsonRpcError,
  formatJsonRpcSuccess,
} from './jsonrpc.js';

describe('JSON-RPC 2.0 Protocol Serializer (@intra/mcpserver)', () => {
  it('defines standard JSON-RPC 2.0 error codes', () => {
    expect(JSONRPC_ERRORS.PARSE_ERROR).toBe(-32700);
    expect(JSONRPC_ERRORS.INVALID_REQUEST).toBe(-32600);
    expect(JSONRPC_ERRORS.METHOD_NOT_FOUND).toBe(-32601);
    expect(JSONRPC_ERRORS.INVALID_PARAMS).toBe(-32602);
    expect(JSONRPC_ERRORS.INTERNAL_ERROR).toBe(-32603);
  });

  it('formats standard error response for invalid params (-32602)', () => {
    const errorResponse = formatJsonRpcError(
      'req_1',
      JSONRPC_ERRORS.INVALID_PARAMS,
      'Invalid params: service and endpoint are required',
      { missingField: 'service' }
    );

    expect(errorResponse.jsonrpc).toBe('2.0');
    expect(errorResponse.id).toBe('req_1');
    expect(errorResponse.error.code).toBe(-32602);
    expect(errorResponse.error.message).toContain('Invalid params');
    expect(errorResponse.error.data).toEqual({ missingField: 'service' });
  });

  it('formats standard error response for method not found (-32601)', () => {
    const errorResponse = formatJsonRpcError(
      100,
      JSONRPC_ERRORS.METHOD_NOT_FOUND,
      'Method not found: unknown_custom_tool'
    );

    expect(errorResponse.jsonrpc).toBe('2.0');
    expect(errorResponse.id).toBe(100);
    expect(errorResponse.error.code).toBe(-32601);
    expect(errorResponse.error.message).toBe('Method not found: unknown_custom_tool');
    expect(errorResponse.error.data).toBeUndefined();
  });

  it('formats successful JSON-RPC response with result', () => {
    const successResponse = formatJsonRpcSuccess('req_42', {
      services: ['users', 'payments', 'search'],
    });

    expect(successResponse.jsonrpc).toBe('2.0');
    expect(successResponse.id).toBe('req_42');
    expect(successResponse.result).toEqual({
      services: ['users', 'payments', 'search'],
    });
  });
});
