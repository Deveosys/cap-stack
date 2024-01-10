const { execSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const PackageJson = require("@npmcli/package-json");
const semver = require("semver");

const escapeRegExp = (string) =>
    // $& means the whole matched string
    string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPackageManagerCommand = (packageManager) =>
    // Inspired by https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L38-L103
    ({
        bun: () => ({
            exec: "bunx",
            lockfile: "bun.lockb",
            name: "bun",
            run: (script, args) => `bun run ${script} ${args || ""}`,
        }),
        npm: () => ({
            exec: "npx",
            lockfile: "package-lock.json",
            name: "npm",
            run: (script, args) => `npm run ${script} ${args ? `-- ${args}` : ""}`,
        }),
        pnpm: () => {
            const pnpmVersion = getPackageManagerVersion("pnpm");
            const includeDoubleDashBeforeArgs = semver.lt(pnpmVersion, "7.0.0");
            const useExec = semver.gte(pnpmVersion, "6.13.0");

            return {
                exec: useExec ? "pnpm exec" : "pnpx",
                lockfile: "pnpm-lock.yaml",
                name: "pnpm",
                run: (script, args) =>
                    includeDoubleDashBeforeArgs
                        ? `pnpm run ${script} ${args ? `-- ${args}` : ""}`
                        : `pnpm run ${script} ${args || ""}`,
            };
        },
        yarn: () => ({
            exec: "yarn",
            lockfile: "yarn.lock",
            name: "yarn",
            run: (script, args) => `yarn ${script} ${args || ""}`,
        }),
    })[packageManager]();

const getPackageManagerVersion = (packageManager) =>
    // Copied over from https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L105-L114
    execSync(`${packageManager} --version`).toString("utf-8").trim();

const getRandomString = (length) => crypto.randomBytes(length).toString("hex");

const removeUnusedDependencies = (dependencies, unusedDependencies) =>
    Object.fromEntries(Object.entries(dependencies).filter(([key]) => !unusedDependencies.includes(key)));

const updatePackageJson = ({ APP_NAME, packageJson, packageManager }) => {
    const {
        devDependencies,
        prisma: { seed: prismaSeed, ...prisma },
        scripts: {
            // eslint-disable-next-line no-unused-vars
            "format:repo": _repoFormatScript,
            ...scripts
        },
    } = packageJson.content;

    packageJson.update({
        name: APP_NAME,
        devDependencies:
            packageManager.name === "bun" ? removeUnusedDependencies(devDependencies, ["ts-node"]) : devDependencies,
        prisma: {
            ...prisma,
            seed: packageManager.name === "bun" ? prismaSeed.replace("ts-node", "bun") : prismaSeed,
        },
        scripts,
    });
};

const main = async ({ packageManager, rootDirectory }) => {
    const pm = getPackageManagerCommand(packageManager);

    const README_PATH = path.join(rootDirectory, "README.md");
    const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
    const ENV_PATH = path.join(rootDirectory, ".env");
    const DOCKERFILE_PATH = path.join(rootDirectory, "Dockerfile");

    const REPLACER = "deveosys-cap-stack-template";

    const DIR_NAME = path.basename(rootDirectory);
    const SUFFIX = getRandomString(2);

    const APP_NAME = (DIR_NAME + "-" + SUFFIX)
        // get rid of anything that's not allowed in an app name
        .replace(/[^a-zA-Z0-9-_]/g, "-");

    const [readme, env, dockerfile, packageJson] = await Promise.all([
        fs.readFile(README_PATH, "utf-8"),
        fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
        fs.readFile(DOCKERFILE_PATH, "utf-8"),
        PackageJson.load(rootDirectory),
    ]);

    const newEnv = env.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${getRandomString(16)}"`);

    const initInstructions = `
- First run this stack's \`remix.init\` script and commit the changes it makes to your project.

  \`\`\`sh
  npx remix init
  git init # if you haven't already
  git add .
  git commit -m "Initialize project"
  \`\`\`
`;

    const newReadme = readme.replace(new RegExp(escapeRegExp(REPLACER), "g"), APP_NAME).replace(initInstructions, "");

    const newDockerfile = pm.lockfile
        ? dockerfile.replace(new RegExp(escapeRegExp("package-lock.json"), "g"), pm.lockfile)
        : dockerfile;

    updatePackageJson({ APP_NAME, packageJson, packageManager: pm });

    await Promise.all([
        fs.writeFile(README_PATH, newReadme),
        fs.writeFile(ENV_PATH, newEnv),
        fs.writeFile(DOCKERFILE_PATH, newDockerfile),
        packageJson.save(),
        fs.copyFile(path.join(rootDirectory, "remix.init", "gitignore"), path.join(rootDirectory, ".gitignore")),

        fs.rm(path.join(rootDirectory, "LICENSE.md")),
    ]);

    execSync(pm.run("setup"), { cwd: rootDirectory, stdio: "inherit" });

    execSync(pm.run("format", "--log-level warn"), {
        cwd: rootDirectory,
        stdio: "inherit",
    });

    console.log(
        `Setup is complete. You're now ready to rock and roll 🤘

Start development with \`${pm.run("dev")}\`
    `.trim(),
    );
};

module.exports = main;
