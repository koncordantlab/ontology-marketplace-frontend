import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ontologyService } from '../ontologyService';
import { BackendApiClient } from '../../config/backendApi';

vi.mock('../../config/backendApi', () => ({
  BackendApiClient: {
    getOntologies: vi.fn(),
  },
}));

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

describe('OntologyService – pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchOntologies() calls getOntologies with default limit=6, offset=0', async () => {
    vi.mocked(BackendApiClient.getOntologies).mockResolvedValue({
      data: { results: [], total: 0 },
    });

    await ontologyService.searchOntologies();
    expect(BackendApiClient.getOntologies).toHaveBeenCalledWith(6, 0);
  });

  it('searchOntologies({ limit: 6, offset: 12 }) passes params correctly', async () => {
    vi.mocked(BackendApiClient.getOntologies).mockResolvedValue({
      data: { results: [], total: 0 },
    });

    await ontologyService.searchOntologies({ limit: 6, offset: 12 });
    expect(BackendApiClient.getOntologies).toHaveBeenCalledWith(6, 12);
  });

  it('response includes total field from backend', async () => {
    vi.mocked(BackendApiClient.getOntologies).mockResolvedValue({
      data: {
        results: [{ id: '1', name: 'Test', description: 'desc' }],
        total: 42,
      },
    });

    const result = await ontologyService.searchOntologies();
    expect(result.total).toBe(42);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('error case returns total: 0', async () => {
    vi.mocked(BackendApiClient.getOntologies).mockRejectedValue(
      new Error('Network error')
    );

    const result = await ontologyService.searchOntologies();
    expect(result.success).toBe(false);
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('falls back total to array length when backend omits total', async () => {
    vi.mocked(BackendApiClient.getOntologies).mockResolvedValue({
      data: {
        results: [
          { id: '1', name: 'A', description: '' },
          { id: '2', name: 'B', description: '' },
        ],
      },
    });

    const result = await ontologyService.searchOntologies();
    expect(result.total).toBe(2);
  });
});
