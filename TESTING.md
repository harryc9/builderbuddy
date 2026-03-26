# Testing Guide

## Philosophy

**Good tests catch bugs. Great tests catch the bugs you just fixed from happening again.**

Our testing strategy prioritizes:
1. **Regression Prevention** - Test what broke, not just what works
2. **Real Logic Testing** - Mock I/O, not business logic
3. **Idempotency** - Same input → same output, every time
4. **Fast Feedback** - Tests run in <1s, pre-push hooks catch issues

## Setup

### Install Vitest

```bash
bun add -D vitest @vitest/ui @vitejs/plugin-react @types/node
```

## Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

## Critical Testing Principles

### 1. **Test What You Fixed, Not What Works**

❌ **Bad**: Testing mocked behavior
```typescript
it('should deduplicate permits', () => {
  // This mocks the deduplication result - doesn't test the logic!
  vi.mocked(detectChanges).mockResolvedValue({
    deduplicatedPermits: [{ status: 'Permit Issued' }]
  })
  
  const result = await processPermits()
  expect(result.permits[0].status).toBe('Permit Issued')
})
```

✅ **Good**: Testing actual logic
```typescript
it('should keep FIRST occurrence when duplicates exist', () => {
  const rawPermits = [
    { permit_num: '123', status: 'Permit Issued' },   // NEW (first)
    { permit_num: '123', status: 'Under Review' },    // OLD (second)
  ]
  
  const result = deduplicatePermits(rawPermits)
  
  expect(result).toHaveLength(1)
  expect(result[0].status).toBe('Permit Issued') // Kept first, not second
})
```

### 2. **Test Idempotency - Same Input = Same Output**

❌ **Bad**: Only testing first run
```typescript
it('should process permits', async () => {
  const result = await processPermits()
  expect(result.changesDetected).toBe(600)
})
```

✅ **Good**: Testing consecutive runs
```typescript
it('should detect 0 changes on second run with same data', async () => {
  // First run
  const run1 = await processPermits(sameData)
  expect(run1.changesDetected).toBe(600)
  
  // Second run - same data should detect 0 changes
  const run2 = await processPermits(sameData)
  expect(run2.changesDetected).toBe(0) // Idempotent!
})
```

**Why this matters**: We had a bug where 705 changes were detected EVERY run because UPSERTs weren't working. This test would have caught it immediately.

### 3. **Mock I/O, Not Business Logic**

✅ **Mock These** (External I/O):
- API calls (`fetch`, HTTP clients)
- Database queries (Supabase client, `pg` client)
- File system (`fs`, `saveToFile`)
- Environment variables (for test isolation)
- Third-party services (QStash, external APIs)

❌ **Don't Mock These** (Business Logic):
- Normalization functions
- Deduplication logic
- Change detection algorithms
- Validation functions
- Data transformations

**Example**:
```typescript
// ✅ GOOD - Mock the API, test the processing
vi.mock('@/lib/permits/toronto-api', () => ({
  fetchFullDataset: vi.fn(() => mockData)
}))

// ❌ BAD - Mocking the logic we want to test
vi.mock('@/lib/permits/storage', () => ({
  detectChangesInPermitsSQL: vi.fn(() => mockResult) // This IS the logic!
}))
```

### 4. **Test Data Should Be Realistic**

❌ **Bad**: Minimal test data
```typescript
const mockPermit = { id: 1, status: 'Issued' }
```

✅ **Good**: Representative test data
```typescript
const mockPermit: TorontoPermitRaw = {
  _id: 123,
  PERMIT_NUM: '25 123456 BLD',
  REVISION_NUM: '00',
  STATUS: 'Permit Issued',
  ISSUED_DATE: '2025-01-15',
  EST_CONST_COST: 50000,
  BUILDER_NAME: 'Test Builder',
  DESCRIPTION: 'Residential addition',
  // ... all fields
}
```

**Why**: Edge cases hide in missing fields. Null handling, type coercion, optional fields - these only surface with complete data.

