import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import { logout } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => logout(request);

export const loader = async ({ request }: LoaderFunctionArgs) => {
    return logout(request);
};
