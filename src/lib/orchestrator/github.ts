import { Octokit } from '@octokit/rest';
import type { TopicLog, GeneratedPost } from './types';
import { siteConfig } from '@/site.config';

const TOPIC_LOG_PATH = 'content/.topic-log.json';

function client() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');
  return new Octokit({ auth: token });
}

function repo() {
  const owner = process.env.GITHUB_OWNER;
  const name = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  if (!owner || !name) throw new Error('GITHUB_OWNER / GITHUB_REPO not set');
  return { owner, repo: name, branch };
}

async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
  const gh = client();
  const { owner, repo: name, branch } = repo();
  try {
    const res = await gh.repos.getContent({ owner, repo: name, path, ref: branch });
    if (Array.isArray(res.data) || res.data.type !== 'file') return null;
    return {
      content: Buffer.from(res.data.content, 'base64').toString('utf8'),
      sha: res.data.sha,
    };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && err.status === 404) return null;
    throw err;
  }
}

async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const gh = client();
  const { owner, repo: name, branch } = repo();
  await gh.repos.createOrUpdateFileContents({
    owner,
    repo: name,
    path,
    message,
    branch,
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha,
  });
}

export async function loadTopicLog(): Promise<TopicLog> {
  const file = await getFile(TOPIC_LOG_PATH);
  if (!file) return { topics: [] };
  try {
    return JSON.parse(file.content) as TopicLog;
  } catch {
    return { topics: [] };
  }
}

export async function saveTopicLog(log: TopicLog): Promise<void> {
  const existing = await getFile(TOPIC_LOG_PATH);
  // Cap the log at 500 entries to stop unbounded growth
  const trimmed: TopicLog = { topics: log.topics.slice(-500) };
  await putFile(
    TOPIC_LOG_PATH,
    JSON.stringify(trimmed, null, 2),
    'chore: update topic log',
    existing?.sha
  );
}

export async function commitPost(post: GeneratedPost, mdx: string): Promise<string> {
  const path = `content/${siteConfig.contentDirectory}/${post.slug}.mdx`;
  const existing = await getFile(path);
  await putFile(
    path,
    mdx,
    `post: ${post.title.slice(0, 60)}`,
    existing?.sha
  );
  return path;
}
