#!/usr/bin/env bun

import { existsSync } from "fs";

import { input, confirm } from "@inquirer/prompts";
import path from "path";
import { mkdir } from "node:fs/promises";

// Function to display ASCII art
function showAsciiArt() {
  console.log(`
  __                                              
_/  |____  ________________   ____   ______ ______
\   __\  \/  /\____ \_  __ \_/ __ \ /  ___//  ___/
 |  |  >    < |  |_> >  | \/\  ___/ \___ \ \___ \ 
 |__| /__/\_ \|   __/|__|    \___  >____  >____  >
            \/|__|               \/     \/     \/ 
`);
  console.log("Welcome to your TypeScript Express project generator!");
  console.log("----------------------------------------------------");
}

interface ProjectDetails {
  projectName: string;
  description: string;
  author: string;
  proceed: boolean;
}
// prompt user for project details

async function promptProjectDetails(): Promise<ProjectDetails> {
  try {
    const projectName = await input({
      message: "Enter the name of your project",
      validate: (value) =>
        value.trim() !== "" || "Please enter a valid project name",
    });

    const description = await input({
      message: "Enter a brief description of your project:",
    });

    const author = await input({
      message: "Enter the author name",
    });

    const proceed = await confirm({
      message: `Generate project '${projectName}' with description '${description}' by '${author}'?`,
    });

    return { projectName, description, author, proceed };
  } catch (error) {
    console.error("Error during project detail prompts:", error);
    process.exit(1);
  }
}

// function to create projeect structure

async function createProjectStructure(
  targetDir: string,
  projectDetails: ProjectDetails
) {
  const { projectName, description, author } = projectDetails;

  // Set up exit handler
  process.on("SIGINT", () => {
    console.log("\nUser interrupted the process. Exiting gracefully...");
    process.exit(0);
  });

  // ------------------------------- default template -----------------------------
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description,
    author,
    license: "MIT",
    scripts: {
      start: "node dist/index.js",
      build: "tsc",
      dev: "ts-node-dev --respawn --transpile-only src/index.ts",
    },
    dependencies: {
      express: "latest",
    },
    devDependencies: {
      "@types/express": "latest",
      "@types/node": "latest",
      typescript: "latest",
      "ts-node-dev": "latest",
    },
  };

  const tsConfig = {
    compilerOptions: {
      target: "es6",
      module: "commonjs",
      outDir: "./dist",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules"],
  };

  const indexContent = `
import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript Express!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
`;

  // -----------------------  default template ----------------------------

  try {
    await mkdir(targetDir, { recursive: true });
    await Bun.write(
      path.join(targetDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
    await Bun.write(
      path.join(targetDir, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2)
    );
    await mkdir(path.join(targetDir, "src"), { recursive: true });
    await Bun.write(path.join(targetDir, "src", "index.ts"), indexContent);
  } catch (error) {
    console.error("Error creating project structure:", error);
    throw error;
  }
}

// Function to run a command
async function runCommand(command: string[], options: any): Promise<void> {
  const process = Bun.spawn(command, options);

  await process.exited;
}

// main function to create the project

async function createProject() {
  showAsciiArt();
  try {
    const projectDetails = await promptProjectDetails();

    if (!projectDetails.proceed) {
      console.log("Project creation aborted.");
      return;
    }
    const targetDir = path.join(process.cwd(), projectDetails.projectName);

    if (existsSync(targetDir)) {
      console.log(
        `Error: A project named '${projectDetails.projectName}' already exists.`
      );
      return;
    }

    console.log(`Creating project '${projectDetails.projectName}'...`);
    await createProjectStructure(targetDir, projectDetails);
    console.log("Installing dependencies...");
    await runCommand(["npm", "install"], {
      cwd: targetDir,
      stdout: "inherit",
      stderr: "inherit",
    });


    console.log("Updating dependencies to latest versions...");
    await runCommand(["npm", "update"], {
      cwd: targetDir,
      stdout: "inherit",
      stderr: "inherit",
    });
    
    console.log(`
Project '${projectDetails.projectName}' has been created successfully!
To get started, run the following commands:

cd ${projectDetails.projectName}
npm run dev
`);
  } catch (error) {
    process.exit(1);
  }
}

createProject().catch((err) => {
  console.log(err);
  process.exit(1);
});
