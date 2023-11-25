import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { existsSync, readFileSync, writeFileSync } from "fs";
import size from "image-size";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { State } from "geometricart/src/types";

/**
 * The load & save target for the geometricart design tool
 */
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
    const data: State = await request.json();

    console.log("saving pattern something");

    const image = await prisma.image.findUnique({
        where: { id: params.image },
        select: {
            url: true,
            imageTilings: {
                select: {
                    id: true,
                    tiling: {
                        select: {
                            hash: true,
                        },
                    },
                },
            },
        },
    });
    if (!image) {
        throw new Error("image not found");
    }
    const path = "public" + image.url + ".json";
    writeFileSync(path, JSON.stringify(data));

    const hashes = image.imageTilings.map((it) => it.tiling.hash);

    const toSave = Object.values(data.tilings).map((v) => v.cache.hash);

    const toRemove = image.imageTilings.filter(
        (it) => !toSave.includes(it.tiling.hash)
    );
    if (toRemove.length) {
        for (let it of toRemove) {
            await prisma.imageTiling.delete({
                where: {
                    id: it.id,
                },
            });
        }
        // await prisma.image.update({
        //     where: { id: params.image },
        //     data: {
        //         imageTilings: {
        //             disconnect: toRemove.map((it) => ({ id: it.id })),
        //         },
        //     },
        // });
    }

    for (let tiling of Object.values(data.tilings)) {
        const found = await prisma.tiling.findFirst({
            where: { hash: tiling.cache.hash },
        });
        if (hashes.includes(tiling.cache.hash)) {
            if (found) {
                await prisma.tiling.update({
                    where: { id: found.id },
                    data: { json: JSON.stringify(tiling) },
                });
            }
            continue;
        }
        if (found) {
            await prisma.image.update({
                where: { id: params.image },
                data: {
                    imageTilings: {
                        create: {
                            tiling: {
                                connect: { id: found.id },
                            },
                            h: 0,
                            w: 0,
                            x: 0,
                            y: 0,
                        },
                    },
                },
            });
        } else {
            await prisma.image.update({
                where: { id: params.image },
                data: {
                    imageTilings: {
                        create: {
                            tiling: {
                                create: {
                                    hash: tiling.cache.hash,
                                    json: JSON.stringify(tiling),
                                },
                            },
                            h: 0,
                            w: 0,
                            x: 0,
                            y: 0,
                        },
                    },
                },
            });
        }
    }

    return null;
};
