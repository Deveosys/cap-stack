import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { z } from "zod";

import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";

const schema = z.object({
    email: z.string({ required_error: "Email is required" }).email("Email is invalid"),
    password: z.string({ required_error: "Password is required" }).min(8, "Password is too short"),
    remember: z.boolean().optional(),
    redirectTo: z.string().default("/"),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await getUserId(request);
    if (userId) return redirect("/");
    return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const submission = parse(formData, { schema });

    if (!submission.value || submission.intent !== "submit") {
        return json({ userExists: null, submission });
    }

    const existingUser = await getUserByEmail(submission.value.email);
    if (existingUser) {
        return json(
            {
                userExists: "A user already exists with this email",
                submission,
            },
            { status: 400 },
        );
    }

    const user = await createUser(submission.value.email, submission.value.password);

    return createUserSession({
        redirectTo: safeRedirect(submission.value.redirectTo, "/"),
        remember: false,
        request,
        userId: user.id,
    });
};

export const meta: MetaFunction = () => [{ title: "Sign Up" }];

export default function Join() {
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") ?? undefined;
    const actionData = useActionData<typeof action>();
    const [form, { email, password }] = useForm({
        shouldValidate: "onInput",
        lastSubmission: actionData?.submission ?? null,
        onValidate({ formData }) {
            return parse(formData, { schema });
        },
    });

    return (
        <div className="flex min-h-full flex-col items-center justify-center">
            <div>
                <h1 className="mb-4 text-3xl font-semibold">Join</h1>
            </div>
            <div className="w-full max-w-md px-8">
                {actionData?.userExists ? (
                    <div className="mb-4 pt-1 text-center text-sm text-red-500">{actionData.userExists}</div>
                ) : null}
                <Form method="post" className="space-y-4" {...form.props}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                type="email"
                                name={email.name}
                                className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                            {email.error ? <div className="pt-1 text-sm text-red-500">{email.error}</div> : null}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                name={password.name}
                                className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                            {password.error ? <div className="pt-1 text-sm text-red-500">{password.error}</div> : null}
                        </div>
                    </div>

                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full rounded bg-indigo-500 px-4 py-2 text-white transition hover:bg-indigo-600 active:bg-indigo-400"
                        >
                            Create Account
                        </button>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link
                                className="text-indigo-500 underline"
                                to={{
                                    pathname: "/login",
                                    search: searchParams.toString(),
                                }}
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}
