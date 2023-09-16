import { Input } from "@material-tailwind/react";
import type { ActionArgs, LoaderArgs, NodeOnDiskFile } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prisma } from "~/db.server";

import { parseMultipartFormData, uploadImages } from "~/models/upload.server";
import { requireUserId } from "~/session.server";

export const meta = () => [{ title: "Pattern Database" }];

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);

  const formData = await parseMultipartFormData(request, uploadImages);

  switch (formData.get("intent")) {
    case "tags": {
      console.log([...formData.entries()]);
      const patterns = formData.getAll("pattern") as string[];
      const tag = formData.get("tag") as string;
      const haveTheTag = (
        await prisma.pattern.findMany({
          where: { id: { in: patterns }, tags: { some: { id: tag } } },
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

export const loader = async ({ request }: LoaderArgs) => {
  return json({
    patterns: await prisma.pattern.findMany({
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
          },
        },
        links: {
          select: { id: true, kind: true, url: true },
        },
        tags: {
          select: { id: true, category: true, name: true },
        },
      },
    }),
    // images: await prisma.image.findMany(),
    tags: await prisma.tag.findMany(),
    links: await prisma.link.findMany(),
  });
};

type PatternSelected = Awaited<
  ReturnType<Awaited<ReturnType<typeof loader>>["json"]>
>["patterns"][0];

const lsText = (key: string) => {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(window.localStorage[key]);
  }, []);
  return {
    value,
    onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
      setValue((window.localStorage[key] = evt.target.value));
    },
  };
};

const customStyle = `input[type=checkbox]:checked + div {
    --tw-bg-opacity: 0.8;
    background-color: rgb(207 216 220 / var(--tw-bg-opacity));
}
label:hover > input[type=checkbox]:checked + div {
    --tw-bg-opacity: 1;
    background-color: rgb(207 216 220 / var(--tw-bg-opacity));
}`;

export default function NotesPage() {
  const { patterns, tags, links } = useLoaderData<typeof loader>();
  const form = useRef<HTMLFormElement>(null);
  const pform = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  //   const [check, setCheck] = useState({} as { [key: string]: boolean });
  const [tagSel, setTagSel] = useState({} as { [key: string]: boolean });
  const map = useMemo(() => {
    const map: { [key: string]: PatternSelected } = {};
    patterns.forEach((p) => (map[p.id] = p));
    return map;
  }, [patterns]);

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

      <main className="flex flex-col h-full bg-white overflow-scroll">
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
                style: { flexGrow: 0, width: 0, color: "white" },
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
                if (evt.currentTarget !== document.activeElement) {
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
          <style dangerouslySetInnerHTML={{ __html: customStyle }} />
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
            {patterns
              .slice()
              .reverse()
              .map((pattern) => (
                <Pattern pattern={pattern} key={pattern.id} />
              ))}
          </Form>
        </div>
        {/* <div className="h-full w-80 border-r bg-gray-50">
          <hr />
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div> */}
      </main>
    </div>
  );
}

const Zoomage = ({ src, className }: { src: string; className?: string }) => {
  const [pos, setPos] = useState(null as null | { x: number; y: number });

  return (
    <img
      onMouseLeave={() => setPos(null)}
      style={{
        objectFit: pos ? "none" : "contain",
        objectPosition: pos
          ? `${(pos.x * 100).toFixed(2)}% ${(pos.y * 100).toFixed(2)}%`
          : undefined,
      }}
      className={className}
      src={src}
      onMouseMove={(evt) => {
        const box = evt.currentTarget.getBoundingClientRect();
        const x = (evt.clientX - box.left) / box.width;
        const y = (evt.clientY - box.top) / box.height;
        setPos({ x, y });
      }}
    />
  );
};

function getTagMap(
  data: FormData,
  tags: { id: string; category: string; name: string }[],
  map: {
    [key: string]: {
      id: string;
      notes: string | null;
      images: {
        id: string;
        location: string | null;
        source: string | null;
        date: string | null;
        url: string;
      }[];
      links: { id: string; kind: string; url: string }[];
      tags: { id: string; category: string; name: string }[];
    };
  }
) {
  const selected = data.getAll("pattern") as string[];
  const tmap: { [key: string]: boolean } = {};
  if (selected.length) {
    tags.forEach(({ id }) => {
      let got = 0;
      let not = 0;
      selected.forEach((pid) => {
        const found = map[pid].tags.find((t) => t.id === id);
        if (found) {
          got++;
        } else {
          not++;
        }
      });
      if (got === selected.length) {
        tmap[id] = true;
      } else if (not !== selected.length) {
        tmap[id] = false;
      }
    });
  }
  return tmap;
}

function Pattern({ pattern }: { pattern: PatternSelected }) {
  const [idx, setIdx] = useState(0);
  const image = pattern.images[idx];
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
        <div className="w-64 hover:z-10 hover:bg-blue-gray-50 transition-colors p-8 cursor-pointer">
          <div className="relative">
            <Zoomage
              src={image.url}
              className="w-64 h-64 object-contain bg-black"
            />
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
                    setIdx(Math.min(pattern.images.length - 1, idx + 1))
                  }
                >
                  -&gt;
                </button>
              </div>
            ) : null}
          </div>
          <Link to={`/notes/${pattern.id}/design`}>Trace Pattern</Link>
          <div className="h-32 relative">
            <div>{image.date}</div>
            <div>{image.location}</div>
            <div className="break-all">{image.source?.slice(0, 50)}</div>
            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap text-xs">
              {pattern.tags.map((tag) => (
                <div
                  key={tag.id}
                  className="px-1 rounded-sm mr-1 bg-blue-gray-600 text-white mt-1"
                >
                  {tag.category ? tag.category + ":" + tag.name : tag.name}
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

const compareTags = (
  one: { name: string; category: string },
  two: { name: string; category: string }
) => {
  if (one.category < two.category) {
    return -1;
  }
  if (two.category < one.category) {
    return 1;
  }
  const onum = one.name.match(/^\d+/);
  const tnum = two.name.match(/^\d+/);
  if (onum && !tnum) {
    return -1;
  }
  if (tnum && !onum) {
    return 1;
  }
  if (onum && tnum) {
    return +onum[0] - +tnum[0];
  }
  return one.name < two.name ? -1 : one.name > two.name ? 1 : 0;
};
