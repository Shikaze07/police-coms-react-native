export enum OperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SET = 'SET',
}

export function handleFirestoreError(error: any, operation: OperationType, path?: string): string {
  console.error(`[Firestore Error] Operation: ${operation}, Path: ${path || 'unknown'}, Error:`, error);
  if (error && error.code) {
    switch (error.code) {
      case 'permission-denied':
        return `Sovereign security policy violation: Permission denied${path ? ` on ${path}` : ''}.`;
      case 'not-found':
        return `Requested node not found in repository${path ? ` at ${path}` : ''}.`;
      case 'already-exists':
        return `Data node already exists in database${path ? ` at ${path}` : ''}.`;
      default:
        return `Tactical DB error (${error.code}): ${error.message}`;
    }
  }
  return error?.message || 'Unknown tactical database error.';
}
