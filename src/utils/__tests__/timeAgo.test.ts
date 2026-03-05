import { describe, it, expect, vi, afterEach } from 'vitest';
import { timeAgo } from '../timeAgo';

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const fixedNow = new Date('2025-06-15T12:00:00Z').getTime();

  function ago(seconds: number): string {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    const date = new Date(fixedNow - seconds * 1000).toISOString();
    return timeAgo(date);
  }

  it('returns "just now" for < 60 seconds', () => {
    expect(ago(5)).toBe('just now');
    expect(ago(59)).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(ago(60)).toBe('1 minute ago');
    expect(ago(120)).toBe('2 minutes ago');
    expect(ago(59 * 60)).toBe('59 minutes ago');
  });

  it('returns hours ago', () => {
    expect(ago(3600)).toBe('1 hour ago');
    expect(ago(2 * 3600)).toBe('2 hours ago');
    expect(ago(23 * 3600)).toBe('23 hours ago');
  });

  it('returns days ago', () => {
    expect(ago(24 * 3600)).toBe('1 day ago');
    expect(ago(6 * 24 * 3600)).toBe('6 days ago');
  });

  it('returns weeks ago', () => {
    expect(ago(7 * 24 * 3600)).toBe('1 week ago');
    expect(ago(13 * 24 * 3600)).toBe('1 week ago');
    expect(ago(14 * 24 * 3600)).toBe('2 weeks ago');
    expect(ago(27 * 24 * 3600)).toBe('3 weeks ago');
  });

  it('returns months ago', () => {
    expect(ago(30 * 24 * 3600)).toBe('1 month ago');
    expect(ago(60 * 24 * 3600)).toBe('2 months ago');
    expect(ago(11 * 30 * 24 * 3600)).toBe('11 months ago');
  });

  it('returns years ago', () => {
    expect(ago(365 * 24 * 3600)).toBe('1 year ago');
    expect(ago(2 * 365 * 24 * 3600)).toBe('2 years ago');
  });

  it('handles invalid input gracefully', () => {
    expect(timeAgo('')).toBe('');
    expect(timeAgo(undefined as any)).toBe('');
    expect(timeAgo(null as any)).toBe('');
  });
});
