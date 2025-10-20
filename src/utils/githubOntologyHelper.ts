/**
 * Simple helper for working with GitHub-hosted ontology files
 */

const GITHUB_REPO = 'koncordantlab/ontology-storage';
const GITHUB_BRANCH = 'main';

/**
 * Convert a filename to its raw GitHub URL
 * @param filename - The filename/path in the repository
 * @returns The raw GitHub URL for direct file access
 *
 * Examples:
 * - buildRawUrl('pizza.owl') => 'https://raw.githubusercontent.com/koncordantlab/ontology-storage/main/pizza.owl'
 * - buildRawUrl('healthcare/disease.ttl') => 'https://raw.githubusercontent.com/koncordantlab/ontology-storage/main/healthcare/disease.ttl'
 */
export function buildRawUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${filename}`;
}

/**
 * Check if a URL is a valid GitHub raw URL from your repository
 */
export function isFromOurRepo(url: string): boolean {
  return url.startsWith(`https://raw.githubusercontent.com/${GITHUB_REPO}/`);
}

/**
 * Extract filename from a raw GitHub URL
 */
export function extractFilename(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Get the GitHub repository URL for browsing files
 */
export function getRepoUrl(): string {
  return `https://github.com/${GITHUB_REPO}`;
}

/**
 * Instructions for users
 */
export const INSTRUCTIONS = `
How to add an ontology:
1. Upload your .owl, .ttl, or .rdf file to: https://github.com/${GITHUB_REPO}
2. Get the raw URL by clicking on the file and then the "Raw" button
3. Use that URL as the source_url when creating an ontology in the marketplace
`;