### 5. **Test Error Paths, Not Just Happy Paths**

Every external call should have error tests:

```typescript
describe('Error Handling', () => {
  it('should handle API timeout', async () => {
    vi.mocked(fetchData).mockRejectedValue(new Error('ETIMEDOUT'))
    const result = await processPermits()
    expect(result.success).toBe(false)
    expect(result.error).toContain('timeout')
  })
  
  it('should handle malformed data', async () => {
    const malformed = { PERMIT_NUM: null, STATUS: undefined }
    expect(() => normalizePermit(malformed)).not.toThrow()
    // Should handle gracefully, not crash
  })
  
  it('should rollback transaction on failure', async () => {
    vi.mocked(storage.save).mockRejectedValue(new Error('DB Error'))
    await expect(processPermits()).rejects.toThrow()
    // Verify rollback happened (check DB state)
  })
})
```

### 6. **Performance Tests Catch Regressions**

```typescript
it('should process 255k permits in under 2 minutes', async () => {
  const startTime = Date.now()
  
  await processLargeDataset(255000)
  
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(120000) // 2 min
  
  // Also check specific bottlenecks
  expect(metrics.bulkInsert).toBeLessThan(30000) // 30s
  expect(metrics.changeDetection).toBeLessThan(60000) // 1 min
})
```

**Why**: Prevents accidental O(n²) algorithms or missing indexes.

### 7. **Test Edge Cases Explicitly**

```typescript
describe('Edge Cases', () => {
  it('should handle empty dataset', async () => {
    const result = await processPermits([])
    expect(result.changesDetected).toBe(0)
    expect(result.newPermits).toBe(0)
  })
  
  it('should handle single permit', async () => {
    const result = await processPermits([onePermit])
    expect(result.success).toBe(true)
  })
  
  it('should handle all duplicates', async () => {
    const duplicates = Array(100).fill(samePermit)
    const result = await processPermits(duplicates)
    expect(result.storedPermits).toBe(1) // Deduplicated
  })
  
  it('should handle permits with null fields', async () => {
    const permitWithNulls = { ...basePermit, description: null }
    expect(() => normalizePermit(permitWithNulls)).not.toThrow()
  })
})
```

## Test Structure

### Naming Convention

All test files should follow the pattern: `*.core.test.{ts,tsx}`

Example:
- `route.core.test.ts`
- `storage.core.test.ts`
- `PermitsTable.core.test.tsx`

### Test Organization

```typescript
describe('ComponentName or FunctionName', () => {
  describe('Feature/Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

## Cron Route Tests

The cron route test (`route.core.test.ts`) covers:

1. **Happy Path** - Full end-to-end processing
2. **Error Handling** - API errors, SQL errors, storage errors
3. **Change Detection** - New permits, changes, no changes
4. **Deduplication** - Keeping first occurrence of duplicates
5. **Performance** - Timing metrics, large datasets
6. **Response Format** - Correct structure and data

### Key Test Cases

#### Deduplication Test
```typescript
it('should keep first occurrence when duplicates exist', async () => {
  // Verifies that when duplicate permits exist in the API response,
  // the FIRST occurrence (most recent status) is kept
})
```

#### Change Detection Test
```typescript
it('should detect changes correctly', async () => {
  // Verifies that changes are properly categorized by type and impact
})
```

#### Error Handling Test
```typescript
it('should handle API fetch errors', async () => {
  // Verifies graceful error handling when external services fail
})
```

## Mocking Strategy

### External Services

All external services are mocked:

- `@/lib/permits/toronto-api` - Toronto Open Data API
- `@/lib/permits/storage` - Supabase database operations
- `@/lib/permits/file-utils` - File system operations
- `@upstash/qstash/nextjs` - QStash signature verification

### Mock Data

Test data is defined inline for clarity and maintainability. Example:

```typescript
const mockPermits: Partial<Permit>[] = [
  {
    _id: 1,
    PERMIT_NUM: '25 123456 BLD',
    REVISION_NUM: '00',
    STATUS: 'Permit Issued',
  },
  // ... more permits
]
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key flows covered
- **Edge Cases**: Error scenarios, boundary conditions

