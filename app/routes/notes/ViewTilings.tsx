import { useMemo, useState } from "react";
import { ViewTiling } from "./ViewTiling";
import { Coord, Segment, Tiling } from "geometricart/src/types";
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
import { dist } from "geometricart/src/rendering/getMirrorTransforms";
import { closeEnough } from "geometricart/src/rendering/epsilonToZero";

export type Filter =
    | {
          type: "shape";
          tilings: string[];
          shape: string;
      }
    | { type: "ratio"; shape: ShapeKind };

export const OrgMenu = ({
    tilings,
    filter,
    setFilter,
}: {
    tilings: { hash: string; json: string; id: string }[];
    filter: Filter[];
    setFilter: (f: Filter[]) => void;
}) => {
    const { fullOrg: org, byHash } = useMemo(
        () => organizeShapes(tilings),
        [tilings]
    );
    console.log("render", filter);

    return (
        <div>
            <div className="flex flex-wrap p-1">
                <Menu>
                    <MenuHandler>
                        <Button>Filter by aspect ratio</Button>
                    </MenuHandler>
                    <MenuList>
                        <MenuItem
                            onClick={() => {
                                setFilter([
                                    ...filter,
                                    { type: "ratio", shape: "square" },
                                ]);
                            }}
                        >
                            Square
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setFilter([
                                    ...filter,
                                    { type: "ratio", shape: "rect" },
                                ]);
                            }}
                        >
                            Rect
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setFilter([
                                    ...filter,
                                    { type: "ratio", shape: "hex" },
                                ]);
                            }}
                        >
                            Hex
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setFilter([
                                    ...filter,
                                    { type: "ratio", shape: "other" },
                                ]);
                            }}
                        >
                            Other
                        </MenuItem>
                    </MenuList>
                </Menu>

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
                                                                                                          type: "shape",
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
                            className={
                                f.type === "shape" ? "p-0 bg-transparent" : ""
                            }
                        >
                            {f.type === "ratio"
                                ? f.shape
                                : showShape(
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

export type ShapeKind = "rect" | "square" | "hex" | "other";

export const matchesAspectRatio = (shape: ShapeKind, data: Tiling) => {
    if (data.shape.type === "parallellogram") {
        return shape === "rect";
    }
    if (data.shape.type === "right-triangle") {
        const one = dist(data.shape.start, data.shape.corner);
        const two = dist(data.shape.end, data.shape.corner);
        const hyp = dist(data.shape.start, data.shape.end);
        if (closeEnough(one, two)) {
            return shape === "square";
        }
        if (data.shape.rotateHypotenuse) {
            return shape === "rect";
        }
        if (closeEnough(hyp, one * 2) || closeEnough(hyp, two * 2)) {
            return shape === "hex";
        }
        return shape === "rect";
    }
    if (data.shape.type === "isocelese") {
        const one = dist(data.shape.first, data.shape.second);
        const two = dist(data.shape.third, data.shape.second);
        const three = dist(data.shape.first, data.shape.third);
        if (closeEnough(one, two) && closeEnough(one, three)) {
            return shape === "hex";
        }
    }
    return shape === "other";
};

export function ViewTilings({
    tilings,
    tilingCounts,
    selectedTiling,
    setSelectedTiling,
}: {
    tilings: { hash: string; json: string; id: string; data: Tiling }[];
    tilingCounts: Record<string, number>;
    selectedTiling: null | string;
    setSelectedTiling: (v: null | string) => void;
}) {
    const [filters, setFilter] = useState([] as Filter[]);

    return (
        <div className="w-64 min-w-max overflow-scroll">
            <OrgMenu tilings={tilings} filter={filters} setFilter={setFilter} />
            {(filters.length
                ? tilings.filter((tiling) =>
                      filters.some((filter) => matchesFilter(filter, tiling))
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

export function matchesFilter(
    filter: Filter,
    tiling: { hash: string; json: string; id: string; data: Tiling }
): unknown {
    return filter.type === "shape"
        ? filter.tilings.includes(tiling.id)
        : matchesAspectRatio(filter.shape, tiling.data);
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
