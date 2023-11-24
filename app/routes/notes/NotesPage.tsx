import { Input } from "@material-tailwind/react";
import {
    Form,
    Link,
    SubmitFunction,
    useLoaderData,
    useSubmit,
} from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pattern } from "./Pattern";
import { PatternSelected, compareTags, lsText, customStyle } from "./route";
import { getTagMap } from "./getTagMap";
import { loader } from "./loader";
import { ViewTilings } from "./ViewTilings";
import { SerializeFrom, TypedResponse } from "@remix-run/node";

export default function NotesPage() {
    const { patterns, tags, links, tilings } = useLoaderData<typeof loader>();
    const form = useRef<HTMLFormElement>(null);
    const pform = useRef<HTMLFormElement>(null);
    const submit = useSubmit();
    const [tagSel, setTagSel] = useState({} as { [key: string]: boolean });
    const map = useMemo(() => {
        const map: { [key: string]: PatternSelected } = {};
        patterns.forEach((p) => (map[p.id] = p));
        return map;
    }, [patterns]);

    const [tick, setTick] = useState(0);

    const sortedPatterns = useMemo(() => {
        return tick > 0
            ? sortPatterns(patterns.slice())
            : patterns.slice().reverse();
    }, [patterns, tick]);

    useEffect(() => {
        if (pform.current) {
            setTagSel(getTagMap(new FormData(pform.current), tags, map));
        }
    }, [patterns, tags, map]);

    useEffect(() => {
        const k = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") {
                pform.current!.querySelectorAll("input").forEach((input) => {
                    input.checked = false;
                });
            }
        };
        const paste = (evt: ClipboardEvent) => {
            const files = evt.clipboardData?.files;
            if (files?.length === 1) {
                const fd = new FormData(form.current!);
                fd.set("image", files[0]);
                fd.set("intent", "upload");
                submit(fd, { encType: "multipart/form-data", method: "post" });
            }
        };
        document.body.addEventListener("paste", paste);
        document.body.addEventListener("keydown", k);
        return () => {
            document.body.removeEventListener("paste", paste);
            document.body.removeEventListener("keydown", k);
        };
    }, []);

    const tilingCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        patterns.forEach((pattern) => {
            pattern.images.forEach((image) => {
                image.imageTilings.forEach((tl) => {
                    counts[tl.tiling.hash] = (counts[tl.tiling.hash] || 0) + 1;
                });
            });
        });
        return counts;
    }, [patterns]);

    const [selectedTiling, setSelectedTiling] = useState(null as null | string);

    const patterened = patterns.filter((f) =>
        f.images.some((i) => i.imageTilings.length)
    );

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

            <main className="flex flex-row flex-1 bg-white min-h-0">
                <ViewTilings
                    tilings={tilings}
                    tilingCounts={tilingCounts}
                    selectedTiling={selectedTiling}
                    setSelectedTiling={setSelectedTiling}
                />
                <div className="flex flex-col overflow-scroll">
                    <Tags submit={submit} tags={tags} tagSel={tagSel} />
                    <div className="flex flex-wrap">
                        <Form
                            ref={form}
                            method="post"
                            className="space-y-3 mb-6 w-64 p-4"
                            encType="multipart/form-data"
                        >
                            <input
                                type="file"
                                name="image"
                                onChange={(evt) => {
                                    const fd = new FormData(evt.target.form!);
                                    fd.set("intent", "upload");
                                    submit(fd, {
                                        encType: "multipart/form-data",
                                        method: "post",
                                    });
                                }}
                            />
                            <Input
                                name="source"
                                label="Source (Book, URL, etc.)"
                                onMouseDown={(evt) => {
                                    if (
                                        evt.currentTarget !==
                                        document.activeElement
                                    ) {
                                        evt.preventDefault();
                                        evt.currentTarget.focus();
                                        evt.currentTarget.selectionStart = 0;
                                        evt.currentTarget.selectionEnd =
                                            evt.currentTarget.value.length;
                                        //
                                    }
                                }}
                                crossOrigin={undefined}
                                {...lsText("pdb:source")}
                            />
                            <Input
                                name="location"
                                label="Location"
                                crossOrigin={undefined}
                                {...lsText("pdb:location")}
                            />
                            <Input
                                name="date"
                                label="Date"
                                crossOrigin={undefined}
                                {...lsText("pdb:date")}
                            />
                            <button name="intent" value="upload">
                                Upload
                            </button>
                        </Form>
                        <style
                            dangerouslySetInnerHTML={{ __html: customStyle }}
                        />
                        <Form
                            id="patterns"
                            method="post"
                            className="contents"
                            encType="multipart/form-data"
                            ref={pform}
                            onChange={(evt) => {
                                const data = new FormData(evt.currentTarget);
                                setTagSel(getTagMap(data, tags, map));
                            }}
                        >
                            <input type="hidden" name="intent" value="tags" />
                            <div>
                                {patterened.length +
                                    "/" +
                                    patterns.length +
                                    " patterned images"}
                                <button
                                    style={{ display: "block" }}
                                    type="button"
                                    onClick={() => setTick(tick + 1)}
                                >
                                    Randomize
                                </button>
                            </div>
                            {sortedPatterns
                                .filter(
                                    selectedTiling
                                        ? (p) =>
                                              p.images.some((i) =>
                                                  i.imageTilings.some(
                                                      (it) =>
                                                          it.tiling.id ===
                                                          selectedTiling
                                                  )
                                              )
                                        : (p) =>
                                              !p.images.some(
                                                  (i) => i.imageTilings.length
                                              )
                                )
                                .map((pattern) => (
                                    <Pattern
                                        pattern={pattern}
                                        key={pattern.id}
                                    />
                                ))}
                        </Form>
                    </div>
                </div>
            </main>
        </div>
    );
}