## CI/CD Integration

Tests should run:
- On every PR
- Before deployment
- Nightly for full suite

## Debugging Tests

### VSCode

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "bun",
  "runtimeArgs": ["test", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line

```bash
# Run single test file
bun test route.core.test.ts

# Run tests matching pattern
bun test -t "should deduplicate"

# Debug with node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs
```

## Best Practices

1. **Arrange-Act-Assert** - Structure tests clearly
2. **One assertion per test** - Keep tests focused
3. **Descriptive names** - Test names should explain what they test
4. **Mock external dependencies** - Tests should be fast and isolated
5. **Clean up after tests** - Reset mocks, clear state
6. **Test edge cases** - Empty arrays, null values, errors
7. **Performance tests** - Verify large datasets work
8. **Integration tests** - Test full flows, not just units

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Over-Mocking

**Problem**: Mocking the function that contains the bug
```typescript
// This doesn't test deduplication - it mocks the result!
vi.mocked(detectChanges).mockResolvedValue({
  deduplicatedPermits: [...] // Already deduplicated
})
```

**Solution**: Only mock I/O boundaries
```typescript
vi.mock('@/lib/api', () => ({ fetchData: vi.fn() }))
// Now test the actual deduplication logic
```

### ❌ Pitfall 2: Not Testing Consecutive Runs

**Problem**: Tests pass, but production has issues with repeated runs
```typescript
// Bug: UPSERTs aren't working, keeps detecting same changes
```

**Solution**: Test idempotency
```typescript
it('should be idempotent', async () => {
  await processPermits(data)
  const secondRun = await processPermits(data)
  expect(secondRun.changes).toBe(0)
})
```

### ❌ Pitfall 3: Insufficient Error Testing

**Problem**: Only testing happy paths
```typescript
it('should process permits', async () => {
  expect(await process()).toBe(true)
})
```

**Solution**: Test every external dependency failure
```typescript
describe('Error Scenarios', () => {
  it('handles API timeout', ...)
  it('handles DB connection loss', ...)
  it('handles malformed data', ...)
  it('handles partial failures', ...)
})
```

### ❌ Pitfall 4: Brittle Timing Assertions

**Problem**: Flaky tests due to timing
```typescript
expect(duration).toBe(1000) // Fails randomly
```

**Solution**: Use ranges and be generous
```typescript
expect(duration).toBeGreaterThanOrEqual(0)
expect(duration).toBeLessThan(5000) // Reasonable upper bound
```

### ❌ Pitfall 5: Not Cleaning Up Mocks

**Problem**: Tests interfere with each other
```typescript
// Test 1 sets up mock
// Test 2 inherits Test 1's mock behavior
```

**Solution**: Reset in beforeEach/afterEach
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

## What Makes Tests Effective

### Test Effectiveness Checklist

Ask yourself these questions:

1. ✅ **Would this test catch the bug I just fixed?**
   - If no, rewrite the test to focus on that bug

2. ✅ **Can I break the code and see the test fail?**
   - Try commenting out the fix - does the test fail?
   - If no, the test isn't testing what you think it is

3. ✅ **Does this test mock business logic?**
   - If yes, you're testing the mock, not the code

4. ✅ **Would this test catch performance regressions?**
   - Large dataset tests catch O(n²) bugs

5. ✅ **Does this test verify idempotency?**
   - Same input twice = same output twice

6. ✅ **Is this test isolated?**
   - Can run in any order without failures

### Test Quality Score

Rate each test file:

- **10/10**: Tests bugs you fixed, idempotent, realistic data, tests actual logic
- **8/10**: Good coverage, some mocking issues, missing edge cases
- **6/10**: Happy path only, mocks too much, no error testing
- **4/10**: Tests pass but wouldn't catch real bugs
- **2/10**: Green tests that give false confidence

**Current Score for route.core.test.ts: 6/10**
- ✅ Good error handling tests
- ✅ Good mocking strategy for I/O
- ❌ Doesn't test the deduplication bug we fixed
- ❌ No consecutive runs test
- ❌ Mocks the change detection logic instead of testing it

## Coverage Goals

- **Unit Tests**: 80%+ line coverage, 100% of critical paths
- **Integration Tests**: All key user flows
- **Edge Cases**: Empty, single item, all duplicates, nulls, errors
- **Performance**: Large datasets, timeout scenarios
- **Regression**: Every bug gets a test before it's fixed

## Common Pitfalls

### The "Green Test That Lies"

```typescript
// ❌ This test passes but doesn't test anything
it('should process permits', async () => {
  vi.mocked(process).mockResolvedValue(true)
  expect(await process()).toBe(true) // Always passes!
})
```

### The "Too Much Mocking" Anti-Pattern

```typescript
// ❌ Mocking everything = testing nothing
vi.mock('@/lib/normalize')
vi.mock('@/lib/deduplicate')
vi.mock('@/lib/detect-changes')
vi.mock('@/lib/storage')

// Now what are you actually testing?
```

### The "No Assertions" Test

```typescript
// ❌ Test runs but doesn't verify anything
it('should handle errors', async () => {
  try {
    await dangerousFunction()
  } catch (e) {
    // Caught error but didn't assert anything
  }
})

// ✅ Better
it('should throw on invalid input', async () => {
  await expect(dangerousFunction()).rejects.toThrow('Invalid input')
})
```

## Test Naming Convention

Use descriptive names that explain WHAT and WHY:

❌ **Bad**:
```typescript
it('works', () => ...)
it('test 1', () => ...)
it('should return true', () => ...)
```

✅ **Good**:
```typescript
it('should keep FIRST occurrence when API returns [NEW, OLD]', () => ...)
it('should detect 0 changes on second run with same data', () => ...)
it('should mark status changes to active states as CRITICAL', () => ...)
```

## Real-World Example: Deduplication Bug

### The Bug
- API returns duplicates with different statuses
- Our code kept detecting 705 changes every run
- UPSERTs were storing the wrong version

### Bad Test (Wouldn't Catch It)
```typescript
it('should handle duplicates', async () => {
  vi.mocked(detectChanges).mockResolvedValue({
    deduplicatedPermits: [{ status: 'Permit Issued' }]
  })
  const result = await process()
  expect(result.permits[0].status).toBe('Permit Issued')
})
// This passed but the bug still existed!
```

### Good Test (Would Catch It)
```typescript
it('should keep FIRST occurrence and detect 0 changes on rerun', async () => {
  const data = [
    { permit_num: '123', status: 'Permit Issued' },   // NEW (first)
    { permit_num: '123', status: 'Under Review' },    // OLD (second)
  ]
  
  // First run
  const run1 = await process(data)
  expect(run1.storedPermits[0].status).toBe('Permit Issued')
  
  // Second run - idempotency test
  const run2 = await process(data)
  expect(run2.changesDetected).toBe(0) // Would have been 705!
})
```

## When to Write Tests

### Test-Driven Development (TDD)

1. **Red**: Write failing test for new feature
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while tests stay green

### Bug-Driven Testing (BDT)

1. **Bug Found**: Write test that reproduces the bug
2. **Verify**: Confirm test fails
3. **Fix**: Implement fix
4. **Verify**: Confirm test passes
5. **Commit**: Test + fix together

### Regression Testing

Every bug fix should include:
- Test that fails before the fix
- Test that passes after the fix
- Comment explaining what bug this prevents

```typescript
// Regression test for #123: Deduplication kept wrong version
it('should keep FIRST occurrence when duplicates exist', () => {
  // This test would have caught the bug where we kept
  // the OLD status instead of the NEW status
  ...
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

