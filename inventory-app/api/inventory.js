// This is your backend function (api/inventory.js)

// The Octokit library makes talking to GitHub's API easier.
// Vercel will install this for us automatically.
import { Octokit } from "@octokit/rest";

// This is the main function Vercel will run.
export default async function handler(request, response) {
  // Read the configuration from environment variables (the secure way)
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER; // e.g., 'johnallencooper'
  const REPO_NAME = process.env.REPO_NAME;   // e.g., 'equipment-inventory'
  const FILE_PATH = 'inventory-app/database.csv';

  if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    return response.status(500).json({ message: "Server is not configured correctly. Missing environment variables." });
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Handle GET request (loading data)
    if (request.method === 'GET') {
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
      });
      // Send the file's content and SHA back to the frontend
      return response.status(200).json({ content: data.content, sha: data.sha });
    }

    // Handle PUT request (saving data)
    if (request.method === 'PUT') {
      const { content, sha, message } = request.body;
      
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        message: message,
        content: content, // The frontend will send this already base64 encoded
        sha: sha,
      });
      return response.status(200).json({ message: "File updated successfully" });
    }

    // If the request method is not GET or PUT, return an error
    return response.status(405).json({ message: "Method Not Allowed" });

  } catch (error) {
    // Handle errors, like if the file doesn't exist on a GET request
    if (error.status === 404) {
      return response.status(404).json({ message: "File not found" });
    }
    console.error(error);
    return response.status(500).json({ message: error.message });
  }
}
