import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { existsSync } from "fs";
import { tilingSort } from "./route";
import { Tiling } from "geometricart/src/types";

export const loader = async ({ request }: LoaderArgs) => {
    return json({
        tilings: (
            await prisma.tiling.findMany({
                select: {
                    hash: true,
                    json: true,
                    id: true,
                },
            })
        )
            .map((t) => ({ ...t, data: JSON.parse(t.json) as Tiling }))
            .sort(tilingSort),
        patterns: (
            await prisma.pattern.findMany({
                select: {
                    id: true,
                    notes: true,
                    images: {
                        select: {
                            id: true,
                            location: true,
                            source: true,
                            date: true,
                            url: true,
                            imageTilings: {
                                select: {
                                    h: true,
                                    w: true,
                                    x: true,
                                    y: true,
                                    tiling: {
                                        select: {
                                            id: true,
                                            hash: true,
                                            json: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    links: {
                        select: { id: true, kind: true, url: true },
                    },
                    tags: {
                        select: { id: true, category: true, name: true },
                    },
                },
            })
        ).map((pattern) => ({
            ...pattern,
            images: pattern.images.map((image) => ({
                ...image,
                hasJson: existsSync("public/" + image.url + ".json"),
            })),
        })),
        tags: await prisma.tag.findMany(),
        links: await prisma.link.findMany(),
    });
};
