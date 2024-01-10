# Remix Cap Stack

![The Remix Cap Stack](https://repository-images.githubusercontent.com/465928257/a241fa49-bd4d-485a-a2a5-5cb8e4ee0abf)

Learn more about [Remix Stacks](https://remix.run/stacks).

```sh
npx create-remix@latest --template deveosys/remix-cap-stack
```

## What's in the stack

-   [CapRover app deployment](https://caprover.com/) with [Docker](https://www.docker.com/)
-   Production-ready [SQLite Database](https://sqlite.org)
-   Healthcheck endpoint
-   Email/Password Authentication with [cookie-based sessions](https://remix.run/utils/sessions#md-createcookiesessionstorage)
-   Database ORM with [Prisma](https://prisma.io)
-   Progressively Enhanced and fully type safe forms with [Conform](https://conform.guide/)
-   Styling with [Tailwind](https://tailwindcss.com/)
-   Code formatting with [Prettier](https://prettier.io)
-   Linting with [ESLint](https://eslint.org)
-   Static Types with [TypeScript](https://typescriptlang.org)

## Development

-   First run this stack's `remix.init` script and commit the changes it makes to your project.

    ```sh
    npx remix init
    git init # if you haven't already
    git add .
    git commit -m "Initialize project"
    ```

-   Initial setup:

    ```sh
    npm run setup
    ```

-   Start dev server:

    ```sh
    npm run dev
    ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get started:

-   Email: `rachel@remix.run`
-   Password: `racheliscool`

### Relevant code:

Out of the box, you can create users, log in and log out.

-   creating users, and logging in and out [./app/models/user.server.ts](./app/models/user.server.ts)
-   user sessions, and verifying them [./app/session.server.ts](./app/session.server.ts)

## Deployment

The Remix Cap Stack comes with two files for deployment:

-   captain-definition
-   Dockerfile

### Deployment Process

[Setup CapRover](https://caprover.com/docs/get-started.html) if you have not already done so, then follow these steps :

-   Create your app on CapRover (e.g. remix-app) with `Has Persistent Data` checked on.
-   Set container port to 3000

-   Add the `SESSION_SECRET` Environmental Variable

-   Add a persistant volume for SQLite data:

    ```
    Path in App: /data
    Label: remix-app-data (or a specific host path)
    ```

-   Deploy your app!
    ```sh
    $ caprover deploy
    ```

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.
