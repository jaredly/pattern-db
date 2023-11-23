import { Link, useHref } from "@remix-run/react";
import { useState } from "react";
import { PatternSelected, HOST } from "./route";
import { Zoomage } from "./Zoomage";

export function Pattern({ pattern }: { pattern: PatternSelected }) {
    const [idx, setIdx] = useState(0);
    const image = pattern.images[idx];
    const href = useHref(".");
    if (!image) return null;
    return (
        <div key={pattern.id}>
            <label key={image.id}>
                <input
                    type="checkbox"
                    name="pattern"
                    value={pattern.id}
                    className="hidden"
                />
                <div className="w-64 hover:z-10 hover:bg-blue-gray-50 transition-colors p-8 cursor-pointer flex flex-col">
                    <div className="relative">
                        <Zoomage
                            src={image.url}
                            className="w-64 h-64 object-contain bg-black"
                        />
                        {image.imageTilings.map(({ tiling }) => (
                            <div
                                key={tiling.hash}
                                style={{
                                    backgroundColor: "#afa",
                                }}
                            >
                                {tiling.hash.slice(0, 10)}
                            </div>
                        ))}
                        {pattern.images.length > 1 ? (
                            <div className="absolute bottom-0 left-0 right-0">
                                <button
                                    type="button"
                                    className="bg-white"
                                    onClick={() => setIdx(Math.max(0, idx - 1))}
                                >
                                    &lt;-
                                </button>
                                <button
                                    type="button"
                                    className="bg-white"
                                    onClick={() =>
                                        setIdx(
                                            Math.min(
                                                pattern.images.length - 1,
                                                idx + 1
                                            )
                                        )
                                    }
                                >
                                    -&gt;
                                </button>
                            </div>
                        ) : null}
                    </div>
                    {/* <Link to={`/notes/${pattern.images[0].id}/design`}> */}
                    <Link
                        to={`http://localhost:5173/?save=${encodeURIComponent(
                            HOST + "/notes/save/" + pattern.images[0].id
                        )}&load=${encodeURIComponent(
                            "http://localhost:3000" +
                                pattern.images[0].url +
                                ".json"
                        )}&back=${encodeURIComponent(
                            HOST + href
                        )}&image=${encodeURIComponent(
                            "http://localhost:3000" + pattern.images[0].url
                        )}`}
                        className={
                            "hover:bg-blue-gray-100 px-4 py-2 mt-1 self-stretch text-center " +
                            (pattern.images[0].hasJson
                                ? "bg-brown-400"
                                : "bg-deep-orange-400 text-white")
                        }
                    >
                        {pattern.images[0].hasJson
                            ? "Update trace"
                            : "Create trace"}
                    </Link>
                    <div className="h-32 relative">
                        <div>{image.date}</div>
                        <div>{image.location}</div>
                        {image.source ? (
                            <div className="break-all">
                                <a href={image.source} target="_blank">
                                    {image.source.slice(0, 50)}
                                </a>
                            </div>
                        ) : (
                            "no source"
                        )}
                        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap text-xs">
                            {pattern.tags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="px-1 rounded-sm mr-1 bg-blue-gray-600 text-white mt-1"
                                >
                                    {tag.category
                                        ? tag.category + ":" + tag.name
                                        : tag.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </label>
            {/* ))} */}
        </div>
    );
}