const sortPatterns = (p: SerializeFrom<typeof loader>["patterns"]) => {
    return p
        .map((_, i) => [Math.random(), i])
        .sort((a, b) => a[0] - b[0])
        .map(([_, i]) => p[i]);
    // return p.reverse()
};

const Tags = ({
    submit,
    tags,
    tagSel,
}: {
    submit: SubmitFunction;
    tags: { id: string; category: string; name: string }[];
    tagSel: { [key: string]: boolean };
}) => {
    return (
        <div className="self-stretch sticky top-0 bg-blue-gray-500 text-white mb-4 z-20 p-2 flex items-baseline flex-wrap">
            <Form
                method="post"
                className="flex items-baseline"
                encType="multipart/form-data"
            >
                <Input
                    label="New Tag"
                    name="tag"
                    crossOrigin={null}
                    containerProps={{
                        style: {
                            flexGrow: 0,
                            width: 0,
                            color: "white",
                        },
                        className: "ml-2 mr-2",
                    }}
                    onKeyDown={(evt) => {
                        if (evt.key === "Enter") {
                            const fd = new FormData(evt.currentTarget.form!);
                            fd.set("intent", "tag:new");
                            submit(fd, {
                                encType: "multipart/form-data",
                                method: "post",
                            });
                            evt.currentTarget.value = "";
                            evt.preventDefault();
                        }
                    }}
                    style={{ color: "white" }}
                    labelProps={{
                        style: {
                            color: "white",
                        },
                    }}
                />
                <button
                    name="intent"
                    value="tag:new"
                    className="p-2 hover:bg-blue-gray-300 rounded"
                >
                    Create Tag
                </button>
            </Form>
            {tags.sort(compareTags).map((tag) => (
                <button
                    key={tag.id}
                    className={
                        `p-2 hover:bg-blue-gray-300 rounded mr-1 ` +
                        (tagSel[tag.id]
                            ? " bg-blue-gray-200"
                            : tagSel[tag.id] === false
                            ? " bg-blue-gray-400"
                            : "")
                    }
                    name="tag"
                    value={tag.id}
                    form="patterns"
                >
                    {tag.category ? tag.category + ":" + tag.name : tag.name}
                </button>
            ))}
        </div>
    );
};
