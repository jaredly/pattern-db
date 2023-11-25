import type { ActionArgs, NodeOnDiskFile } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { parseMultipartFormData, uploadImages } from "~/models/upload.server";
import { requireUserId } from "~/session.server";

/**
 * Actions on the main "patterns" page
 */
export const action = async ({ request }: ActionArgs) => {
    const userId = await requireUserId(request);

    const formData = await parseMultipartFormData(request, uploadImages);

    const del = formData.get("delete-tiling") as string;
    if (del) {
        await prisma.tiling.delete({ where: { id: del } });
        // await prisma.imageTiling.delete({ where: { id: del } });
        return json({ errors: null }, { status: 200 });
    }

    const tiling = formData.get("add-tiling") as string;
    if (tiling) {
        const ids = formData.getAll("pattern") as string[];

        const patterns = await prisma.pattern.findMany({
            where: { id: { in: ids } },
            select: {
                images: {
                    select: {
                        id: true,
                        imageTilings: {
                            select: {
                                id: true,
                                tilingId: true,
                            },
                        },
                    },
                },
            },
        });

        for (let pattern of patterns) {
            if (!pattern.images.length) {
                continue;
            }
            const image = pattern.images[0];
            const it = image.imageTilings.find((it) => it.tilingId === tiling);
            if (it) {
                await prisma.imageTiling.delete({ where: { id: it.id } });
                continue;
            }
            await prisma.image.update({
                where: { id: image.id },
                data: {
                    imageTilings: {
                        create: {
                            tiling: {
                                connect: { id: tiling },
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

        return json({ errors: null }, { status: 200 });
    }

    switch (formData.get("intent")) {
        case "tags": {
            const patterns = formData.getAll("pattern") as string[];
            const tag = formData.get("tag") as string;
            const haveTheTag = (
                await prisma.pattern.findMany({
                    where: {
                        id: { in: patterns },
                        tags: { some: { id: tag } },
                    },
                    select: { id: true },
                })
            ).map((p) => p.id);
            if (haveTheTag.length === patterns.length) {
                await Promise.all(
                    patterns.map((id) =>
                        prisma.tag.update({
                            where: { id: tag },
                            data: { patterns: { disconnect: { id } } },
                        })
                    )
                );
            } else {
                await Promise.all(
                    patterns
                        .filter((p) => !haveTheTag.includes(p))
                        .map((id) =>
                            prisma.tag.update({
                                where: { id: tag },
                                data: { patterns: { connect: { id } } },
                            })
                        )
                );
            }
            break;
        }
        case "tag:new": {
            const name = formData.get("tag") as string;
            const [one, two] = name.split(":");
            const args = two
                ? { category: one, name: two }
                : { name: one, category: "" };
            await prisma.tag.create({ data: args });
            break;
        }
        case "upload": {
            const image = formData.get("image") as any as NodeOnDiskFile;
            const url = `/uploads/${image.name}`;
            const source = formData.get("source") as string;
            const location = formData.get("location") as string;
            const date = formData.get("date") as string;
            await prisma.pattern.create({
                data: {
                    userId,
                    images: {
                        create: [
                            {
                                url,
                                source,
                                location,
                                date,
                            },
                        ],
                    },
                },
            });
            break;
        }
    }
    return json({ errors: null }, { status: 200 });
};
