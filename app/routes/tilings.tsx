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
import { ViewTiling, getSvgData, tilingSvg } from "./notes/ViewTiling";
import { Tiling } from "geometricart/src/types";
import { LoaderReturn } from "./notes/route";

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

const PREFIX = "<!-- TILING:";
const SUFFIX = "-->";

export const SimpleTiling = ({
    tiling,
}: {
    tiling: LoaderReturn["tilings"][0];
}) => {
    const { bounds, lines } = useMemo(() => getSvgData(tiling), [tiling]);

    return (
        <a
            href=""
            download={"tiling-" + tiling.hash + ".svg"}
            onClick={(evt) => {
                const txt = evt.currentTarget.innerHTML;
                const blob = new Blob([txt + PREFIX + tiling.json + SUFFIX], {
                    type: "image/svg+xml",
                });
                const url = URL.createObjectURL(blob);
                evt.currentTarget.href = url;
                setTimeout(() => {
                    evt.currentTarget.href = "";
                    URL.revokeObjectURL(url);
                }, 0);
            }}
        >
            {tilingSvg(bounds, lines)}
        </a>
    );
};

export default function Tilings() {
    const { tilings } = useLoaderData<typeof loader>();

    // const tilingCounts = useMemo(() => {
    //     const counts: Record<string, number> = {};
    //     for (let tiling of tilings) {
    //         counts[tiling.id] = tiling.imageTilings.length;
    //     }
    //     return counts;
    // }, [tilings]);

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
                            <div
                                key={tiling.id}
                                style={{
                                    position: "relative",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 5,
                                        left: 5,
                                        color: "white",
                                    }}
                                >
                                    {tiling.data.cache.segments.length}
                                </div>
                                <SimpleTiling tiling={tiling} />
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
