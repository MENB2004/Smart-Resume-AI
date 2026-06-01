export interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  html_url: string;
  stargazers_count: number;
}

export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
}

export const profileService = {
  /**
   * Fetches public repositories for a given GitHub username.
   */
  async fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
    if (!username || username.trim() === '') return [];
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub repositories');
      }
      const data = await response.json();
      return data.map((repo: any) => ({
        name: repo.name,
        description: repo.description || 'No description provided.',
        language: repo.language || 'JavaScript',
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count || 0
      }));
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      return [];
    }
  },

  /**
   * Fetches competitive programming stats for a LeetCode username.
   */
  async fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
    if (!username || username.trim() === '') return null;
    try {
      const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch LeetCode statistics');
      }
      const data = await response.json();
      if (data.status === 'success') {
        return {
          totalSolved: data.totalSolved || 0,
          easySolved: data.easySolved || 0,
          mediumSolved: data.mediumSolved || 0,
          hardSolved: data.hardSolved || 0,
          acceptanceRate: data.acceptanceRate || 0.0,
          ranking: data.ranking || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching LeetCode stats:', error);
      return null;
    }
  }
};
