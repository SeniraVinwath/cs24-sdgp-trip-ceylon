// Mock for Supabase client
const supabaseMock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
  };
  
  module.exports = {
    supabase: supabaseMock,
    resetMocks: () => {
      // Reset all mock implementations and call histories
      Object.keys(supabaseMock).forEach(key => {
        if (typeof supabaseMock[key].mockReset === 'function') {
          supabaseMock[key].mockReset();
          
          // Ensure methods chain correctly
          if (['from', 'select', 'insert', 'update', 'delete', 'eq', 'upsert'].includes(key)) {
            supabaseMock[key].mockReturnThis();
          }
        }
      });
    }
  };