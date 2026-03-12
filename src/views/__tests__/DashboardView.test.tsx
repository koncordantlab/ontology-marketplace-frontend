import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardView } from '../DashboardView';
import { ontologyService } from '../../services/ontologyService';

vi.mock('../../services/ontologyService', () => ({
  ontologyService: {
    searchOntologies: vi.fn(),
  },
}));

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(() => null),
    onAuthStateChange: vi.fn(() => () => {}),
  },
}));

function buildOntologies(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ont-${i + 1}`,
    uuid: `ont-${i + 1}`,
    name: `Ontology ${i + 1}`,
    description: `Description ${i + 1}`,
    properties: { is_public: true, source_url: '', image_url: '' },
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

describe('DashboardView – server-side pagination', () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests page 1 with limit=6, offset=0 on mount', async () => {
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    render(<DashboardView onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(ontologyService.searchOntologies).toHaveBeenCalledWith({
        limit: 6,
        offset: 0,
      });
    });
  });

  it('shows server total in pagination info', async () => {
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    render(<DashboardView onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/of 18/)).toBeInTheDocument();
    });
  });

  it('clicking Next calls searchOntologies with offset=6', async () => {
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    render(<DashboardView onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/of 18/)).toBeInTheDocument();
    });

    vi.mocked(ontologyService.searchOntologies).mockClear();
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(ontologyService.searchOntologies).toHaveBeenCalledWith({
        limit: 6,
        offset: 6,
      });
    });
  });

  it('clicking page number button calls with correct offset', async () => {
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    render(<DashboardView onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    vi.mocked(ontologyService.searchOntologies).mockClear();
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    fireEvent.click(screen.getByText('3'));

    await waitFor(() => {
      expect(ontologyService.searchOntologies).toHaveBeenCalledWith({
        limit: 6,
        offset: 12,
      });
    });
  });

  it('Previous button is disabled on page 1', async () => {
    vi.mocked(ontologyService.searchOntologies).mockResolvedValue({
      success: true,
      data: buildOntologies(6),
      total: 18,
    });

    render(<DashboardView onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeDisabled();
    });
  });
});
