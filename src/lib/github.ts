/** Public GitHub coordinates for issue submission + edit links. */
export const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'iammenasco'
export const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'flarewise'

export function githubRepoUrl() {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
}

export function githubEditUrl(sourcePath?: string) {
  if (!sourcePath) return githubRepoUrl()
  return `${githubRepoUrl()}/edit/main/${sourcePath}`
}

export function githubNewIssueUrl(title: string, body: string, labels = 'new-food') {
  const params = new URLSearchParams({
    title,
    body,
    labels,
  })
  return `${githubRepoUrl()}/issues/new?${params.toString()}`
}
