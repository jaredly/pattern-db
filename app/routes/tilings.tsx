import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import {
    Filter,
    OrgMenu,
    ViewTilings,
    matchesFilter,
} from "./notes/ViewTilings";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";
import { ViewTiling } from "./notes/ViewTiling";
import { Tiling } from "geometricart/src/types";

export const loader = async ({ request }: LoaderArgs) => {
    return json({
        tilings: (
            await prisma.tiling.findMany({
                select: {
                    hash: true,
                    json: true,
                    id: true,
                    imageTilings: {
                        select: {
                            id: true,
                        },
                    },
                },
            })
        ).map((t) => ({ ...t, data: JSON.parse(t.json) as Tiling })),
    });
};

export default function Tilings() {
    const { tilings } = useLoaderData<typeof loader>();

    const tilingCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (let tiling of tilings) {
            counts[tiling.id] = tiling.imageTilings.length;
        }
        return counts;
    }, [tilings]);

    const [filter, setFilter] = useState([] as Filter[]);

    return (
        <div className="flex h-full min-h-screen flex-col">
            <header className="flex items-center justify-between bg-blue-gray-800 p-4 text-white">
                <h1 className="text-3xl font-bold">
                    <Link to="." className="px-4">
                        Notes
                    </Link>
                    <Link to="../tags" className="px-4 text-2xl">
                        Tags
                    </Link>
                </h1>
                <Form action="/logout" method="post">
                    <button
                        type="submit"
                        className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
                    >
                        Logout
                    </button>
                </Form>
            </header>

            <div>
                <OrgMenu
                    tilings={tilings}
                    filter={filter}
                    setFilter={setFilter}
                />
                <div className="flex flex-row flex-wrap">
                    {(filter.length
                        ? tilings.filter((t) =>
                              filter.some((f) => matchesFilter(f, t))
                          )
                        : tilings
                    )
                        .sort(
                            (a, b) =>
                                a.data.cache.segments.length -
                                b.data.cache.segments.length
                        )
                        .map((tiling) => (
                            <ViewTiling
                                key={tiling.id}
                                tiling={tiling}
                                count={tilingCounts[tiling.hash]}
                                selected={false}
                                onToggle={(sel) => {}}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
}
