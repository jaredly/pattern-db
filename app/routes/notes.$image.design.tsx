import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import size from "image-size";
import { existsSync, readFileSync, writeFileSync } from "fs";

export const loader = async ({ params }: LoaderArgs) => {
    invariant(params.image, "image not found");

    const image = await prisma.image.findUnique({
        where: { id: params.image },
        select: { url: true },
    });
    if (!image) {
        throw new Response("Not Found", { status: 404 });
    }
    const path = "public" + image.url;
    const state = existsSync(path + ".json")
        ? JSON.parse(readFileSync(path + ".json", "utf-8"))
        : null;
    return json({ image, size: size(path), state });
};

export const action = async ({ params, request }: ActionArgs) => {
    const data = await request.json();

    const image = await prisma.image.findUnique({
        where: { id: params.image },
        select: { url: true },
    });
    if (!image) {
        throw new Error("image not found");
    }
    const path = "public" + image.url + ".json";

    writeFileSync(path, JSON.stringify(data));
    return null;
};
