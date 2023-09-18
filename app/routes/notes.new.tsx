import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionArgs) => {
    const userId = await requireUserId(request);

    const formData = await request.formData();
    const title = formData.get("title");
    const body = formData.get("body");

    if (typeof title !== "string" || title.length === 0) {
        return json(
            { errors: { body: null, title: "Title is required" } },
            { status: 400 }
        );
    }

    if (typeof body !== "string" || body.length === 0) {
        return json(
            { errors: { body: "Body is required", title: null } },
            { status: 400 }
        );
    }
};
