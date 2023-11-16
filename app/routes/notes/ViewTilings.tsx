import { useMemo, useState } from "react";
import { ViewTiling } from "./ViewTiling";
import { Coord, Segment } from "geometricart/src/types";
import { coordKey } from "geometricart/src/rendering/coordKey";
import { segmentKey } from "geometricart/src/rendering/segmentKey";
import { organizeShapes } from "./organizeShapes";

import {
    Menu,
    MenuHandler,
    MenuList,
    MenuItem,
    Button,
} from "@material-tailwind/react";

const OrgMenu = ({
    tilings,
    filter,
    setFilter,
}: {
    tilings: { hash: string; json: string; id: string }[];
    filter: { tilings: string[]; shape: string }[];
    setFilter: (f: { tilings: string[]; shape: string }[]) => void;
}) => {
    const { fullOrg: org, byHash } = useMemo(
        () => organizeShapes(tilings),
        [tilings]
    );

    return (
        <div>
            <div className="flex flex-wrap p-1">
                <Menu>
                    <MenuHandler>
                        <Button>Filter by shape</Button>
                    </MenuHandler>
                    <MenuList>
                        {Object.entries(org)
                            .sort((a, b) => +a[0] - +b[0])
                            .map(([count, byConcavity]) => {
                                const sorted = Object.entries(byConcavity).sort(
                                    (a, b) => +a[0] - +b[0]
                                );

                                return (
                                    <Menu key={count} placement="right-start">
                                        <MenuHandler>
                                            <MenuItem className="flex">
                                                {count}
                                                {sorted
                                                    .slice(0, 3)
                                                    .map(([a, byPC]) =>
                                                        Object.values(byPC)
                                                            .slice(0, 1)
                                                            .map((m, i) =>
                                                                showShape(
                                                                    m[0].shape
                                                                        .segments,
                                                                    a + i + "",
                                                                    m[0].shape
                                                                        .origin,
                                                                    m[0]
                                                                        .tilings,
                                                                    20
                                                                )
                                                            )
                                                    )}
                                            </MenuItem>
                                        </MenuHandler>
                                        <MenuList
                                            onClick={(evt) => {
                                                evt.stopPropagation();
                                            }}
                                        >
                                            {sorted.map(
                                                ([conc, byPatternClass]) => (
                                                    <div
                                                        role="menuitem"
                                                        key={conc}
                                                        onClick={(evt) => {
                                                            evt.stopPropagation();
                                                        }}
                                                        className="flex flex-wrap max-w-lg hover:bg-transparent"
                                                    >
                                                        {Object.entries(
                                                            byPatternClass
                                                        )
                                                            .sort(
                                                                (one, two) => {
                                                                    const [
                                                                        a1,
                                                                        l1,
                                                                    ] =
                                                                        one[1][0]
                                                                            .patternClass;
                                                                    const [
                                                                        a2,
                                                                        l2,
                                                                    ] =
                                                                        two[1][0]
                                                                            .patternClass;
                                                                    if (
                                                                        a1 !==
                                                                        a2
                                                                    )
                                                                        return (
                                                                            a1 -
                                                                            a2
                                                                        );
                                                                    return (
                                                                        l1 - l2
                                                                    );
                                                                }
                                                            )
                                                            .map(
                                                                ([
                                                                    pc,
                                                                    shapes,
                                                                ]) =>
                                                                    // <MenuItem className="flex">
                                                                    shapes.map(
                                                                        (
                                                                            shape,
                                                                            i
                                                                        ) => {
                                                                            const selected =
                                                                                filter.some(
                                                                                    (
                                                                                        f
                                                                                    ) =>
                                                                                        f.shape ===
                                                                                        shape.hash
                                                                                );
                                                                            return (
                                                                                <Button
                                                                                    key={
                                                                                        pc +
                                                                                        ":" +
                                                                                        i
                                                                                    }
                                                                                    className={
                                                                                        "p-0 shadow-none " +
                                                                                        (selected
                                                                                            ? ""
                                                                                            : "bg-transparent")
                                                                                    }
                                                                                    onClick={(
                                                                                        evt
                                                                                    ) => {
                                                                                        evt.stopPropagation();
                                                                                        setFilter(
                                                                                            selected
                                                                                                ? filter.filter(
                                                                                                      (
                                                                                                          f
                                                                                                      ) =>
                                                                                                          f.shape !==
                                                                                                          shape.hash
                                                                                                  )
                                                                                                : filter.concat(
                                                                                                      {
                                                                                                          tilings:
                                                                                                              shape.tilings,
                                                                                                          shape: shape.hash,
                                                                                                      }
                                                                                                  )
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {" "}
                                                                                    {showShape(
                                                                                        shape
                                                                                            .shape
                                                                                            .segments,
                                                                                        pc +
                                                                                            i,
                                                                                        shape
                                                                                            .shape
                                                                                            .origin,
                                                                                        shape.tilings
                                                                                    )}
                                                                                </Button>
                                                                            );
                                                                        }
                                                                    )
                                                                // </MenuItem>
                                                            )}
                                                        {/* </MenuList> */}
                                                    </div>
                                                )
                                            )}
                                        </MenuList>
                                    </Menu>
                                );
                            })}
                    </MenuList>
                </Menu>
                {filter.map((f) => (
                    <div key={f.shape}>
                        <Button
                            onClick={() => {
                                setFilter(
                                    filter.filter((m) => m.shape !== f.shape)
                                );
                            }}
                            className="p-0 bg-transparent"
                        >
                            {showShape(
                                byHash[f.shape].shape.segments,
                                f.shape,
                                byHash[f.shape].shape.origin,
                                byHash[f.shape].tilings,
                                35
                            )}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function ViewTilings({
    tilings,
    tilingCounts,
    selectedTiling,
    setSelectedTiling,
}: {
    tilings: { hash: string; json: string; id: string }[];
    tilingCounts: Record<string, number>;
    selectedTiling: null | string;
    setSelectedTiling: (v: null | string) => void;
}) {
    const [filter, setFilter] = useState(
        [] as {
            tilings: string[];
            shape: string;
        }[]
    );

    return (
        <div className="w-64 min-w-max overflow-scroll">
            <OrgMenu tilings={tilings} filter={filter} setFilter={setFilter} />
            {(filter.length
                ? tilings.filter((t) =>
                      filter.some((f) => f.tilings.includes(t.id))
                  )
                : tilings
            ).map((tiling) => (
                <ViewTiling
                    key={tiling.id}
                    tiling={tiling}
                    count={tilingCounts[tiling.hash]}
                    selected={selectedTiling === tiling.id}
                    onToggle={(sel) =>
                        setSelectedTiling(sel ? tiling.id : null)
                    }
                />
            ))}
        </div>
    );
}

function showShape(
    segments: Segment[],
    hash: string,
    origin: Coord,
    ids: string[],
    size: number = 50
) {
    const { h, w, x0, y0 } = segmentsBounds(segments);
    return (
        <div key={hash} className="p-2 relative">
            <svg
                width={(size / h) * w}
                height={size}
                viewBox={`${x0.toFixed(2)} ${y0.toFixed(2)} ${w.toFixed(
                    2
                )} ${h.toFixed(2)}`}
            >
                <path
                    fill="red"
                    d={`M${origin.x.toFixed(2)} ${origin.y.toFixed(2)}${segments
                        .map(
                            (seg) =>
                                `L${seg.to.x.toFixed(2)} ${seg.to.y.toFixed(2)}`
                        )
                        .join("")}Z`}
                />
            </svg>
            {/* {ids.length > 1 ? (
                <div
                    className="absolute"
                    style={{
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                        textShadow: "1px 1px 2px white",
                    }}
                >
                    {ids.length}
                </div>
            ) : (
                ""
            )} */}
        </div>
    );
}

export function segmentsBounds(segments: Segment[]) {
    const pts = segments.map((s) => s.to);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x0 = xs.reduce((a, b) => Math.min(a, b), Infinity);
    const x1 = xs.reduce((a, b) => Math.max(a, b), -Infinity);
    const y0 = ys.reduce((a, b) => Math.min(a, b), Infinity);
    const y1 = ys.reduce((a, b) => Math.max(a, b), -Infinity);
    const h = y1 - y0;
    const w = x1 - x0;
    return { h, w, x0, y0 };
}
